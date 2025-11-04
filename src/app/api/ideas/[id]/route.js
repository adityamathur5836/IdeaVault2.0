import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { parseErrorMessage } from '@/lib/utils';
import { getUserIdeaById } from '@/lib/userService';
import { isSupabaseConfigured, getSupabaseConfigError } from '@/lib/supabase';

export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }

    // Mock delete operation (in a real app, this would delete from database)
    console.log(`Mock deleting idea ${id} for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Idea deleted successfully'
    });

  } catch (error) {
    console.error('Delete idea API error:', error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check Supabase configuration
    if (!isSupabaseConfigured()) {
      const configError = getSupabaseConfigError();
      return NextResponse.json(
        {
          error: configError.message,
          title: configError.title,
          action: configError.action,
          type: 'configuration_error'
        },
        { status: 503 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Idea ID is required' },
        { status: 400 }
      );
    }

    // Get the idea from the database
    const idea = await getUserIdeaById(userId, id);

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      idea
    });

  } catch (error) {
    console.error('Get idea API error:', error);

    // Handle specific error types
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Idea not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('Supabase not configured')) {
      return NextResponse.json(
        {
          error: 'Database configuration required. Please contact your administrator.',
          type: 'configuration_error'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
