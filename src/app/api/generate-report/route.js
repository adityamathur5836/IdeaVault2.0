import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateIdeaReportWithGemini } from '@/lib/geminiService';
import { supabaseUserServer } from '@/lib/supabase';

// Report generation queue and cache
const reportQueue = new Map();
const reportCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Generate checksum for idea validation
 */
function generateIdeaChecksum(idea) {
  const data = `${idea.title}_${idea.description}_${idea.category || ''}_${Date.now()}`;
  return Buffer.from(data).toString('base64').substring(0, 16);
}

/**
 * Fetch idea from database with validation
 */
async function fetchAndValidateIdea(ideaId, userId) {
  try {
    const { data: idea, error } = await supabaseUserServer
      .from('user_ideas')
      .select('*')
      .eq('id', ideaId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Idea not found in user_ideas, using provided data');
      return null;
    }

    return idea;
  } catch (error) {
    console.warn('Database fetch failed:', error.message);
    return null;
  }
}

export async function POST(request) {
  const startTime = Date.now();
  let ideaChecksum = null;

  try {
    console.log('[Report Generation] API called');

    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      console.log('[Report Generation] Unauthorized access');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { idea, ideaId } = await request.json();
    console.log('[Report Generation] Request data:', { ideaId, ideaTitle: idea?.title });

    // Validate required fields
    if (!idea || !idea.title || !idea.description) {
      console.log('[Report Generation] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: idea with title and description' },
        { status: 400 }
      );
    }

    // Generate checksum for validation
    ideaChecksum = generateIdeaChecksum(idea);
    console.log('[Report Generation] Idea checksum:', ideaChecksum);

    // Check if report is already being generated
    const queueKey = `${userId}_${ideaId || idea.id}`;
    if (reportQueue.has(queueKey)) {
      console.log('[Report Generation] Report already in queue');
      return NextResponse.json(
        { error: 'Report generation already in progress' },
        { status: 429 }
      );
    }

    // Check cache first
    const cacheKey = `report_${ideaChecksum}`;
    const cached = reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Report Generation] Using cached report');
      return NextResponse.json({
        success: true,
        report: cached.data,
        idea_id: ideaId || idea.id,
        generated_at: cached.timestamp,
        cached: true
      });
    }

    // Add to queue
    reportQueue.set(queueKey, { startTime, ideaChecksum });

    try {
      // Parallel processing: Fetch from database and prepare for Gemini
      const [dbIdea] = await Promise.allSettled([
        ideaId ? fetchAndValidateIdea(ideaId, userId) : Promise.resolve(null)
      ]);

      // Use database idea if available, otherwise use provided idea
      const finalIdea = dbIdea.status === 'fulfilled' && dbIdea.value ? dbIdea.value : idea;

      // Validate idea consistency
      if (ideaId && dbIdea.status === 'fulfilled' && dbIdea.value) {
        if (dbIdea.value.title !== idea.title) {
          console.warn('[Report Generation] Idea mismatch detected:', {
            requestedId: ideaId,
            dbTitle: dbIdea.value.title,
            providedTitle: idea.title
          });
        }
      }

      console.log('[Report Generation] Calling Gemini API...');
      // Generate comprehensive business report using Gemini
      const report = await generateIdeaReportWithGemini(finalIdea);

      const generationTime = Date.now() - startTime;
      console.log(`[Report Generation] Completed in ${generationTime}ms`);

      // Cache the result
      reportCache.set(cacheKey, {
        data: report,
        timestamp: Date.now()
      });

      return NextResponse.json({
        success: true,
        report,
        idea_id: ideaId || finalIdea.id,
        generated_at: new Date().toISOString(),
        generation_time_ms: generationTime,
        checksum: ideaChecksum
      });

    } finally {
      // Remove from queue
      reportQueue.delete(queueKey);
    }

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('[Report Generation] Error:', error);
    console.error('[Report Generation] Error details:', {
      message: error.message,
      stack: error.stack,
      generationTime,
      ideaChecksum
    });

    // Return specific error messages for different failure types
    if (error.message.includes('API key')) {
      return NextResponse.json(
        {
          error: 'AI service configuration error. Please contact support.',
          generation_time_ms: generationTime
        },
        { status: 503 }
      );
    }

    if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
      return NextResponse.json(
        {
          error: 'AI service temporarily unavailable. Please try again later.',
          generation_time_ms: generationTime
        },
        { status: 429 }
      );
    }

    if (error.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Report generation timed out. Please try again.',
          generation_time_ms: generationTime
        },
        { status: 408 }
      );
    }

    // Include the actual error message for debugging
    return NextResponse.json(
      {
        error: `Failed to generate business report: ${error.message}`,
        generation_time_ms: generationTime,
        checksum: ideaChecksum
      },
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
