import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseErrorMessage } from "@/lib/utils";
import { saveUserIdea } from "@/lib/userService";

export async function POST(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ideaData = await request.json();

    // Validate required fields
    if (!ideaData.title || !ideaData.description) {
      return NextResponse.json(
        { error: "Missing required fields: title and description" },
        { status: 400 }
      );
    }

    // Save the idea to database
    const savedIdea = await saveUserIdea(userId, {
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category || "Other",
      difficulty: ideaData.difficulty || "medium",
      target_audience: ideaData.target_audience || "General",
      tags: ideaData.tags || [],
      is_generated: ideaData.generated || false,
      source_data: ideaData.source_data || null,
      status: "saved"
    });

    return NextResponse.json({
      success: true,
      idea: savedIdea
    });

  } catch (error) {
    console.error("Save idea API error:", error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
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
