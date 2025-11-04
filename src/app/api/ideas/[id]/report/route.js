import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getIdeaReport, createIdeaReport, getUserIdeaById } from "@/lib/userService";

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Verify user owns the idea
    const idea = await getUserIdeaById(userId, id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    const report = await getIdeaReport(userId, id);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error("Error fetching idea report:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea report" },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Verify user owns the idea
    const idea = await getUserIdeaById(userId, id);
    if (!idea) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 });
    }

    // Check if report already exists
    const existingReport = await getIdeaReport(userId, id);
    if (existingReport) {
      return NextResponse.json({ error: "Report already exists" }, { status: 409 });
    }

    const reportData = {
      business_concept: body.business_concept || {},
      market_intelligence: body.market_intelligence || {},
      product_strategy: body.product_strategy || {},
      go_to_market: body.go_to_market || {},
      financial_foundation: body.financial_foundation || {},
      evaluation: body.evaluation || {}
    };

    const report = await createIdeaReport(userId, id, reportData);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error("Error creating idea report:", error);
    return NextResponse.json(
      { error: "Failed to create idea report" },
      { status: 500 }
    );
  }
}
