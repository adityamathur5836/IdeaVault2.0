import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Performance optimization: Cache for embeddings and reports
const embeddingCache = new Map();
const reportCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// Request timeout configuration
const REQUEST_TIMEOUT = 20000; // 20 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Quota tracking
let quotaUsage = {
  embeddings: 0,
  reports: 0,
  lastReset: Date.now()
};

/**
 * Create a timeout promise for API calls
 */
function createTimeoutPromise(timeout) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), timeout);
  });
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
async function withRetry(fn, attempts = RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      console.warn(`Retry attempt ${i + 1}/${attempts} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, i)));
    }
  }
}
// Ensure no undefined/null/empty strings leak into UI
function sanitizeReport(report) {
  const clean = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.filter(v => v && String(v).trim() !== "");
    if (typeof value === "object") {
      const out = {};
      for (const k of Object.keys(value)) out[k] = clean(value[k]);
      return out;
    }
    // Use RegExp constructor to avoid parser issues with escaped slashes
    const placeholderPattern = new RegExp("undefined|N/A|TBD", "gi");
    return String(value).replace(placeholderPattern, "").trim();
  };

  const sanitized = clean(report);
  if (!Array.isArray(sanitized?.market_intelligence?.key_players) || sanitized.market_intelligence.key_players.length === 0) {
    // Keep field but empty array to avoid "undefined"
    if (!sanitized.market_intelligence) sanitized.market_intelligence = {};
    sanitized.market_intelligence.key_players = [];
    // If there are no key players, ensure competitive_landscape explicitly communicates this and provides a viability note
    const strengthsCount = Array.isArray(sanitized?.evaluation?.strengths) ? sanitized.evaluation.strengths.length : 0;
    const risksCount = Array.isArray(sanitized?.evaluation?.risks) ? sanitized.evaluation.risks.length : 0;
    const viability = strengthsCount > risksCount ? "seems viable if executed well" : "has uncertain viability and would require careful validation";
    const topRisk = Array.isArray(sanitized?.evaluation?.risks) && sanitized.evaluation.risks[0] ? ` Key risk: ${sanitized.evaluation.risks[0]}.` : "";
    const topStrength = Array.isArray(sanitized?.evaluation?.strengths) && sanitized.evaluation.strengths[0] ? ` Advantage: ${sanitized.evaluation.strengths[0]}.` : "";
    sanitized.market_intelligence.competitive_landscape = `There are no companies currently doing this exact thing. Based on the analysis, the idea ${viability}.${topStrength}${topRisk}`.trim();
  }
  return sanitized;
}

/**
 * Check and update quota usage
 */
function updateQuotaUsage(type) {
  const now = Date.now();
  // Reset quota every hour
  if (now - quotaUsage.lastReset > 60 * 60 * 1000) {
    quotaUsage = { embeddings: 0, reports: 0, lastReset: now };
  }
  quotaUsage[type]++;
}

/**
 * Find real competitors using a focused Gemini query
 * @param {Object} idea
 * @returns {Promise<string[]>}
 */
async function fetchCompetitorsWithGemini(idea) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { temperature: 0.3, topK: 40, topP: 0.9, maxOutputTokens: 1024 }
  });

  const competitorPrompt = `List 5-10 real companies, products, or organizations that operate in the same niche or solve the same or closely related problem as the following business.

Business: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Target audience: ${idea.target_audience}

Rules:
- Return ONLY a JSON array of strings where each string is the company/product name (e.g., ["Company A", "Product B"]).
- Use only real names. Do not invent placeholders. If there are truly no direct competitors, return an empty JSON array [] but prefer adjacent or substitute solutions when reasonable.`;

  const result = await withRetry(async () => {
    return await Promise.race([
      model.generateContent(competitorPrompt),
      createTimeoutPromise(REQUEST_TIMEOUT)
    ]);
  });

  const text = result?.response?.text?.() || "";
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const json = match ? match[0] : text;
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter(x => typeof x === "string" && x.trim()).map(x => x.trim()) : [];
  } catch (_) {
    console.warn("Failed to parse competitors JSON, raw:", text?.slice(0, 200));
    return [];
  }
}

/**
 * Check if quota is exceeded
 */
function isQuotaExceeded(type) {
  const limits = { embeddings: 1000, reports: 100 }; // Per hour limits
  return quotaUsage[type] >= limits[type];
}

/**
 * Generate embeddings using Gemini"s embedding model
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateGeminiEmbedding(text) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY === "your_google_gemini_api_key_here") {
      console.error("Gemini API key not configured");
      throw new Error("Gemini API key not configured");
    }

    // Check quota
    if (isQuotaExceeded("embeddings")) {
      console.warn("Embedding quota exceeded, using fallback");
      throw new Error("Quota exceeded");
    }

    // Check cache first
    const cacheKey = `embedding_${text.substring(0, 100)}`;
    const cached = embeddingCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("Using cached embedding");
      return cached.data;
    }

    // Use Gemini"s embedding model
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    // Use timeout and retry mechanism
    const result = await withRetry(async () => {
      return await Promise.race([
        model.embedContent(text),
        createTimeoutPromise(REQUEST_TIMEOUT)
      ]);
    });

    if (!result.embedding || !result.embedding.values) {
      throw new Error("Invalid embedding response from Gemini");
    }

    const embedding = result.embedding.values;

    // Cache the result
    embeddingCache.set(cacheKey, {
      data: embedding,
      timestamp: Date.now()
    });

    // Update quota
    updateQuotaUsage("embeddings");

    return embedding;
  } catch (error) {
    console.error("Error generating Gemini embedding:", error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate search query from structured data
 * @param {Object} data - Structured form data or prompt
 * @returns {string} - Search query string
 */
export function generateSearchQuery(data) {
  if (data.type === "freeform" && data.prompt) {
    // Emphasize industry/domain keywords and de-emphasize generic phrasing
    const base = data.prompt.trim();
    return `${base}. Focus industry/domain extraction and generate ideas ONLY within that domain.`;
  }
  
  // Build query from structured data
  const parts = [];
  
  if (data.category) parts.push(`${data.category} business`);
  if (data.difficulty) parts.push(`${data.difficulty} difficulty`);
  if (data.targetAudience) parts.push(`for ${data.targetAudience}`);
  if (data.budget) parts.push(`budget ${data.budget}`);
  if (data.timeline) parts.push(`timeline ${data.timeline}`);
  if (data.interests) parts.push(`interests: ${data.interests}`);
  
  return parts.join(" ") || "innovative business idea";
}

/**
 * Synthesize novel business ideas using Gemini
 * @param {Array} matchedIdeas - Array of matched ideas from vector search
 * @param {string} userInput - Original user input/prompt
 * @param {number} count - Number of new ideas to generate
 * @returns {Promise<Array>} - Array of synthesized business ideas
 */
export async function synthesizeIdeasWithGemini(matchedIdeas, userInput, count = 2) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY === "your_google_gemini_api_key_here") {
      console.log("Gemini API key not configured, skipping AI synthesis");
      return [];
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });

    // Prepare context from matched ideas
    const ideaContext = matchedIdeas.slice(0, 5).map(idea => 
      `- ${idea.title}: ${idea.description}`
    ).join("\n");

    const prompt = `Generate ${count} innovative business ideas for: "${userInput}"

Context: ${ideaContext}

Requirements:
- Practical, implementable ideas with clear market potential
- Unique value propositions and competitive advantages
- Consider current trends and technology
- Ideas MUST be relevant to the user"s described industry/domain. Reject unrelated industries.

Format each idea as JSON object with:
- title: Business name/concept (max 60 chars)
- description: 2-3 sentence value proposition
- category: [Technology, Healthcare, Finance, Education, E-commerce, Food & Drink, Travel, Entertainment, Productivity, Social, Gaming, Sports, News, Business, Marketing, Design]
- target_audience: Specific user group
- difficulty: [easy, medium, hard]
- key_innovation: What makes it unique (1 sentence)
- tags: Array of 3-5 keywords
- market_potential: Brief market assessment

Return ONLY valid JSON array of ${count} objects.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    if (!response) {
      console.error("No response from Gemini API");
      return [];
    }

    // Try to parse JSON response
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;
      
      const ideas = JSON.parse(jsonString);
      
      return Array.isArray(ideas) ? ideas.map((idea, index) => ({
        ...idea,
        id: `gemini_${Date.now()}_${index}`,
        source: "gemini_synthesis",
        upvotes: 0,
        similarity: 0.95, // High relevance since it"s custom generated
        generated_at: new Date().toISOString()
      })) : [];
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.log("Raw response:", response);
      
      // Fallback: extract ideas from text response
      return parseIdeasFromText(response, userInput, count);
    }

  } catch (error) {
    console.error("Error synthesizing ideas with Gemini:", error);
    return [];
  }
}

