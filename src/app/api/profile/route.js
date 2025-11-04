import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { parseErrorMessage } from "@/lib/utils";

export async function GET(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mock user profile (in a real app, this would fetch from database)
    const mockProfile = {
      username: "demo_user",
      bio: "Passionate entrepreneur exploring innovative business ideas",
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        communityUpdates: true
      }
    };

    return NextResponse.json({
      profile: mockProfile
    });

  } catch (error) {
    console.error("Profile GET API error:", error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const profileData = await request.json();

    // Validate required fields
    if (!profileData.username && !profileData.bio && !profileData.preferences) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 }
      );
    }

    // Mock profile update (in a real app, this would update the database)
    const updatedProfile = {
      username: profileData.username || "demo_user",
      bio: profileData.bio || "",
      preferences: profileData.preferences || {
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true,
        communityUpdates: true
      },
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      profile: updatedProfile
    });

  } catch (error) {
    console.error("Profile PUT API error:", error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
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
