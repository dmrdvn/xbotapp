import { NextRequest, NextResponse } from 'next/server';
import { updateProfile } from '@/services/firebase/profile';
import { createLog } from '@/services/firebase/log';
import { LogType, LogSeverity } from '@/types/log';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profile_id');

    if (!profileId) {
      return NextResponse.json(
        { success: false, message: 'Profile ID is required' },
        { status: 400 }
      );
    }

    // Update profile to remove Twitter connection
    const response = await updateProfile(profileId, {
      twitterAccessToken: null,
      twitterTokenExpiresAt: null,
      twitterConnected: false
    });

    if (!response.success) {
      throw new Error(response.message || 'Failed to update profile');
    }

    // Create log
    await createLog({
      userId: profileId,
      type: LogType.PROFILE_UPDATED,
      severity: LogSeverity.MEDIUM,
      message: "Twitter connection removed",
      metadata: {
        profileId: profileId,
        details: {
          code: "TWITTER_DISCONNECTED",
          name: profileId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Twitter disconnect error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to disconnect Twitter account' },
      { status: 500 }
    );
  }
} 