/**
 * Fallback parser for non-JSON responses
 * @param {string} text - Raw text response from Gemini
 * @param {string} userInput - Original user input
 * @param {number} count - Number of ideas to extract
 * @returns {Array} - Parsed business ideas
 */
function parseIdeasFromText(text, userInput, count) {
  try {
    const lines = text.split("\n").filter(line => line.trim());
    const ideas = [];
    
    let currentIdea = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Look for title patterns
      if (trimmed.match(/^\d+\./) || trimmed.toLowerCase().includes("title:") || trimmed.match(/^[A-Z][^.]*$/)) {
        if (currentIdea.title) {
          ideas.push(currentIdea);
          currentIdea = {};
        }
        currentIdea.title = trimmed.replace(/^\d+\./, "").replace(/title:/i, "").trim();
      } else if (trimmed.toLowerCase().includes("description:")) {
        currentIdea.description = trimmed.replace(/description:/i, "").trim();
      } else if (trimmed.toLowerCase().includes("category:")) {
        currentIdea.category = trimmed.replace(/category:/i, "").trim();
      } else if (trimmed.toLowerCase().includes("target") && trimmed.toLowerCase().includes("audience")) {
        currentIdea.target_audience = trimmed.replace(/target audience:/i, "").trim();
      } else if (trimmed.toLowerCase().includes("difficulty:")) {
        currentIdea.difficulty = trimmed.replace(/difficulty:/i, "").trim();
      }
    }
    
    if (currentIdea.title) {
      ideas.push(currentIdea);
    }
    
    // Fill in missing fields and format
    return ideas.slice(0, count).map((idea, index) => ({
      id: `gemini_${Date.now()}_${index}`,
      title: idea.title || `AI-Generated Idea ${index + 1}`,
      description: idea.description || `Innovative solution based on: ${userInput}`,
      category: idea.category || "Technology",
      target_audience: idea.target_audience || "General",
      difficulty: idea.difficulty || "medium",
      tags: [idea.category || "Technology", "AI-Generated", "Innovation"],
      key_innovation: "AI-generated innovative approach",
      market_potential: "Significant market opportunity",
      source: "gemini_synthesis",
      upvotes: 0,
      similarity: 0.9,
      generated_at: new Date().toISOString()
    }));
    
  } catch (error) {
    console.error("Error parsing ideas from text:", error);
    return [];
  }
}

/**
 * Generate comprehensive business report using Gemini
 * @param {Object} idea - The business idea object
 * @returns {Promise<Object>} - Detailed business report with multiple sections
 */
