import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPreferences, upsertUserPreferences } from "@/lib/userService";

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await getUserPreferences(userId);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      interests, 
      experience_level, 
      time_commitment, 
      capital_available, 
      preferred_ai_role, 
      target_audience 
    } = body;

    // Validate experience level
    const validExperienceLevels = ["Beginner", "Intermediate", "Expert"];
    if (experience_level && !validExperienceLevels.includes(experience_level)) {
      return NextResponse.json(
        { error: "Invalid experience level" },
        { status: 400 }
      );
    }

    // Validate time commitment
    const validTimeCommitments = ["Part-time", "Full-time"];
    if (time_commitment && !validTimeCommitments.includes(time_commitment)) {
      return NextResponse.json(
        { error: "Invalid time commitment" },
        { status: 400 }
      );
    }

    // Validate capital available
    if (capital_available && (isNaN(capital_available) || capital_available < 0)) {
      return NextResponse.json(
        { error: "Invalid capital amount" },
        { status: 400 }
      );
    }

    const preferencesData = {
      interests: interests?.trim() || null,
      experience_level: experience_level || "Beginner",
      time_commitment: time_commitment || "Part-time",
      capital_available: capital_available ? parseFloat(capital_available) : null,
      preferred_ai_role: preferred_ai_role || "advisor",
      target_audience: Array.isArray(target_audience) ? target_audience : []
    };

    const preferences = await upsertUserPreferences(userId, preferencesData);

    return NextResponse.json({
      success: true,
      preferences
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
