import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * POST /api/artists/[id]/claim
 * Claim ownership of an artist and initiate verification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { userId, platform, credentials, claimType } = body

    if (!userId || !platform) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID and platform are required',
        },
        { status: 400 }
      )
    }

    // Check if artist exists
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        users: true,
        platforms: true,
      },
    })

    if (!artist) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist not found',
        },
        { status: 404 }
      )
    }

    // Check if user already has a relationship with this artist
    const existingRelation = await prisma.userArtist.findUnique({
      where: {
        userId_artistId: {
          userId,
          artistId: id,
        },
      },
    })

    if (existingRelation) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have a relationship with this artist',
          currentRole: existingRelation.role,
        },
        { status: 409 }
      )
    }

    // Start verification process based on platform
    let verificationResult
    
    switch (platform) {
      case 'SPOTIFY':
        verificationResult = await verifySpotifyOwnership(artist, userId, credentials)
        break
      case 'APPLE_MUSIC':
        verificationResult = await verifyAppleMusicOwnership(artist, userId, credentials)
        break
      default:
        verificationResult = {
          success: false,
          error: 'Unsupported verification platform',
        }
    }

    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        error: verificationResult.error || 'Verification failed',
      }, { status: 400 })
    }

    // Create user-artist relationship with pending verification
    const userArtist = await prisma.userArtist.create({
      data: {
        userId,
        artistId: id,
        role: 'VIEWER', // Start with viewer until verified
      },
    })

    // Create or update platform connection
    const platform_connection = await prisma.platform.upsert({
      where: {
        type_externalId: {
          type: platform,
          externalId: verificationResult.externalId,
        },
      },
      update: {
        status: 'PENDING',
        metadata: {
          claimUserId: userId,
          claimType,
          verificationData: verificationResult.data,
          claimedAt: new Date().toISOString(),
        },
      },
      create: {
        artistId: id,
        type: platform,
        externalId: verificationResult.externalId,
        status: 'PENDING',
        metadata: {
          claimUserId: userId,
          claimType,
          verificationData: verificationResult.data,
          claimedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        userArtistId: userArtist.id,
        platformConnectionId: platform_connection.id,
        verificationStatus: 'PENDING',
        message: `Artist claim submitted for ${platform} verification`,
        nextSteps: verificationResult.nextSteps,
      },
    })
  } catch (error) {
    console.error('Error claiming artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to claim artist',
      },
      { status: 500 }
    )
  }
}

/**
 * Verify Spotify ownership through Spotify for Artists
 */
async function verifySpotifyOwnership(artist: any, userId: string, credentials: any) {
  // Check if artist has Spotify ID
  if (!artist.spotifyId) {
    return {
      success: false,
      error: 'Artist does not have a Spotify ID for verification',
    }
  }

  // In production, this would:
  // 1. Use Spotify for Artists API to check roster
  // 2. Send team invitation if not already on roster
  // 3. Monitor invitation acceptance
  // 4. Verify user has access to artist analytics

  // For now, simulate the process
  return {
    success: true,
    externalId: artist.spotifyId,
    data: {
      spotifyId: artist.spotifyId,
      artistName: artist.name,
      verificationMethod: 'roster_invitation',
    },
    nextSteps: [
      'Check your Spotify for Artists dashboard',
      'Accept the team invitation from MusicDesk',
      'Verification will be completed automatically',
    ],
  }
}

/**
 * Verify Apple Music ownership through Apple Music for Artists
 */
async function verifyAppleMusicOwnership(artist: any, userId: string, credentials: any) {
  if (!artist.amiIdentity && !artist.appleMusicId) {
    return {
      success: false,
      error: 'Artist does not have Apple Music identifiers for verification',
    }
  }

  // In production, this would:
  // 1. Use Apple Music for Artists automation
  // 2. Send team invitation to user's email
  // 3. Monitor invitation acceptance
  // 4. Verify analytics access

  return {
    success: true,
    externalId: artist.amiIdentity || artist.appleMusicId,
    data: {
      amiIdentity: artist.amiIdentity,
      appleMusicId: artist.appleMusicId,
      artistName: artist.name,
      verificationMethod: 'team_invitation',
    },
    nextSteps: [
      'Check your Apple Music for Artists dashboard',
      'Accept the team invitation from MusicDesk',
      'Verification will be completed automatically',
    ],
  }
}