export async function generateIdeaReportWithGemini(idea) {
  try {
    if (!process.env.GOOGLE_GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY === "your_google_gemini_api_key_here") {
      throw new Error("Gemini API key not configured");
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    });

    const prompt = `Create a business analysis report for: ${idea.title}

Description: ${idea.description}
Category: ${idea.category}
Target Audience: ${idea.target_audience}
Difficulty: ${idea.difficulty}

Return JSON object with these sections:

{
  "business_concept": {
    "elevator_pitch": "2-3 paragraph pitch explaining the business",
    "problem_statement": "Problem this business solves",
    "solution_overview": "How solution addresses the problem",
    "value_proposition": "Clear value proposition",
    "target_customers": "Target customer segments"
  },
  "market_intelligence": {
    "market_size": "Global and/or regional market size figures with source context",
    "market_trends": ["3-6 current quantified market trends"],
    "competitive_landscape": "Summary of competitive dynamics and positioning",
    "key_players": ["List at least 5 named competitors or products in this specific niche"],
    "market_opportunity": "Specific quantified opportunities (segments, geos, ICPs)"
  },
  "product_strategy": {
    "core_features": ["Feature 1", "Feature 2", "Feature 3"],
    "development_roadmap": "Development timeline",
    "technology_requirements": "Tech stack requirements",
    "mvp_scope": "MVP features"
  },
  "go_to_market": {
    "target_audience": "Target audience analysis",
    "marketing_strategy": "Marketing approach",
    "pricing_model": "Pricing strategy",
    "launch_plan": "6-month launch timeline"
  },
  "financial_foundation": {
    "startup_costs": "Initial investment breakdown",
    "revenue_projections": "3-year revenue projections",
    "cost_structure": "Operational costs",
    "funding_strategy": "Funding requirements"
  },
  "evaluation": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "risks": ["Risk 1", "Risk 2", "Risk 3"],
    "success_metrics": ["Metric 1", "Metric 2", "Metric 3"],
    "recommendations": ["Rec 1", "Rec 2", "Rec 3"]
  },
  "visualizations": {
    "three_d_models": {
      "market_positioning_scatter": {
        "description": "3D scatter of competitors vs idea (Market Share %, Growth Rate %, Differentiation score)",
        "axes": ["market_share", "growth_rate", "differentiation"],
        "points": [
          { "name": "Idea", "market_share": 0.0, "growth_rate": 0.0, "differentiation": 0.0 },
          { "name": "Competitor A", "market_share": 0.0, "growth_rate": 0.0, "differentiation": 0.0 }
        ]
      },
      "efficiency_potential_surface": {
        "description": "Grid for efficiency vs potential across market maturity (z as potential)",
        "axes": ["efficiency", "market_maturity", "potential"],
        "grid": {
          "x": [0.2, 0.4, 0.6, 0.8, 1.0],
          "y": [0.2, 0.4, 0.6, 0.8, 1.0],
          "z": [
            [0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0]
          ]
        }
      }
    }
  }
}

Important rules:
- Use only real-world data and company names. Do not invent placeholder text like "Competitor 1" or "undefined".
- If data is uncertain, provide the best widely-cited estimate and clearly note assumptions.
- key_players MUST be an array of 5-10 real named competitors; omit only if truly none exist for niche.
- Ensure every field is non-empty and human-readable. Avoid "N/A", "TBD", "undefined".
- If there are truly no direct competitors in this niche, set market_intelligence.key_players to an empty array [], and set market_intelligence.competitive_landscape to a simple, plain-English sentence stating there are no companies doing this, followed by a brief viability assessment (whether the idea or something similar could work and why/why not).
 - Populate visualizations.three_d_models with realistic, non-zero values derived from known market data and your analysis; when using estimates, note assumptions in comments within descriptions.
Return ONLY the JSON object.`;

    console.log("Calling Gemini API for report generation...");
    const result = await model.generateContent(prompt);
    console.log("Gemini API call completed");

    const response = result.response.text();
    console.log("Response received, length:", response?.length);

    if (!response) {
      throw new Error("No response from Gemini API");
    }

    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : response;

      // Parse raw first, enrich, then sanitize
      let reportDataRaw = JSON.parse(jsonString);

      // If no competitors were returned, try a dedicated competitor discovery step
      const players = reportDataRaw?.market_intelligence?.key_players;
      if (!Array.isArray(players) || players.length === 0) {
        try {
          const discovered = await fetchCompetitorsWithGemini(idea);
          if (Array.isArray(discovered) && discovered.length > 0) {
            if (!reportDataRaw.market_intelligence) reportDataRaw.market_intelligence = {};
            reportDataRaw.market_intelligence.key_players = discovered;
            const list = discovered.slice(0, 3).join(", ");
            const base = reportDataRaw.market_intelligence.competitive_landscape || "";
            reportDataRaw.market_intelligence.competitive_landscape = base && base.includes("no companies")
              ? `Key players include ${list} and others.`
              : (base || `Key players include ${list} and others.`);
          }
        } catch (e) {
          console.warn("Competitor discovery fallback failed:", e?.message);
        }
      }

      // Ensure visualizations scaffold exists if missing
      if (!reportDataRaw.visualizations || !reportDataRaw.visualizations.three_d_models) {
        reportDataRaw.visualizations = reportDataRaw.visualizations || {};
        reportDataRaw.visualizations.three_d_models = reportDataRaw.visualizations.three_d_models || {
          market_positioning_scatter: {
            description: "3D scatter of competitors vs idea (Market Share %, Growth Rate %, Differentiation score)",
            axes: ["market_share", "growth_rate", "differentiation"],
            points: []
          },
          efficiency_potential_surface: {
            description: "Grid for efficiency vs potential across market maturity (z as potential)",
            axes: ["efficiency", "market_maturity", "potential"],
            grid: { x: [0.2,0.4,0.6,0.8,1.0], y: [0.2,0.4,0.6,0.8,1.0], z: [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]] }
          }
        };
      }

      const reportData = sanitizeReport(reportDataRaw);

      // Generate MVP prompt for Lovable/Bolt
      const mvpPrompt = await generateMVPPrompt(idea, reportData);

      return {
        ...reportData,
        mvp_prompt: mvpPrompt,
        generated_at: new Date().toISOString(),
        model: "gemini-2.5-flash",
        idea_id: idea.id
      };

    } catch (parseError) {
      console.error("Failed to parse Gemini report response as JSON:", parseError);
      console.log("Raw response:", response);

      // Return a structured fallback report with MVP prompt
      const fallbackReport = sanitizeReport(generateFallbackReport(idea, response));
      const mvpPrompt = generateFallbackMVPPrompt(idea);
      return {
        ...fallbackReport,
        mvp_prompt: mvpPrompt
      };
    }

  } catch (error) {
    console.error("Error generating idea report with Gemini:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });

    // Check for specific Gemini API errors and provide fallbacks
    if (error.message.includes("quota") || error.message.includes("QUOTA_EXCEEDED") || error.status === 429) {
      console.warn("API quota exceeded, returning fallback report");
      const fallbackReport = generateFallbackReport(idea, "API quota exceeded - using fallback report");
      const mvpPrompt = generateFallbackMVPPrompt(idea);
      return {
        ...fallbackReport,
        mvp_prompt: mvpPrompt,
        generated_at: new Date().toISOString(),
        model: "gemini-2.5-flash-quota-fallback",
        idea_id: idea.id,
        note: "Generated using fallback due to API quota limits"
      };
    }

    if (error.message.includes("API key") || error.status === 401) {
      throw new Error("API key not configured or invalid");
    }

    if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
      throw new Error("Content was blocked by safety filters. Please try a different idea.");
    }

    if (error.message.includes("404") || error.message.includes("not found")) {
      console.warn("Model not found, returning fallback report");
      const fallbackReport = generateFallbackReport(idea, "Model not available - using fallback report");
      const mvpPrompt = generateFallbackMVPPrompt(idea);
      return {
        ...fallbackReport,
        mvp_prompt: mvpPrompt,
        generated_at: new Date().toISOString(),
        model: "gemini-2.5-flash-model-fallback",
        idea_id: idea.id,
        note: "Generated using fallback due to model availability"
      };
    }

    throw new Error(`Failed to generate business report: ${error.message}`);
  }
}

/**
 * Generate intelligent fallback report structure when JSON parsing fails
 * @param {Object} idea - The business idea
 * @param {string} rawResponse - Raw Gemini response
 * @returns {Object} - Structured report object
 */
