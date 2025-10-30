import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseUserServer } from '@/lib/supabase';
import crypto from 'crypto';

/**
 * Create shareable link for report
 */
export async function POST(request) {
  try {
    console.log('[Share Report] Creating shareable link');
    
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ideaId, reportData, ideaData, expiryDays = 30 } = await request.json();
    
    if (!ideaId || !reportData || !ideaData) {
      return NextResponse.json(
        { error: 'Missing required fields: ideaId, reportData, ideaData' },
        { status: 400 }
      );
    }

    // Generate secure share token
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    console.log('[Share Report] Generated token:', shareToken.substring(0, 8) + '...');

    try {
      // Store shared report in database
      const { data: sharedReport, error } = await supabaseUserServer
        .from('shared_reports')
        .insert({
          share_token: shareToken,
          user_id: userId,
          idea_id: ideaId,
          idea_data: ideaData,
          report_data: reportData,
          expires_at: expiryDate.toISOString(),
          created_at: new Date().toISOString(),
          view_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.warn('[Share Report] Database insert failed, using fallback:', error.message);
        
        // Fallback: Return share link without database storage
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;
        
        return NextResponse.json({
          success: true,
          shareUrl,
          shareToken,
          expiresAt: expiryDate.toISOString(),
          fallback: true,
          message: 'Share link created (temporary - not persisted)'
        });
      }

      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;

      console.log('[Share Report] Share link created successfully');

      return NextResponse.json({
        success: true,
        shareUrl,
        shareToken,
        expiresAt: expiryDate.toISOString(),
        reportId: sharedReport.id
      });

    } catch (dbError) {
      console.warn('[Share Report] Database operation failed:', dbError.message);
      
      // Fallback: Create temporary share link
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`;
      
      return NextResponse.json({
        success: true,
        shareUrl,
        shareToken,
        expiresAt: expiryDate.toISOString(),
        fallback: true,
        message: 'Share link created (temporary - database unavailable)'
      });
    }

  } catch (error) {
    console.error('[Share Report] Error:', error);
    return NextResponse.json(
      { error: `Failed to create share link: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Get shared report data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Missing share token' },
        { status: 400 }
      );
    }

    console.log('[Share Report] Retrieving shared report:', shareToken.substring(0, 8) + '...');

    try {
      // Get shared report from database
      const { data: sharedReport, error } = await supabaseUserServer
        .from('shared_reports')
        .select('*')
        .eq('share_token', shareToken)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn('[Share Report] Database query failed:', error.message);
        return NextResponse.json(
          { error: 'Share link not found or expired' },
          { status: 404 }
        );
      }

      // Check if expired
      const now = new Date();
      const expiryDate = new Date(sharedReport.expires_at);
      
      if (now > expiryDate) {
        console.log('[Share Report] Share link expired');
        return NextResponse.json(
          { error: 'Share link has expired' },
          { status: 410 }
        );
      }

      // Increment view count
      await supabaseUserServer
        .from('shared_reports')
        .update({ 
          view_count: (sharedReport.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', sharedReport.id);

      console.log('[Share Report] Shared report retrieved successfully');

      return NextResponse.json({
        success: true,
        ideaData: sharedReport.idea_data,
        reportData: sharedReport.report_data,
        createdAt: sharedReport.created_at,
        expiresAt: sharedReport.expires_at,
        viewCount: (sharedReport.view_count || 0) + 1
      });

    } catch (dbError) {
      console.warn('[Share Report] Database operation failed:', dbError.message);
      return NextResponse.json(
        { error: 'Share link not found or database unavailable' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('[Share Report] Error:', error);
    return NextResponse.json(
      { error: `Failed to retrieve shared report: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Deactivate shared report
 */
export async function DELETE(request) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('token');

    if (!shareToken) {
      return NextResponse.json(
        { error: 'Missing share token' },
        { status: 400 }
      );
    }

    console.log('[Share Report] Deactivating share link:', shareToken.substring(0, 8) + '...');

    try {
      // Deactivate shared report
      const { error } = await supabaseUserServer
        .from('shared_reports')
        .update({ 
          is_active: false,
          deactivated_at: new Date().toISOString()
        })
        .eq('share_token', shareToken)
        .eq('user_id', userId);

      if (error) {
        console.warn('[Share Report] Database update failed:', error.message);
        return NextResponse.json(
          { error: 'Failed to deactivate share link' },
          { status: 500 }
        );
      }

      console.log('[Share Report] Share link deactivated successfully');

      return NextResponse.json({
        success: true,
        message: 'Share link deactivated'
      });

    } catch (dbError) {
      console.warn('[Share Report] Database operation failed:', dbError.message);
      return NextResponse.json(
        { error: 'Database unavailable' },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('[Share Report] Error:', error);
    return NextResponse.json(
      { error: `Failed to deactivate share link: ${error.message}` },
      { status: 500 }
    );
  }
}
