import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMilestones, createMilestone } from "@/lib/userService";

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const ideaId = searchParams.get("idea_id");

    const filters = {};
    if (status) filters.status = status;
    if (ideaId) filters.idea_id = ideaId;

    const milestones = await getMilestones(userId, filters);

    return NextResponse.json({
      success: true,
      milestones
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
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
    const { title, description, idea_id, status, priority, due_date, completion_percentage } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const milestoneData = {
      title: title.trim(),
      description: description?.trim() || null,
      idea_id: idea_id || null,
      status: status || "not_started",
      priority: priority || "medium",
      due_date: due_date || null,
      completion_percentage: completion_percentage || 0
    };

    const milestone = await createMilestone(userId, milestoneData);

    return NextResponse.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
      { status: 500 }
    );
  }
}