function generateFallbackReport(idea, rawResponse) {
  // Generate category-specific insights
  const categoryInsights = getCategorySpecificInsights(idea.category);
  const audienceInsights = getAudienceSpecificInsights(idea.target_audience);
  const difficultyInsights = getDifficultySpecificInsights(idea.difficulty);

  return {
    business_concept: {
      elevator_pitch: `${idea.title} revolutionizes the ${idea.category.toLowerCase()} industry by ${idea.description.toLowerCase()}. Specifically designed for ${idea.target_audience.toLowerCase()}, this ${difficultyInsights.complexity} solution addresses critical pain points that current market offerings fail to solve. By leveraging ${categoryInsights.keyTechnology}, we create a seamless experience that ${categoryInsights.valueProposition}. Our unique approach combines ${categoryInsights.differentiator} with user-centric design, positioning us to capture significant market share in the rapidly growing ${idea.category.toLowerCase()} sector.`,

      problem_statement: `${idea.target_audience} face significant challenges in ${categoryInsights.problemArea}. Current solutions are ${categoryInsights.currentLimitations}, leaving users frustrated with ${categoryInsights.painPoints}. Market research indicates that ${audienceInsights.marketGap}, creating a substantial opportunity for innovation. The ${idea.category.toLowerCase()} industry lacks ${categoryInsights.missingElement}, which directly impacts user satisfaction and business outcomes.`,

      solution_overview: `${idea.title} solves these problems through ${categoryInsights.solutionApproach}. Our platform integrates ${categoryInsights.coreCapabilities} to deliver ${audienceInsights.desiredOutcome}. The solution features ${difficultyInsights.technicalApproach} and provides ${categoryInsights.keyBenefits}. By focusing on ${audienceInsights.primaryNeed}, we ensure maximum user adoption and retention.`,

      value_proposition: `We deliver ${categoryInsights.uniqueValue} through ${categoryInsights.deliveryMethod}. Users experience ${audienceInsights.valueRealization} while reducing ${categoryInsights.costSavings}. Our competitive advantage lies in ${categoryInsights.competitiveEdge}, making us the preferred choice for ${idea.target_audience.toLowerCase()} seeking ${categoryInsights.desiredOutcome}.`,

      target_customers: `Primary customers include ${audienceInsights.primarySegment} who ${audienceInsights.behaviorProfile}. Secondary markets encompass ${audienceInsights.secondarySegment} and ${audienceInsights.tertiarySegment}. Our ideal customer profile shows ${audienceInsights.demographics} with ${audienceInsights.psychographics}. These users typically ${audienceInsights.usagePattern} and value ${audienceInsights.keyValues}.`
    },

    market_intelligence: {
      market_size: `The global ${idea.category.toLowerCase()} market is valued at ${categoryInsights.marketSize} and growing at ${categoryInsights.growthRate} annually. The ${idea.target_audience.toLowerCase()} segment represents ${audienceInsights.segmentSize} of this market, with particularly strong growth in ${categoryInsights.growthAreas}. Regional analysis shows ${categoryInsights.regionalTrends}, indicating substantial expansion opportunities.`,

      market_trends: categoryInsights.marketTrends,

      competitive_landscape: (() => {
        const players = Array.isArray(categoryInsights.majorCompetitorsList) ? categoryInsights.majorCompetitorsList : [];
        if (players.length === 0) {
          const strengthsCount = Array.isArray(categoryInsights.strengths) ? categoryInsights.strengths.length : 0;
          const risksCount = Array.isArray(categoryInsights.risks) ? categoryInsights.risks.length : 0;
          const viability = strengthsCount > risksCount ? "seems viable if executed well" : "has uncertain viability and would require careful validation";
          return `There are no companies currently doing this exact thing. Based on the analysis, the idea ${viability}.`;
        }
        return `The ${idea.category.toLowerCase()} space features ${categoryInsights.competitorTypes} ranging from ${categoryInsights.establishedPlayers} to ${categoryInsights.emergingCompetitors}.`;
      })(),
      key_players: Array.isArray(categoryInsights.majorCompetitorsList) ? categoryInsights.majorCompetitorsList : [],

      market_opportunity: `Significant whitespace exists in ${categoryInsights.opportunityArea} where current solutions ${categoryInsights.marketGap}. The convergence of ${categoryInsights.convergenceTrends} creates a perfect storm for innovation. Early movers in this space can capture ${categoryInsights.firstMoverAdvantage} before larger competitors respond. Total addressable market for our specific approach is estimated at ${categoryInsights.tamEstimate}.`
    },

    product_strategy: {
      core_features: categoryInsights.coreFeatures,

      development_roadmap: `${difficultyInsights.developmentTimeline}: Phase 1 (${difficultyInsights.phase1Duration}): ${difficultyInsights.phase1Scope}. Phase 2 (${difficultyInsights.phase2Duration}): ${difficultyInsights.phase2Scope}. Phase 3 (${difficultyInsights.phase3Duration}): ${difficultyInsights.phase3Scope}. Each phase includes ${difficultyInsights.iterationApproach} to ensure market fit.`,

      technology_requirements: `${difficultyInsights.techStack} architecture featuring ${categoryInsights.requiredTech}. Infrastructure needs include ${difficultyInsights.infrastructure} with ${categoryInsights.scalabilityReqs}. Development approach emphasizes ${difficultyInsights.developmentMethodology} to manage ${difficultyInsights.technicalChallenges}.`,

      mvp_scope: `Initial version focuses on ${categoryInsights.mvpCore} to validate ${audienceInsights.keyHypothesis}. Core user journey includes ${categoryInsights.mvpUserFlow} with essential features: ${categoryInsights.mvpFeatures.join(", ")}. Success metrics include ${audienceInsights.mvpMetrics} to guide iteration decisions.`
    },
    go_to_market: {
      target_audience: `Primary beachhead market: ${audienceInsights.beachheadMarket} who ${audienceInsights.adoptionProfile}. Expansion targets include ${audienceInsights.expansionMarkets} with ${audienceInsights.expansionStrategy}. Customer acquisition focuses on ${audienceInsights.acquisitionChannels} leveraging ${audienceInsights.acquisitionStrategy}.`,

      marketing_strategy: `Multi-channel approach emphasizing ${categoryInsights.marketingChannels}. Content strategy targets ${audienceInsights.contentTopics} through ${categoryInsights.contentFormats}. Partnership strategy includes ${categoryInsights.partnerTypes} to accelerate ${categoryInsights.partnershipGoals}. Community building focuses on ${audienceInsights.communityStrategy}.`,

      pricing_model: `${categoryInsights.pricingStrategy} with tiers: ${categoryInsights.pricingTiers}. Value-based pricing reflects ${categoryInsights.valueMetrics} with ${audienceInsights.priceElasticity}. Competitive positioning shows ${categoryInsights.pricingPosition} to maximize ${categoryInsights.revenueOptimization}.`,

      launch_plan: `${difficultyInsights.launchTimeline}: Pre-launch (${difficultyInsights.prelaunchDuration}): ${difficultyInsights.prelaunchActivities}. Soft launch (${difficultyInsights.softlaunchDuration}): ${difficultyInsights.softlaunchScope}. Full launch (${difficultyInsights.fulllaunchDuration}): ${difficultyInsights.fulllaunchActivities}. Post-launch optimization focuses on ${categoryInsights.optimizationAreas}.`
    },

    financial_foundation: {
      startup_costs: `Initial investment: ${difficultyInsights.startupCosts} covering ${difficultyInsights.costBreakdown}. Development costs: ${difficultyInsights.developmentCosts}. Marketing budget: ${categoryInsights.marketingBudget}. Operations: ${difficultyInsights.operationalCosts}. Working capital: ${difficultyInsights.workingCapital} for ${difficultyInsights.cashflowBuffer}.`,

      revenue_projections: `Conservative projections: Year 1: ${categoryInsights.year1Revenue}, Year 2: ${categoryInsights.year2Revenue}, Year 3: ${categoryInsights.year3Revenue}. Revenue drivers include ${categoryInsights.revenueDrivers} with ${audienceInsights.monetizationStrategy}. Growth assumptions based on ${categoryInsights.growthAssumptions}.`,

      cost_structure: `Variable costs (${categoryInsights.variableCostPercent}): ${categoryInsights.variableCosts}. Fixed costs (${categoryInsights.fixedCostPercent}): ${categoryInsights.fixedCosts}. Customer acquisition cost: ${audienceInsights.cac} with ${audienceInsights.ltv} lifetime value. Unit economics show ${categoryInsights.unitEconomics}.`,

      funding_strategy: `${difficultyInsights.fundingApproach}: Pre-seed (${difficultyInsights.preseedAmount}) for ${difficultyInsights.preseedUse}. Seed round (${difficultyInsights.seedAmount}) targeting ${difficultyInsights.seedInvestors}. Series A (${difficultyInsights.seriesAAmount}) for ${difficultyInsights.seriesAUse}. Alternative funding includes ${categoryInsights.alternativeFunding}.`
    },

    evaluation: {
      strengths: categoryInsights.strengths,
      risks: categoryInsights.risks,
      success_metrics: audienceInsights.successMetrics,
      recommendations: [
        `Focus on ${categoryInsights.priorityRecommendation}`,
        `Validate ${audienceInsights.validationPriority} early`,
        `Build ${categoryInsights.buildPriority} for competitive advantage`,
        `Establish ${categoryInsights.partnershipPriority} partnerships`,
        `Monitor ${categoryInsights.monitoringPriority} closely`
      ]
    },
    mvp_prompt: generateFallbackMVPPrompt(idea),
    generated_at: new Date().toISOString(),
    model: "gemini-2.5-flash-fallback",
    idea_id: idea.id,
    raw_response: rawResponse
  };
}

