import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateMilestone, deleteMilestone } from "@/lib/userService";

export async function PUT(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const updates = {};
    if (body.title !== undefined) updates.title = body.title.trim();
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.status !== undefined) updates.status = body.status;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.due_date !== undefined) updates.due_date = body.due_date || null;
    if (body.completion_percentage !== undefined) updates.completion_percentage = body.completion_percentage;

    const milestone = await updateMilestone(userId, id, updates);

    return NextResponse.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // PATCH is used for partial updates, especially status changes
    const updates = {};
    if (body.status !== undefined) {
      updates.status = body.status;
      // Auto-update completion percentage based on status
      if (body.status === "completed") {
        updates.completion_percentage = 100;
      } else if (body.status === "in_progress" && !body.completion_percentage) {
        updates.completion_percentage = 25; // Default progress
      }
    }
    if (body.completion_percentage !== undefined) {
      updates.completion_percentage = body.completion_percentage;
    }

    const milestone = await updateMilestone(userId, id, updates);

    return NextResponse.json({
      success: true,
      milestone
    });
  } catch (error) {
    console.error("Error updating milestone status:", error);
    return NextResponse.json(
      { error: "Failed to update milestone status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    await deleteMilestone(userId, id);

    return NextResponse.json({
      success: true,
      message: "Milestone deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 }
    );
  }
}
