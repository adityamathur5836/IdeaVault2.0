import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCredits, updateUserCredits } from '@/lib/userService';

export async function GET(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const credits = await getUserCredits(userId);

    return NextResponse.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Error fetching credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { used_credits } = body;

    if (typeof used_credits !== 'number' || used_credits < 0) {
      return NextResponse.json(
        { error: 'Invalid credits amount' },
        { status: 400 }
      );
    }

    const credits = await updateUserCredits(userId, used_credits);

    return NextResponse.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Error updating credits:', error);
    return NextResponse.json(
      { error: 'Failed to update credits' },
      { status: 500 }
    );
  }
}