/**
 * Generate MVP prompt for Lovable/Bolt frontend generation
 * @param {Object} idea - The business idea
 * @param {Object} reportData - Generated business report data
 * @returns {Promise<string>} - Ready-to-use MVP prompt
 */
async function generateMVPPrompt(idea, reportData) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Based on this business idea and analysis, create a comprehensive prompt for Lovable/Bolt to generate a frontend MVP:

Business Idea: ${idea.title}
Description: ${idea.description}
Category: ${idea.category}
Target Audience: ${idea.target_audience}

Core Features: ${reportData.product_strategy?.core_features?.join(", ") || "Core functionality"}
MVP Definition: ${reportData.product_strategy?.mvp_definition || "Basic version with essential features"}

Create a detailed, actionable prompt that includes:
1. App overview and purpose
2. Target user personas
3. Core features and functionality
4. UI/UX requirements and design preferences
5. Technical specifications and integrations
6. Specific pages/screens needed
7. Color scheme and branding guidelines
8. Responsive design requirements

Format the prompt to be copy-paste ready for Lovable/Bolt. Make it specific, detailed, and actionable. The prompt should be 300-500 words and include all necessary details for a developer to build a functional MVP.

Return only the prompt text, no additional formatting or explanations.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    return response.trim();

  } catch (error) {
    console.error("Error generating MVP prompt:", error);
    return generateFallbackMVPPrompt(idea);
  }
}

/**
 * Generate fallback MVP prompt when AI generation fails
 * @param {Object} idea - The business idea
 * @returns {string} - Fallback MVP prompt
 */
function generateFallbackMVPPrompt(idea) {
  return `Create a modern, responsive web application for "${idea.title}".

**App Overview:**
Build a ${idea.category.toLowerCase()} platform that ${idea.description}. The app should target ${idea.target_audience} with an intuitive, user-friendly interface.

**Core Features:**
- User authentication and profile management
- Main dashboard with key functionality
- Core ${idea.category.toLowerCase()} features
- Responsive design for mobile and desktop
- Clean, modern UI with good UX practices

**Design Requirements:**
- Modern, clean design with professional appearance
- Responsive layout that works on all devices
- Intuitive navigation and user flow
- Accessible design following WCAG guidelines
- Color scheme: Use a professional palette with primary colors in blue/indigo tones

**Technical Specifications:**
- React-based frontend with modern JavaScript
- Component-based architecture
- State management for user data and app state
- API integration capabilities
- Form validation and error handling
- Loading states and user feedback

**Pages/Screens Needed:**
- Landing page with value proposition
- User authentication (login/signup)
- Main dashboard
- Core feature pages
- User profile/settings
- Help/support page

**Additional Requirements:**
- Fast loading times and optimized performance
- SEO-friendly structure
- Cross-browser compatibility
- Mobile-first responsive design
- Professional typography and spacing

Build this as a production-ready MVP that can be deployed and used by real users immediately.`;
}

/**
 * Get category-specific insights for intelligent fallback reports
 */
