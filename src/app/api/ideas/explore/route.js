import { NextResponse } from "next/server";
import { supabaseIdeas } from "@/lib/supabase";
import { parseErrorMessage } from "@/lib/utils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const difficulty = searchParams.get("difficulty") || "";

    // Validate parameters
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    // Build Supabase query
    let query = supabaseIdeas
      .from("product_hunt_products")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,product_description.ilike.%${search}%`);
    }

    // Apply category filter (using category_tags)
    if (category && category !== "All Categories") {
      query = query.ilike("category_tags", `%${category.toUpperCase()}%`);
    }

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order("upvotes", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: rawIdeas, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      throw new Error("Failed to fetch ideas from database");
    }

    // Transform Product Hunt data to our idea format
    const transformedIdeas = (rawIdeas || []).map(product => ({
      id: product.id,
      title: product.name,
      description: product.product_description,
      category: extractPrimaryCategory(product.category_tags),
      difficulty: estimateDifficulty(product.upvotes),
      target_audience: estimateTargetAudience(product.category_tags),
      tags: parseTagsArray(product.category_tags),
      upvotes: product.upvotes,
      websites: parseWebsitesArray(product.websites),
      makers: parseMakersArray(product.makers),
      created_at: product.created_at,
      source: "product_hunt"
    }));

    // Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Format response
    const response = {
      ideas: transformedIdeas,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      filters: {
        search,
        category,
        difficulty
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Explore API error:", error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Helper functions to transform Product Hunt data
function extractPrimaryCategory(categoryTags) {
  if (!categoryTags) return "Technology";

  try {
    const tags = JSON.parse(categoryTags.replace(/"/g, """));
    const categoryMap = {
      "PRODUCTIVITY": "Productivity",
      "TECH": "Technology",
      "ARTIFICIAL INTELLIGENCE": "AI & Machine Learning",
      "MARKETING": "Marketing",
      "DESIGN TOOLS": "Design",
      "DEVELOPER TOOLS": "Development",
      "SAAS": "SaaS",
      "CHROME EXTENSIONS": "Browser Extensions",
      "IPHONE": "Mobile Apps",
      "SEO TOOLS": "SEO & Analytics"
    };

    for (const tag of tags) {
      if (categoryMap[tag]) {
        return categoryMap[tag];
      }
    }

    return tags[0] || "Technology";
  } catch (e) {
    return "Technology";
  }
}

function estimateDifficulty(upvotes) {
  if (upvotes >= 500) return "hard";
  if (upvotes >= 100) return "medium";
  return "easy";
}

function estimateTargetAudience(categoryTags) {
  if (!categoryTags) return "General";

  try {
    const tags = JSON.parse(categoryTags.replace(/"/g, """));

    if (tags.includes("DEVELOPER TOOLS")) return "Developers";
    if (tags.includes("DESIGN TOOLS")) return "Designers";
    if (tags.includes("MARKETING")) return "Marketers";
    if (tags.includes("PRODUCTIVITY")) return "Professionals";
    if (tags.includes("SAAS")) return "Businesses";

    return "General";
  } catch (e) {
    return "General";
  }
}

function parseTagsArray(categoryTags) {
  if (!categoryTags) return [];

  try {
    const tags = JSON.parse(categoryTags.replace(/"/g, """));
    return tags.map(tag => tag.toLowerCase().replace(/_/g, " "));
  } catch (e) {
    return [];
  }
}

function parseWebsitesArray(websites) {
  if (!websites) return [];

  try {
    return JSON.parse(websites.replace(/"/g, """));
  } catch (e) {
    return [];
  }
}

function parseMakersArray(makers) {
  if (!makers) return [];

  try {
    return JSON.parse(makers.replace(/"/g, """));
  } catch (e) {
    return [];
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
