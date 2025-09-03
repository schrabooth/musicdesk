import { NextRequest, NextResponse } from 'next/server'
import { AppleMusicIntegration } from '@musicdesk/integrations/apple'
import { prisma, connectPlatformToArtist } from '@musicdesk/database'

/**
 * POST /api/platforms/apple/auth
 * Authenticate with Apple Music for Artists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, artistId, phoneNumber } = body

    if (!email || !password || !artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, password, and artist ID are required',
        },
        { status: 400 }
      )
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true }
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

    // Create Apple Music integration instance
    const appleMusic = new AppleMusicIntegration({
      email,
      password,
      twilioSid: process.env.TWILIO_ACCOUNT_SID,
      twilioToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber,
    })

    // Attempt authentication
    const authResult = await appleMusic.authenticate({
      email,
      password,
      phoneNumber,
    })

    if (!authResult.success) {
      // Clean up browser resources
      await appleMusic.cleanup()

      if (authResult.requires2FA) {
        return NextResponse.json({
          success: false,
          requires2FA: true,
          message: authResult.error || 'Two-factor authentication required',
        })
      }

      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication failed',
      }, { status: 401 })
    }

    // Get artist data to find AMI identity
    const artists = await appleMusic.getArtists(authResult)
    const matchedArtist = artists.find(a => 
      a.name.toLowerCase().includes(artist.name.toLowerCase()) ||
      artist.name.toLowerCase().includes(a.name.toLowerCase())
    )

    if (!matchedArtist) {
      await appleMusic.cleanup()
      return NextResponse.json({
        success: false,
        error: 'Artist not found in Apple Music for Artists roster',
      }, { status: 404 })
    }

    // Store credentials and connect platform to artist
    const credentials = JSON.stringify({
      email,
      cookies: authResult.cookies,
      amiIdentity: matchedArtist.id,
      authenticatedAt: new Date().toISOString(),
    })

    await connectPlatformToArtist(
      artistId,
      'APPLE_MUSIC',
      matchedArtist.id,
      credentials
    )

    // Update artist with Apple Music info
    await prisma.artist.update({
      where: { id: artistId },
      data: {
        amiIdentity: matchedArtist.id,
        appleMusicId: matchedArtist.externalUrls?.appleMusic?.split('/').pop(),
      }
    })

    // Clean up browser resources
    await appleMusic.cleanup()

    return NextResponse.json({
      success: true,
      data: {
        amiIdentity: matchedArtist.id,
        artistName: matchedArtist.name,
        appleMusicUrl: matchedArtist.externalUrls?.appleMusic,
      },
    })
  } catch (error) {
    console.error('Error authenticating with Apple Music:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platforms/apple/2fa
 * Handle 2FA code submission for pending Apple Music authentication
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, sessionId } = body

    if (!code || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code and session ID are required',
        },
        { status: 400 }
      )
    }

    // Check for active Apple Music session
    // For now, return instructions for manual completion
    return NextResponse.json({
      success: false,
      error: 'Please complete Apple Music 2FA authentication in the main auth flow. Session-based 2FA is handled automatically during initial authentication.',
      instructions: 'Use the main POST /api/platforms/apple/auth endpoint with your 2FA-enabled credentials.',
    }, { status: 400 })
  } catch (error) {
    console.error('Error handling Apple Music 2FA:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}