function getCategorySpecificInsights(category) {
  const insights = {
    "Health & Fitness": {
      keyTechnology: "AI-powered personalization and biometric tracking",
      valueProposition: "delivers personalized health outcomes and sustainable lifestyle changes",
      differentiator: "evidence-based fitness algorithms",
      problemArea: "achieving consistent fitness results and maintaining healthy habits",
      currentLimitations: "generic, one-size-fits-all approaches that ignore individual differences",
      painPoints: "lack of personalization, poor motivation systems, and inconsistent results",
      missingElement: "intelligent adaptation to individual progress and preferences",
      solutionApproach: "AI-driven personalization and real-time adaptation",
      coreCapabilities: "biometric analysis, personalized workout generation, and progress tracking",
      keyBenefits: "measurable health improvements and sustainable habit formation",
      uniqueValue: "40% better adherence rates and 60% faster goal achievement",
      deliveryMethod: "intelligent mobile coaching and community support",
      costSavings: "personal trainer costs by 80% while improving outcomes",
      competitiveEdge: "proprietary AI algorithms trained on millions of fitness data points",
      desiredOutcome: "sustainable health transformation",
      marketSize: "$96 billion",
      growthRate: "7.8% CAGR",
      growthAreas: "wearable integration and virtual coaching",
      regionalTrends: "strong adoption in North America and Europe, emerging growth in Asia-Pacific",
      marketTrends: ["AI-powered personalization", "Wearable device integration", "Virtual coaching adoption", "Nutrition tracking automation", "Community-driven fitness"],
      competitorTypes: "established fitness apps, wearable manufacturers, and traditional gyms",
      establishedPlayers: "MyFitnessPal, Fitbit, and Nike Training Club",
      emergingCompetitors: "AI-powered startups and telehealth platforms",
      competitorWeaknesses: "limited personalization and poor long-term engagement",
      consolidationTrends: "acquisition of AI startups by major health platforms",
      disruptionOpportunity: "personalized AI coaching at scale",
      opportunityArea: "personalized nutrition and mental health integration",
      marketGap: "fail to provide truly personalized experiences",
      convergenceTrends: "AI, wearables, and telehealth",
      firstMoverAdvantage: "60% market share in personalized fitness coaching",
      tamEstimate: "$15 billion",
      coreFeatures: ["AI workout generation", "Biometric tracking", "Nutrition planning", "Progress analytics", "Community challenges"],
      requiredTech: "machine learning models, real-time data processing, and mobile optimization",
      scalabilityReqs: "cloud infrastructure supporting millions of concurrent users",
      mvpCore: "personalized workout generation and basic progress tracking",
      mvpUserFlow: "onboarding assessment → AI workout creation → tracking → progress review",
      mvpFeatures: ["fitness assessment", "AI workout plans", "exercise tracking", "progress dashboard"],
      marketingChannels: "fitness influencers, health blogs, and app store optimization",
      contentFormats: "workout videos, nutrition guides, and success stories",
      partnerTypes: "fitness equipment manufacturers and health insurance providers",
      partnershipGoals: "user acquisition and credibility building",
      pricingStrategy: "Freemium with premium AI features",
      pricingTiers: "Free (basic workouts), Pro ($9.99/month), Elite ($19.99/month)",
      valueMetrics: "personalized workouts and advanced analytics",
      pricingPosition: "30% below premium competitors while offering superior personalization",
      revenueOptimization: "conversion to paid tiers",
      marketingBudget: "$200K for influencer partnerships and content creation",
      year1Revenue: "$150K",
      year2Revenue: "$800K",
      year3Revenue: "$2.5M",
      revenueDrivers: "subscription growth and premium feature adoption",
      growthAssumptions: "15% monthly user growth and 8% conversion rate",
      variableCostPercent: "35%",
      variableCosts: "cloud infrastructure and content creation",
      fixedCostPercent: "65%",
      fixedCosts: "development team and marketing",
      unitEconomics: "positive after 6 months with $45 LTV and $12 CAC",
      alternativeFunding: "health insurance partnerships and corporate wellness programs",
      strengths: ["Proven market demand", "AI differentiation", "Scalable technology", "Strong retention potential"],
      risks: ["Regulatory compliance", "Data privacy concerns", "Competition from big tech", "User acquisition costs"],
      optimizationAreas: "user onboarding and feature discovery",
      priorityRecommendation: "AI personalization accuracy",
      buildPriority: "proprietary fitness algorithms",
      partnershipPriority: "wearable device",
      monitoringPriority: "user engagement metrics"
    },

    "Technology": {
      keyTechnology: "cloud-native architecture and API-first design",
      valueProposition: "accelerates digital transformation and improves operational efficiency",
      differentiator: "seamless integration capabilities",
      problemArea: "managing complex technical workflows and system integrations",
      currentLimitations: "fragmented, difficult to integrate, and lack modern interfaces",
      painPoints: "technical debt, poor user experience, and scalability issues",
      missingElement: "unified, developer-friendly platforms",
      solutionApproach: "modern API architecture and intuitive user interfaces",
      coreCapabilities: "system integration, workflow automation, and real-time analytics",
      keyBenefits: "reduced development time and improved system reliability",
      uniqueValue: "50% faster implementation and 70% fewer integration issues",
      deliveryMethod: "cloud-based platform with comprehensive APIs",
      costSavings: "development costs by 60% and maintenance overhead",
      competitiveEdge: "superior developer experience and extensive integration library",
      desiredOutcome: "streamlined technical operations",
      marketSize: "$650 billion",
      growthRate: "12.5% CAGR",
      growthAreas: "AI integration and edge computing",
      regionalTrends: "North America leads, strong growth in Asia-Pacific",
      marketTrends: ["API-first architecture adoption", "Low-code/no-code platforms", "Microservices migration", "Developer experience focus", "Cloud-native development"],
      competitorTypes: "enterprise software vendors, cloud platforms, and specialized tools",
      establishedPlayers: "Microsoft, AWS, and Google Cloud",
      emergingCompetitors: "developer-focused startups and no-code platforms",
      competitorWeaknesses: "complexity and poor developer experience",
      consolidationTrends: "acquisition of developer tools by cloud giants",
      disruptionOpportunity: "simplified developer experience",
      opportunityArea: "low-code/no-code development platforms",
      marketGap: "require extensive technical expertise",
      convergenceTrends: "AI, cloud computing, and automation",
      firstMoverAdvantage: "40% market share in developer productivity tools",
      tamEstimate: "$85 billion",
      coreFeatures: ["API management", "Workflow automation", "Integration hub", "Analytics dashboard", "Developer tools"],
      requiredTech: "microservices architecture, containerization, and API gateways",
      scalabilityReqs: "auto-scaling infrastructure and global CDN",
      mvpCore: "core API functionality and basic integrations",
      mvpUserFlow: "API setup → integration configuration → testing → deployment",
      mvpFeatures: ["API creation", "basic integrations", "documentation", "usage analytics"],
      marketingChannels: "developer conferences, technical blogs, and GitHub",
      contentFormats: "technical tutorials, API documentation, and case studies",
      partnerTypes: "technology vendors and system integrators",
      partnershipGoals: "ecosystem expansion and technical validation",
      pricingStrategy: "Usage-based with enterprise tiers",
      pricingTiers: "Free (limited), Pro ($99/month), Enterprise (custom)",
      valueMetrics: "API calls and integration complexity",
      pricingPosition: "competitive with major cloud providers",
      revenueOptimization: "usage growth and enterprise sales",
      marketingBudget: "$300K for developer community building",
      year1Revenue: "$250K",
      year2Revenue: "$1.2M",
      year3Revenue: "$4.5M",
      revenueDrivers: "API usage growth and enterprise contracts",
      growthAssumptions: "20% monthly API usage growth",
      variableCostPercent: "40%",
      variableCosts: "cloud infrastructure and API processing",
      fixedCostPercent: "60%",
      fixedCosts: "engineering team and sales",
      unitEconomics: "positive after 4 months with $180 LTV and $35 CAC",
      alternativeFunding: "strategic partnerships with cloud providers",
      strengths: ["Large addressable market", "High switching costs", "Network effects", "Recurring revenue"],
      risks: ["Technical complexity", "Competition from big tech", "Security concerns", "Rapid technology changes"],
      optimizationAreas: "developer onboarding and API performance",
      priorityRecommendation: "developer experience optimization",
      buildPriority: "comprehensive integration library",
      partnershipPriority: "cloud platform",
      monitoringPriority: "API performance and adoption metrics"
    }
  };

  // Default insights for categories not specifically defined
  const defaultInsights = {
    keyTechnology: "modern web technologies and cloud infrastructure",
    valueProposition: "improves efficiency and user experience",
    differentiator: "user-centric design and innovative features",
    problemArea: "current market inefficiencies and user pain points",
    currentLimitations: "outdated, inefficient, and user-unfriendly",
    painPoints: "poor user experience and limited functionality",
    missingElement: "modern, intuitive solutions",
    solutionApproach: "innovative technology and user-focused design",
    coreCapabilities: "core functionality, user management, and analytics",
    keyBenefits: "improved efficiency and better user outcomes",
    uniqueValue: "30% better performance and 50% improved user satisfaction",
    deliveryMethod: "web and mobile applications",
    costSavings: "operational costs and time investment",
    competitiveEdge: "superior user experience and innovative features",
    desiredOutcome: "improved efficiency and satisfaction",
    marketSize: "$10 billion",
    growthRate: "8% CAGR",
    growthAreas: "digital adoption and mobile usage",
    regionalTrends: "global growth with strong adoption in developed markets",
    marketTrends: ["Digital transformation", "Mobile-first adoption", "User experience focus", "Automation integration", "Data-driven insights"],
    competitorTypes: "established players and emerging startups",
    establishedPlayers: "industry leaders and traditional providers",
    emergingCompetitors: "innovative startups and tech companies",
    competitorWeaknesses: "legacy systems and poor user experience",
    consolidationTrends: "market consolidation and strategic acquisitions",
    disruptionOpportunity: "improved user experience and modern technology",
    opportunityArea: "underserved market segments",
    marketGap: "fail to meet modern user expectations",
    convergenceTrends: "technology convergence and changing user behavior",
    firstMoverAdvantage: "25% market share advantage",
    tamEstimate: "$2 billion",
    coreFeatures: ["Core functionality", "User management", "Analytics", "Mobile app", "Integration"],
    requiredTech: "modern web stack and cloud infrastructure",
    scalabilityReqs: "scalable architecture and performance optimization",
    mvpCore: "essential features and basic user workflows",
    mvpUserFlow: "user registration → core functionality → results tracking",
    mvpFeatures: ["user registration", "core features", "basic analytics"],
    marketingChannels: "digital marketing and content strategy",
    contentFormats: "blog posts, videos, and case studies",
    partnerTypes: "industry partners and technology vendors",
    partnershipGoals: "market expansion and credibility",
    pricingStrategy: "Competitive pricing with value tiers",
    pricingTiers: "Basic ($9.99), Pro ($19.99), Enterprise (custom)",
    valueMetrics: "feature access and usage limits",
    pricingPosition: "competitive with market standards",
    revenueOptimization: "user acquisition and retention",
    marketingBudget: "$150K for digital marketing",
    year1Revenue: "$100K",
    year2Revenue: "$500K",
    year3Revenue: "$1.5M",
    revenueDrivers: "user growth and premium features",
    growthAssumptions: "10% monthly user growth",
    variableCostPercent: "30%",
    variableCosts: "infrastructure and support",
    fixedCostPercent: "70%",
    fixedCosts: "development and marketing",
    unitEconomics: "positive after 8 months",
    alternativeFunding: "grants and strategic partnerships",
    strengths: ["Market opportunity", "Innovative approach", "Scalable model", "User demand"],
    risks: ["Market competition", "User adoption", "Technical challenges", "Funding needs"],
    optimizationAreas: "user experience and feature adoption",
    priorityRecommendation: "user experience optimization",
    buildPriority: "core feature reliability",
    partnershipPriority: "strategic industry",
    monitoringPriority: "user engagement and satisfaction"
  };

  return insights[category] || defaultInsights;
}

