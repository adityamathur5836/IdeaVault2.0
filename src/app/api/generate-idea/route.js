import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { searchSimilarIdeas, searchByCategory, getRandomIdeas } from '@/lib/vectorSearch';
import { synthesizeIdeasWithGemini, generateSearchQuery } from '@/lib/geminiService';
import { saveUserIdea } from '@/lib/userService';

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, data, prompt, multiple = false, count = 1 } = body;

    // Validate count for multiple generation
    if (multiple && (count < 1 || count > 10)) {
      return NextResponse.json(
        { error: 'Count must be between 1 and 10 for multiple generation' },
        { status: 400 }
      );
    }

    // Process input based on type
    if (type === 'structured') {
      // Validate required fields
      if (!data.category || !data.difficulty || !data.targetAudience) {
        return NextResponse.json(
          { error: 'Missing required fields: category, difficulty, targetAudience' },
          { status: 400 }
        );
      }

      // Generate real business ideas using vector search
      const searchQuery = generateSearchQuery(data);
      const searchLimit = multiple ? count * 2 : 10; // Get more results to filter

      let ideas = await searchSimilarIdeas(searchQuery, searchLimit, 0.6);

      // If not enough results, try category search
      if (ideas.length < count) {
        const categoryIdeas = await searchByCategory(data.category, count);
        ideas = [...ideas, ...categoryIdeas];
      }

      // If still not enough, get random ideas
      if (ideas.length < count) {
        const randomIdeas = await getRandomIdeas(count);
        ideas = [...ideas, ...randomIdeas];
      }

      // Remove duplicates and apply user preferences
      ideas = removeDuplicates(ideas);
      ideas = applyUserPreferences(ideas, data);

      // Generate AI-synthesized ideas using Gemini
      const synthesizedCount = multiple ? Math.min(Math.ceil(count / 2), 3) : 1;
      let synthesizedIdeas = [];

      try {
        synthesizedIdeas = await synthesizeIdeasWithGemini(
          ideas.slice(0, 5), // Use top 5 matches as context
          searchQuery,
          synthesizedCount
        );
      } catch (error) {
        console.warn('Gemini synthesis failed, using fallback ideas:', error.message);
        synthesizedIdeas = [];
      }

      // Combine vector search results with AI-synthesized ideas
      const allIdeas = [...synthesizedIdeas, ...ideas];
      let finalIdeas = removeDuplicates(allIdeas);

      // Ensure we have at least the requested number of ideas
      if (finalIdeas.length < count) {
        console.log(`Only ${finalIdeas.length} ideas found, generating fallback ideas to reach ${count}`);
        const fallbackNeeded = count - finalIdeas.length;
        const fallbackIdeas = [];

        for (let i = 0; i < fallbackNeeded; i++) {
          fallbackIdeas.push(generateFallbackIdea({
            ...data,
            index: i
          }));
        }

        finalIdeas = [...finalIdeas, ...fallbackIdeas];
      }

      // Save ideas to database for later retrieval
      const ideasToReturn = finalIdeas.slice(0, count);
      const savedIdeas = [];
      
      for (const idea of ideasToReturn) {
        // Ensure idea has a proper ID first
        const ideaWithId = {
          ...idea,
          id: idea.id || Math.floor(Math.random() * 1000000),
          user_id: userId,
          generated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const savedIdea = await saveUserIdea(userId, {
            ...ideaWithId,
            source_input: JSON.stringify(data)
          });
          savedIdeas.push(savedIdea);
        } catch (error) {
          console.warn('Failed to save idea to database, using in-memory version:', error);
          // If saving fails, use the idea with generated ID
          savedIdeas.push(ideaWithId);
        }
      }

      if (multiple) {
        return NextResponse.json({
          ideas: savedIdeas,
          total: finalIdeas.length,
          source: 'hybrid_vector_gemini',
          ai_generated: synthesizedIdeas.length,
          database_matched: ideas.length,
          model: 'gemini-1.5-flash'
        });
      } else {
        return NextResponse.json(savedIdeas[0] || generateFallbackIdea(data));
      }

    } else if (type === 'freeform') {
      // Validate prompt
      if (!prompt || prompt.trim().length === 0) {
        return NextResponse.json(
          { error: 'Prompt is required for freeform generation' },
          { status: 400 }
        );
      }

      // Generate real business ideas using vector search with freeform prompt
      const searchLimit = multiple ? count * 2 : 10;
      let ideas = await searchSimilarIdeas(prompt, searchLimit, 0.5);

      // If not enough results, get random ideas
      if (ideas.length < count) {
        const randomIdeas = await getRandomIdeas(count);
        ideas = [...ideas, ...randomIdeas];
      }

      // Remove duplicates and enhance with prompt context
      ideas = removeDuplicates(ideas);
      ideas = enhanceWithPromptContext(ideas, prompt);

      // Generate AI-synthesized ideas using Gemini
      const synthesizedCount = multiple ? Math.min(Math.ceil(count / 2), 3) : 1;
      let synthesizedIdeas = [];

      try {
        synthesizedIdeas = await synthesizeIdeasWithGemini(
          ideas.slice(0, 5), // Use top 5 matches as context
          prompt,
          synthesizedCount
        );
      } catch (error) {
        console.warn('Gemini synthesis failed, using fallback ideas:', error.message);
        synthesizedIdeas = [];
      }

      // Combine vector search results with AI-synthesized ideas
      const allIdeas = [...synthesizedIdeas, ...ideas];
      let finalIdeas = removeDuplicates(allIdeas);

      // Ensure we have at least the requested number of ideas
      if (finalIdeas.length < count) {
        console.log(`Only ${finalIdeas.length} ideas found, generating fallback ideas to reach ${count}`);
        const fallbackNeeded = count - finalIdeas.length;
        const fallbackIdeas = [];

        for (let i = 0; i < fallbackNeeded; i++) {
          fallbackIdeas.push(generateFallbackIdeaFromPrompt(prompt + ` (variation ${i + 1})`));
        }

        finalIdeas = [...finalIdeas, ...fallbackIdeas];
      }

      // Save ideas to database for later retrieval
      const ideasToReturn = finalIdeas.slice(0, count);
      const savedIdeas = [];
      
      for (const idea of ideasToReturn) {
        // Ensure idea has a proper ID first
        const ideaWithId = {
          ...idea,
          id: idea.id || Math.floor(Math.random() * 1000000),
          user_id: userId,
          generated: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        try {
          const savedIdea = await saveUserIdea(userId, {
            ...ideaWithId,
            source_input: prompt
          });
          savedIdeas.push(savedIdea);
        } catch (error) {
          console.warn('Failed to save idea to database, using in-memory version:', error);
          // If saving fails, use the idea with generated ID
          savedIdeas.push(ideaWithId);
        }
      }

      if (multiple) {
        return NextResponse.json({
          ideas: savedIdeas,
          total: finalIdeas.length,
          source: 'hybrid_vector_gemini',
          prompt: prompt,
          ai_generated: synthesizedIdeas.length,
          database_matched: ideas.length,
          model: 'gemini-1.5-flash'
        });
      } else {
        return NextResponse.json(savedIdeas[0] || generateFallbackIdeaFromPrompt(prompt));
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid type. Must be "structured" or "freeform"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error generating idea:', error);
    return NextResponse.json(
      { error: 'Failed to generate idea. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}

// Helper functions for processing search results

/**
 * Remove duplicate ideas based on title similarity
 */
function removeDuplicates(ideas) {
  const seen = new Set();
  return ideas.filter(idea => {
    const key = idea.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Apply user preferences to filter and rank ideas
 */
function applyUserPreferences(ideas, data) {
  return ideas.map(idea => ({
    ...idea,
    difficulty: data.difficulty,
    target_audience: data.targetAudience,
    category: idea.category || data.category,
    relevance_score: calculateRelevanceScore(idea, data)
  })).sort((a, b) => b.relevance_score - a.relevance_score);
}

/**
 * Calculate relevance score based on user preferences
 */
function calculateRelevanceScore(idea, data) {
  let score = idea.similarity || 0.5;

  // Boost score for category match
  if (idea.category && idea.category.toLowerCase().includes(data.category.toLowerCase())) {
    score += 0.2;
  }

  // Boost score for target audience match
  if (idea.target_audience && idea.target_audience.toLowerCase().includes(data.targetAudience.toLowerCase())) {
    score += 0.1;
  }

  // Boost score for popular ideas
  if (idea.upvotes > 100) {
    score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Enhance ideas with prompt context for freeform generation
 */
function enhanceWithPromptContext(ideas, prompt) {
  const keywords = prompt.toLowerCase().split(' ').filter(word => word.length > 3);

  return ideas.map(idea => ({
    ...idea,
    prompt_relevance: calculatePromptRelevance(idea, keywords),
    enhanced_description: enhanceDescription(idea.description, prompt)
  })).sort((a, b) => b.prompt_relevance - a.prompt_relevance);
}

/**
 * Calculate how relevant an idea is to the prompt
 */
function calculatePromptRelevance(idea, keywords) {
  const ideaText = `${idea.title} ${idea.description}`.toLowerCase();
  const matches = keywords.filter(keyword => ideaText.includes(keyword));
  return matches.length / keywords.length;
}

/**
 * Enhance description with prompt context
 */
function enhanceDescription(description, prompt) {
  return `${description}\n\nThis idea aligns with your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
}

/**
 * Generate fallback idea when search fails
 */
function generateFallbackIdea(data) {
  const index = data.index || 0;
  const fallbackTemplates = [
    {
      title: `AI-Powered ${data.category} Assistant for ${data.targetAudience}`,
      description: `An intelligent ${data.category.toLowerCase()} platform that uses AI to help ${data.targetAudience.toLowerCase()} streamline their workflows and make better decisions.`,
      key_innovation: `AI-driven automation specifically designed for ${data.category.toLowerCase()} workflows`,
      market_potential: `Growing demand for AI solutions in ${data.category.toLowerCase()} sector`
    },
    {
      title: `${data.category} Marketplace for ${data.targetAudience}`,
      description: `A comprehensive marketplace connecting ${data.targetAudience.toLowerCase()} with ${data.category.toLowerCase()} services, tools, and resources they need to succeed.`,
      key_innovation: `Curated marketplace with quality verification and matching algorithms`,
      market_potential: `Marketplace model with network effects in ${data.category.toLowerCase()}`
    },
    {
      title: `Smart ${data.category} Analytics Platform`,
      description: `Advanced analytics and insights platform that helps ${data.targetAudience.toLowerCase()} optimize their ${data.category.toLowerCase()} strategies with data-driven decisions.`,
      key_innovation: `Real-time analytics with predictive insights for ${data.category.toLowerCase()}`,
      market_potential: `Data analytics market growing rapidly across all sectors`
    },
    {
      title: `Mobile-First ${data.category} Solution`,
      description: `A mobile-optimized platform that brings ${data.category.toLowerCase()} services directly to ${data.targetAudience.toLowerCase()}, enabling on-the-go access and management.`,
      key_innovation: `Mobile-first design with offline capabilities and seamless sync`,
      market_potential: `Mobile adoption continues to grow, especially among target demographics`
    }
  ];

  const template = fallbackTemplates[index % fallbackTemplates.length];

  return {
    id: `fallback_${Date.now()}_${index}`,
    title: template.title,
    description: template.description,
    category: data.category,
    difficulty: data.difficulty,
    target_audience: data.targetAudience,
    key_innovation: template.key_innovation,
    market_potential: template.market_potential,
    tags: [data.category, data.targetAudience, data.difficulty, "Innovation", "Fallback"],
    source: 'fallback',
    upvotes: Math.floor(Math.random() * 50) + 10, // Random upvotes between 10-60
    similarity: 0.3,
    generated_at: new Date().toISOString()
  };
}

/**
 * Generate fallback idea from prompt when search fails
 */
function generateFallbackIdeaFromPrompt(prompt) {
  const keywords = prompt.toLowerCase().split(' ').filter(word => word.length > 3);
  const primaryKeyword = keywords[0] || 'innovation';
  const secondaryKeyword = keywords[1] || 'solution';

  // Extract potential category from keywords
  const categoryKeywords = {
    'tech': 'Technology', 'software': 'Technology', 'app': 'Technology', 'digital': 'Technology',
    'health': 'Healthcare', 'medical': 'Healthcare', 'fitness': 'Healthcare', 'wellness': 'Healthcare',
    'finance': 'Finance', 'money': 'Finance', 'payment': 'Finance', 'banking': 'Finance',
    'education': 'Education', 'learning': 'Education', 'teaching': 'Education', 'school': 'Education',
    'food': 'Food & Drink', 'restaurant': 'Food & Drink', 'cooking': 'Food & Drink',
    'travel': 'Travel', 'tourism': 'Travel', 'hotel': 'Travel', 'vacation': 'Travel',
    'business': 'Business', 'startup': 'Business', 'entrepreneur': 'Business',
    'social': 'Social', 'community': 'Social', 'networking': 'Social'
  };

  let category = 'Technology';
  for (const keyword of keywords) {
    if (categoryKeywords[keyword]) {
      category = categoryKeywords[keyword];
      break;
    }
  }

  const fallbackTemplates = [
    {
      title: `Smart ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Platform`,
      description: `An intelligent platform that revolutionizes ${primaryKeyword} by leveraging AI and modern technology to solve the specific challenges you mentioned.`,
      key_innovation: `AI-powered automation and intelligent matching for ${primaryKeyword} optimization`,
      market_potential: `Growing market demand for smart solutions in the ${primaryKeyword} space`
    },
    {
      title: `${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Marketplace & Community`,
      description: `A comprehensive marketplace and community platform connecting users interested in ${primaryKeyword} with ${secondaryKeyword} providers and resources.`,
      key_innovation: `Community-driven marketplace with verified providers and peer reviews`,
      market_potential: `Marketplace models show strong growth potential with network effects`
    },
    {
      title: `Mobile ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Assistant`,
      description: `A mobile-first solution that brings ${primaryKeyword} services directly to users, enabling seamless access and management on-the-go.`,
      key_innovation: `Mobile-optimized experience with offline capabilities and real-time sync`,
      market_potential: `Mobile adoption continues to accelerate across all demographics`
    }
  ];

  const template = fallbackTemplates[Math.floor(Math.random() * fallbackTemplates.length)];

  return {
    id: `fallback_prompt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title: template.title,
    description: `${template.description}\n\nBased on your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
    category: category,
    difficulty: "medium",
    target_audience: "General",
    key_innovation: template.key_innovation,
    market_potential: template.market_potential,
    tags: [primaryKeyword, secondaryKeyword, "AI", "Innovation", "Custom"].filter(Boolean),
    source: 'fallback',
    upvotes: Math.floor(Math.random() * 30) + 5, // Random upvotes between 5-35
    similarity: 0.3,
    generated_at: new Date().toISOString()
  };
}
