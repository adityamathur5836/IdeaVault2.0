import { createClient } from "@supabase/supabase-js";
import { generateGeminiEmbedding } from "./geminiService.js";

// Initialize Supabase client for read-only ideas database (Supabase_a)
const supabaseA = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_A_URL,
  process.env.NEXT_PUBLIC_SUPABASE_A_ANON_KEY
);

/**
 * Perform vector similarity search on the product_hunt_products table
 * @param {string} query - The search query text
 * @param {number} limit - Number of results to return (default: 5)
 * @param {number} threshold - Similarity threshold (default: 0.7)
 * @returns {Promise<Object[]>} - Array of similar business ideas
 */
export async function searchSimilarIdeas(query, limit = 5, threshold = 0.7) {
  try {
    // Generate embedding for the search query using Gemini
    const queryEmbedding = await generateGeminiEmbedding(query);
    
    // Perform vector similarity search using pgvector
    // Try the correct function name first
    let { data, error } = await supabaseA.rpc("match_startup_ideas", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit
    });

    // If that fails, try the alternative function name
    if (error) {
      console.log("Trying alternative vector search function...");
      ({ data, error } = await supabaseA.rpc("match_ideas", {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      }));
    }

    if (error) {
      console.error("Vector search error:", error);
      // Fallback to text-based search
      return await fallbackTextSearch(query, limit);
    }

    // Transform the results to match our expected format
    return data.map(item => ({
      id: item.id,
      title: item.name || item.title,
      description: item.product_description || item.description || `Innovative solution with ${item.upvotes || 0} upvotes from the community.`,
      category: extractPrimaryCategory(item.category_tags) || "Technology",
      difficulty: estimateDifficulty(item.upvotes),
      target_audience: estimateTargetAudience(item.category_tags) || "General",
      tags: parseTagsArray(item.category_tags) || ["Technology"],
      upvotes: item.upvotes || 0,
      source: "product_hunt",
      similarity: item.similarity || 0
    }));

  } catch (error) {
    console.error("Error in vector search:", error);
    // Fallback to text-based search
    return await fallbackTextSearch(query, limit);
  }
}

/**
 * Fallback text-based search when vector search fails
 * @param {string} query - The search query text
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object[]>} - Array of business ideas
 */