/**
 * Get audience-specific insights for intelligent fallback reports
 */
function getAudienceSpecificInsights(targetAudience) {
  const insights = {
    "Fitness enthusiasts": {
      marketGap: "78% of fitness apps fail to provide truly personalized experiences",
      desiredOutcome: "consistent progress toward fitness goals with personalized guidance",
      primaryNeed: "personalized workout plans that adapt to their progress",
      primarySegment: "dedicated fitness enthusiasts aged 25-45",
      behaviorProfile: "work out 4-6 times per week and track their progress meticulously",
      secondarySegment: "casual gym-goers seeking structure",
      tertiarySegment: "personal trainers looking for client management tools",
      demographics: "college-educated professionals with disposable income",
      psychographics: "goal-oriented, health-conscious, and technology-savvy",
      usagePattern: "engage with fitness apps daily and value data-driven insights",
      keyValues: "efficiency, personalization, and measurable results",
      segmentSize: "35%",
      keyHypothesis: "personalized AI coaching improves adherence and results",
      mvpMetrics: "workout completion rate and user retention",
      beachheadMarket: "serious fitness enthusiasts in urban areas",
      adoptionProfile: "are early adopters of fitness technology",
      expansionMarkets: "casual fitness users and corporate wellness programs",
      expansionStrategy: "simplified onboarding and group challenges",
      acquisitionChannels: "fitness influencers and gym partnerships",
      acquisitionStrategy: "content marketing and referral programs",
      contentTopics: "workout optimization and nutrition science",
      communityStrategy: "building competitive challenges and progress sharing",
      priceElasticity: "willing to pay premium for proven results",
      valueRealization: "40% faster goal achievement and improved motivation",
      monetizationStrategy: "subscription tiers based on personalization level",
      cac: "$25",
      ltv: "$180",
      successMetrics: ["Monthly active users", "Workout completion rate", "Goal achievement rate", "Net Promoter Score"],
      validationPriority: "AI personalization effectiveness"
    },

    "Small business owners": {
      marketGap: "65% of small businesses struggle with inefficient manual processes",
      desiredOutcome: "streamlined operations and improved profitability",
      primaryNeed: "affordable tools that automate repetitive tasks",
      primarySegment: "small business owners with 5-50 employees",
      behaviorProfile: "wear multiple hats and seek efficiency improvements",
      secondarySegment: "freelancers and solopreneurs",
      tertiarySegment: "mid-market companies seeking cost-effective solutions",
      demographics: "business owners aged 30-55 across various industries",
      psychographics: "pragmatic, cost-conscious, and results-oriented",
      usagePattern: "use business tools daily and prefer simple, effective solutions",
      keyValues: "ROI, simplicity, and reliability",
      segmentSize: "42%",
      keyHypothesis: "automation tools significantly improve small business efficiency",
      mvpMetrics: "time saved per user and process automation rate",
      beachheadMarket: "service-based small businesses in metropolitan areas",
      adoptionProfile: "are motivated by clear ROI demonstrations",
      expansionMarkets: "retail businesses and professional services",
      expansionStrategy: "industry-specific features and integrations",
      acquisitionChannels: "business associations and trade publications",
      acquisitionStrategy: "ROI-focused content and free trials",
      contentTopics: "business efficiency and cost reduction strategies",
      communityStrategy: "peer learning and best practice sharing",
      priceElasticity: "price-sensitive but willing to pay for proven value",
      valueRealization: "25% time savings and improved cash flow",
      monetizationStrategy: "tiered pricing based on business size and features",
      cac: "$45",
      ltv: "$320",
      successMetrics: ["Customer acquisition cost", "Monthly recurring revenue", "Customer satisfaction", "Feature adoption"],
      validationPriority: "ROI demonstration and ease of use"
    },

    "Students": {
      marketGap: "70% of educational tools fail to adapt to individual learning styles",
      desiredOutcome: "improved academic performance and efficient learning",
      primaryNeed: "personalized study tools that fit their learning style",
      primarySegment: "college and university students aged 18-25",
      behaviorProfile: "are digital natives who multitask and prefer mobile-first solutions",
      secondarySegment: "high school students preparing for college",
      tertiarySegment: "adult learners and professional certification seekers",
      demographics: "tech-savvy students with limited budgets",
      psychographics: "achievement-oriented, social, and time-constrained",
      usagePattern: "study in short bursts and prefer gamified experiences",
      keyValues: "effectiveness, affordability, and social features",
      segmentSize: "28%",
      keyHypothesis: "personalized learning improves retention and grades",
      mvpMetrics: "study session completion and grade improvement",
      beachheadMarket: "STEM students at major universities",
      adoptionProfile: "quickly adopt tools that improve their academic performance",
      expansionMarkets: "liberal arts students and professional learners",
      expansionStrategy: "subject-specific content and study group features",
      acquisitionChannels: "campus ambassadors and social media",
      acquisitionStrategy: "viral referral programs and student discounts",
      contentTopics: "study techniques and academic success strategies",
      communityStrategy: "study groups and peer tutoring networks",
      priceElasticity: "highly price-sensitive, prefer freemium models",
      valueRealization: "improved grades and reduced study time",
      monetizationStrategy: "freemium with premium study features",
      cac: "$8",
      ltv: "$45",
      successMetrics: ["Daily active users", "Study streak length", "Grade improvement", "Referral rate"],
      validationPriority: "learning effectiveness and user engagement"
    }
  };

  // Default insights for audiences not specifically defined
  const defaultInsights = {
    marketGap: "60% of current solutions fail to meet user expectations",
    desiredOutcome: "improved efficiency and better results",
    primaryNeed: "effective tools that solve their specific problems",
    primarySegment: "primary target users aged 25-45",
    behaviorProfile: "actively seek solutions to improve their situation",
    secondarySegment: "adjacent user groups with similar needs",
    tertiarySegment: "enterprise users and power users",
    demographics: "educated professionals with moderate to high income",
    psychographics: "goal-oriented, technology-adopters, and value-conscious",
    usagePattern: "regularly use digital tools and expect good user experience",
    keyValues: "quality, reliability, and value for money",
    segmentSize: "30%",
    keyHypothesis: "improved user experience drives adoption and retention",
    mvpMetrics: "user engagement and satisfaction scores",
    beachheadMarket: "early adopters in urban markets",
    adoptionProfile: "are willing to try new solutions",
    expansionMarkets: "mainstream users and enterprise customers",
    expansionStrategy: "feature expansion and market education",
    acquisitionChannels: "digital marketing and word-of-mouth",
    acquisitionStrategy: "content marketing and referral programs",
    contentTopics: "industry insights and best practices",
    communityStrategy: "user forums and knowledge sharing",
    priceElasticity: "moderately price-sensitive",
    valueRealization: "improved outcomes and time savings",
    monetizationStrategy: "subscription model with multiple tiers",
    cac: "$30",
    ltv: "$150",
    successMetrics: ["User acquisition", "Retention rate", "Customer satisfaction", "Revenue growth"],
    validationPriority: "product-market fit and user satisfaction"
  };

  return insights[targetAudience] || defaultInsights;
}

