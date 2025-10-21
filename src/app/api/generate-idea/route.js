import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { searchSimilarIdeas, searchByCategory, getRandomIdeas } from '@/lib/vectorSearch';
import { synthesizeIdeasWithGemini, generateSearchQuery } from '@/lib/geminiService';

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
      const synthesizedIdeas = await synthesizeIdeasWithGemini(
        ideas.slice(0, 5), // Use top 5 matches as context
        searchQuery,
        synthesizedCount
      );

      // Combine vector search results with AI-synthesized ideas
      const allIdeas = [...synthesizedIdeas, ...ideas];
      const finalIdeas = removeDuplicates(allIdeas);

      if (multiple) {
        return NextResponse.json({
          ideas: finalIdeas.slice(0, count),
          total: finalIdeas.length,
          source: 'hybrid_vector_gemini',
          ai_generated: synthesizedIdeas.length,
          database_matched: ideas.length,
          model: 'gemini-1.5-flash'
        });
      } else {
        return NextResponse.json(finalIdeas[0] || generateFallbackIdea(data));
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
      const synthesizedIdeas = await synthesizeIdeasWithGemini(
        ideas.slice(0, 5), // Use top 5 matches as context
        prompt,
        synthesizedCount
      );

      // Combine vector search results with AI-synthesized ideas
      const allIdeas = [...synthesizedIdeas, ...ideas];
      const finalIdeas = removeDuplicates(allIdeas);

      if (multiple) {
        return NextResponse.json({
          ideas: finalIdeas.slice(0, count),
          total: finalIdeas.length,
          source: 'hybrid_vector_gemini',
          prompt: prompt,
          ai_generated: synthesizedIdeas.length,
          database_matched: ideas.length,
          model: 'gemini-1.5-flash'
        });
      } else {
        return NextResponse.json(finalIdeas[0] || generateFallbackIdeaFromPrompt(prompt));
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
  return {
    title: `Innovative ${data.category} Solution for ${data.targetAudience}`,
    description: `A cutting-edge ${data.category.toLowerCase()} platform designed specifically for ${data.targetAudience.toLowerCase()}. This solution addresses key challenges in the ${data.category.toLowerCase()} space with modern technology and user-centric design.`,
    category: data.category,
    difficulty: data.difficulty,
    target_audience: data.targetAudience,
    tags: [data.category, data.targetAudience, data.difficulty, "Innovation"],
    source: 'fallback',
    upvotes: 0,
    similarity: 0.3
  };
}

/**
 * Generate fallback idea from prompt when search fails
 */
function generateFallbackIdeaFromPrompt(prompt) {
  const keywords = prompt.toLowerCase().split(' ').filter(word => word.length > 3);
  const primaryKeyword = keywords[0] || 'innovation';

  return {
    title: `AI-Powered ${primaryKeyword.charAt(0).toUpperCase() + primaryKeyword.slice(1)} Platform`,
    description: `An innovative solution that addresses the challenges mentioned in your request: "${prompt}". This platform combines modern technology with user-centric design to deliver exceptional results.`,
    category: "Technology",
    difficulty: "medium",
    target_audience: "General",
    tags: [primaryKeyword, "AI", "Innovation", "Custom"],
    source: 'fallback',
    upvotes: 0,
    similarity: 0.3
  };
}