async function fallbackTextSearch(query, limit) {
  try {
    const searchTerms = query.toLowerCase().split(" ").filter(term => term.length > 2);
    
    let queryBuilder = supabaseA
      .from("product_hunt_products")
      .select("*")
      .limit(limit);

    // Add text search conditions
    if (searchTerms.length > 0) {
      const searchTerm = searchTerms[0];
      queryBuilder = queryBuilder.or(`name.ilike.%${searchTerm}%,product_description.ilike.%${searchTerm}%,category_tags.ilike.%${searchTerm}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error("Fallback search error:", error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      title: item.name || item.title,
      description: item.product_description || item.description || `Innovative solution with ${item.upvotes || 0} upvotes from the community.`,
      category: extractPrimaryCategory(item.category_tags) || "Technology",
      difficulty: estimateDifficulty(item.upvotes),
      target_audience: estimateTargetAudience(item.category_tags) || "General",
      tags: parseTagsArray(item.category_tags) || ["Technology"],
      upvotes: item.upvotes || 0,
      source: "product_hunt",
      similarity: 0.5 // Default similarity for text search
    }));

  } catch (error) {
    console.error("Error in fallback search:", error);
    return [];
  }
}

/**
 * Get random business ideas when search fails
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object[]>} - Array of random business ideas
 */
export async function getRandomIdeas(limit = 5) {
  try {
    const { data, error } = await supabaseA
      .from("product_hunt_products")
      .select("*")
      .order("upvotes", { ascending: false })
      .limit(limit * 2); // Get more to randomize

    if (error) {
      console.error("Error getting random ideas:", error);
      return [];
    }

    // Shuffle and take the requested number
    const shuffled = data.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit).map(item => ({
      id: item.id,
      title: item.name || item.title,
      description: item.product_description || item.description || `Innovative solution with ${item.upvotes || 0} upvotes from the community.`,
      category: extractPrimaryCategory(item.category_tags) || "Technology",
      difficulty: estimateDifficulty(item.upvotes),
      target_audience: estimateTargetAudience(item.category_tags) || "General",
      tags: parseTagsArray(item.category_tags) || ["Technology"],
      upvotes: item.upvotes || 0,
      source: "product_hunt",
      similarity: 0.3 // Lower similarity for random ideas
    }));

  } catch (error) {
    console.error("Error getting random ideas:", error);
    return [];
  }
}

/**
 * Search ideas by category
 * @param {string} category - The category to search for
 * @param {number} limit - Number of results to return
 * @returns {Promise<Object[]>} - Array of business ideas in the category
 */
export async function searchByCategory(category, limit = 5) {
  try {
    const { data, error } = await supabaseA
      .from("product_hunt_products")
      .select("*")
      .ilike("category_tags", `%${category}%`)
      .order("upvotes", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Category search error:", error);
      return await getRandomIdeas(limit);
    }

    return data.map(item => ({
      id: item.id,
      title: item.name || item.title,
      description: item.product_description || item.description || `Innovative ${category} solution with ${item.upvotes || 0} upvotes from the community.`,
      category: extractPrimaryCategory(item.category_tags) || category,
      difficulty: estimateDifficulty(item.upvotes),
      target_audience: estimateTargetAudience(item.category_tags) || "General",
      tags: parseTagsArray(item.category_tags) || [category],
      upvotes: item.upvotes || 0,
      source: "product_hunt",
      similarity: 0.8 // High similarity for category matches
    }));

  } catch (error) {
    console.error("Error in category search:", error);
    return await getRandomIdeas(limit);
  }
}

/**
 * Helper functions for data transformation
 */

// Extract primary category from category_tags string
function extractPrimaryCategory(categoryTags) {
  if (!categoryTags) return "Technology";

  // Category tags are usually comma-separated or space-separated
  const tags = categoryTags.split(/[,\s]+/).filter(tag => tag.trim());

  // Common category mappings
  const categoryMap = {
    "TECH": "Technology",
    "PRODUCTIVITY": "Productivity",
    "DESIGN": "Design",
    "MARKETING": "Marketing",
    "FINANCE": "Finance",
    "HEALTH": "Healthcare",
    "EDUCATION": "Education",
    "SOCIAL": "Social",
    "GAMING": "Gaming",
    "TRAVEL": "Travel",
    "FOOD": "Food & Drink",
    "MUSIC": "Music",
    "SPORTS": "Sports",
    "NEWS": "News",
    "BUSINESS": "Business"
  };

  for (const tag of tags) {
    const upperTag = tag.toUpperCase();
    if (categoryMap[upperTag]) {
      return categoryMap[upperTag];
    }
  }

  // Return first tag if no mapping found
  return tags[0] ? tags[0].charAt(0).toUpperCase() + tags[0].slice(1).toLowerCase() : "Technology";
}

// Estimate difficulty based on upvotes
function estimateDifficulty(upvotes) {
  if (!upvotes) return "medium";

  if (upvotes > 5000) return "hard";
  if (upvotes > 1000) return "medium";
  return "easy";
}

// Estimate target audience from category tags
function estimateTargetAudience(categoryTags) {
  if (!categoryTags) return "General";

  const tags = categoryTags.toLowerCase();

  if (tags.includes("developer") || tags.includes("tech") || tags.includes("api")) {
    return "Developers";
  }
  if (tags.includes("business") || tags.includes("productivity") || tags.includes("enterprise")) {
    return "Businesses";
  }
  if (tags.includes("design") || tags.includes("creative")) {
    return "Designers";
  }
  if (tags.includes("marketing") || tags.includes("social")) {
    return "Marketers";
  }
  if (tags.includes("student") || tags.includes("education")) {
    return "Students";
  }

  return "General";
}

// Parse tags array from category_tags string
function parseTagsArray(categoryTags) {
  if (!categoryTags) return ["Technology"];

  return categoryTags
    .split(/[,\s]+/)
    .filter(tag => tag.trim())
    .map(tag => tag.trim())
    .slice(0, 5); // Limit to 5 tags
}
