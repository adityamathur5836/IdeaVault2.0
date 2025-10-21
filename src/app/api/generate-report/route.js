import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateIdeaReportWithGemini } from '@/lib/geminiService';

export async function POST(request) {
  try {
    console.log('Generate report API called');

    // Check authentication
    const { userId } = await auth();
    console.log('User ID:', userId);
    if (!userId) {
      console.log('No user ID found, returning unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { idea } = await request.json();
    console.log('Idea received:', idea);

    // Validate required fields
    if (!idea || !idea.title || !idea.description) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: idea with title and description' },
        { status: 400 }
      );
    }

    console.log('Calling generateIdeaReportWithGemini...');
    // Generate comprehensive business report using Gemini
    const report = await generateIdeaReportWithGemini(idea);
    console.log('Report generated successfully');

    return NextResponse.json({
      success: true,
      report,
      idea_id: idea.id,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Generate report API error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Return specific error messages for different failure types
    if (error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 503 }
      );
    }

    if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 429 }
      );
    }

    // Include the actual error message for debugging
    return NextResponse.json(
      { error: `Failed to generate business report: ${error.message}` },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cached reports (if implemented)
export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('idea_id');

    if (!ideaId) {
      return NextResponse.json(
        { error: 'Missing idea_id parameter' },
        { status: 400 }
      );
    }

    // TODO: Implement report caching/retrieval from database
    // For now, return a message indicating reports are generated on-demand
    return NextResponse.json({
      message: 'Reports are generated on-demand. Use POST endpoint to generate a new report.',
      idea_id: ideaId
    });

  } catch (error) {
    console.error('Get report API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
