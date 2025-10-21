import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserIdeas } from '@/lib/userService';
import { parseErrorMessage } from '@/lib/utils';

export async function GET(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock user ideas for demonstration
    const mockIdeas = [
      {
        id: 1,
        title: "AI-Powered Task Manager",
        description: "Smart task management app that uses AI to prioritize and schedule tasks automatically.",
        category: "Technology",
        difficulty: "medium",
        target_audience: "Professionals",
        generated: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        id: 2,
        title: "Sustainable Fashion Marketplace",
        description: "Platform for buying and selling pre-owned designer clothing with authentication services.",
        category: "Fashion",
        difficulty: "hard",
        target_audience: "Consumers",
        generated: false,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        id: 3,
        title: "Local Community Garden Network",
        description: "App connecting neighbors to share garden space and resources for urban farming.",
        category: "Sustainability",
        difficulty: "easy",
        target_audience: "Communities",
        generated: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      }
    ];

    // Calculate stats
    const stats = {
      totalIdeas: mockIdeas.length,
      generatedIdeas: mockIdeas.filter(idea => idea.generated).length,
      savedIdeas: mockIdeas.filter(idea => !idea.generated).length,
      recentActivity: mockIdeas.filter(idea => {
        const ideaDate = new Date(idea.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return ideaDate >= weekAgo;
      }).length
    };

    return NextResponse.json({
      ideas: mockIdeas,
      stats
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: parseErrorMessage(error) },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
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

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