/**
 * Get difficulty-specific insights for intelligent fallback reports
 */
function getDifficultySpecificInsights(difficulty) {
  const insights = {
    "easy": {
      complexity: "straightforward",
      technicalApproach: "proven technologies and established patterns",
      developmentTimeline: "Rapid development approach",
      phase1Duration: "6-8 weeks",
      phase1Scope: "Core MVP with essential features",
      phase2Duration: "4-6 weeks",
      phase2Scope: "User feedback integration and polish",
      phase3Duration: "2-4 weeks",
      phase3Scope: "Launch preparation and marketing",
      iterationApproach: "weekly sprints and user testing",
      techStack: "Standard web",
      infrastructure: "cloud hosting with CDN",
      developmentMethodology: "agile development with rapid prototyping",
      technicalChallenges: "standard implementation challenges",
      launchTimeline: "3-4 month launch cycle",
      prelaunchDuration: "4 weeks",
      prelaunchActivities: "beta testing and content creation",
      softlaunchDuration: "2 weeks",
      softlaunchScope: "limited user group and feedback collection",
      fulllaunchDuration: "2 weeks",
      fulllaunchActivities: "public launch and marketing campaign",
      startupCosts: "$75K-125K",
      costBreakdown: "development (60%), marketing (25%), operations (15%)",
      developmentCosts: "$45K-75K",
      operationalCosts: "$10K-15K",
      workingCapital: "$20K-35K",
      cashflowBuffer: "initial operating expenses",
      fundingApproach: "Bootstrap-friendly with optional angel investment",
      preseedAmount: "$50K",
      preseedUse: "MVP development and initial marketing",
      seedAmount: "$250K",
      seedInvestors: "angel investors and micro VCs",
      seriesAAmount: "$1.5M",
      seriesAUse: "scaling and market expansion"
    },

    "medium": {
      complexity: "moderately complex",
      technicalApproach: "modern frameworks with some custom development",
      developmentTimeline: "Structured development approach",
      phase1Duration: "10-12 weeks",
      phase1Scope: "Core platform with key integrations",
      phase2Duration: "8-10 weeks",
      phase2Scope: "Advanced features and optimization",
      phase3Duration: "4-6 weeks",
      phase3Scope: "Scaling preparation and launch",
      iterationApproach: "bi-weekly sprints with stakeholder reviews",
      techStack: "Modern full-stack",
      infrastructure: "scalable cloud architecture with microservices",
      developmentMethodology: "agile development with technical planning",
      technicalChallenges: "integration complexity and performance optimization",
      launchTimeline: "5-6 month launch cycle",
      prelaunchDuration: "6 weeks",
      prelaunchActivities: "extensive testing and partnership development",
      softlaunchDuration: "3 weeks",
      softlaunchScope: "select markets and user segments",
      fulllaunchDuration: "3 weeks",
      fulllaunchActivities: "full market launch and PR campaign",
      startupCosts: "$150K-250K",
      costBreakdown: "development (55%), marketing (30%), operations (15%)",
      developmentCosts: "$85K-140K",
      operationalCosts: "$20K-35K",
      workingCapital: "$45K-75K",
      cashflowBuffer: "operational runway and contingency",
      fundingApproach: "Seed funding recommended",
      preseedAmount: "$100K",
      preseedUse: "team building and initial development",
      seedAmount: "$500K",
      seedInvestors: "seed VCs and strategic angels",
      seriesAAmount: "$3M",
      seriesAUse: "market expansion and team scaling"
    },

    "hard": {
      complexity: "highly complex",
      technicalApproach: "cutting-edge technologies and significant R&D",
      developmentTimeline: "Extended development approach",
      phase1Duration: "16-20 weeks",
      phase1Scope: "Core technology and proof of concept",
      phase2Duration: "12-16 weeks",
      phase2Scope: "Platform development and testing",
      phase3Duration: "8-12 weeks",
      phase3Scope: "Market preparation and pilot programs",
      iterationApproach: "monthly milestones with technical reviews",
      techStack: "Advanced technology",
      infrastructure: "enterprise-grade architecture with custom solutions",
      developmentMethodology: "research-driven development with extensive testing",
      technicalChallenges: "novel technology implementation and scalability",
      launchTimeline: "8-12 month launch cycle",
      prelaunchDuration: "10 weeks",
      prelaunchActivities: "pilot programs and regulatory preparation",
      softlaunchDuration: "6 weeks",
      softlaunchScope: "controlled pilot with key customers",
      fulllaunchDuration: "6 weeks",
      fulllaunchActivities: "market launch with thought leadership",
      startupCosts: "$300K-500K",
      costBreakdown: "development (65%), marketing (20%), operations (15%)",
      developmentCosts: "$195K-325K",
      operationalCosts: "$45K-75K",
      workingCapital: "$60K-100K",
      cashflowBuffer: "extended runway and risk mitigation",
      fundingApproach: "Institutional funding required",
      preseedAmount: "$200K",
      preseedUse: "research and initial team",
      seedAmount: "$1M",
      seedInvestors: "institutional VCs and strategic investors",
      seriesAAmount: "$5M",
      seriesAUse: "scaling technology and market penetration"
    }
  };

  // Default insights for difficulties not specifically defined
  const defaultInsights = {
    complexity: "moderate",
    technicalApproach: "standard development practices",
    developmentTimeline: "Standard development approach",
    phase1Duration: "8-10 weeks",
    phase1Scope: "MVP development",
    phase2Duration: "6-8 weeks",
    phase2Scope: "Feature expansion",
    phase3Duration: "4-6 weeks",
    phase3Scope: "Launch preparation",
    iterationApproach: "agile sprints with regular reviews",
    techStack: "Modern web",
    infrastructure: "cloud-based with standard scaling",
    developmentMethodology: "agile development",
    technicalChallenges: "standard development challenges",
    launchTimeline: "4-5 month launch cycle",
    prelaunchDuration: "4 weeks",
    prelaunchActivities: "testing and preparation",
    softlaunchDuration: "2 weeks",
    softlaunchScope: "limited release",
    fulllaunchDuration: "2 weeks",
    fulllaunchActivities: "public launch",
    startupCosts: "$100K-200K",
    costBreakdown: "development (60%), marketing (25%), operations (15%)",
    developmentCosts: "$60K-120K",
    operationalCosts: "$15K-30K",
    workingCapital: "$25K-50K",
    cashflowBuffer: "operating expenses",
    fundingApproach: "Flexible funding options",
    preseedAmount: "$75K",
    preseedUse: "initial development",
    seedAmount: "$400K",
    seedInvestors: "angel and seed investors",
    seriesAAmount: "$2M",
    seriesAUse: "scaling and growth"
  };

  return insights[difficulty] || defaultInsights;
}
