import { NextRequest, NextResponse } from 'next/server'
import { DistroKidIntegration, activeSessions } from '@musicdesk/integrations/distrokid'
import { prisma, connectPlatformToArtist } from '@musicdesk/database'

/**
 * POST /api/platforms/distrokid/auth
 * Initiate DistroKid authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, artistId } = body

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

    // Create DistroKid integration
    const distroKid = new DistroKidIntegration({
      email,
      password,
      imapEmail: process.env.MIGADU_DISTROKID_EMAIL,
      imapPassword: process.env.MIGADU_DISTROKID_PASSWORD,
    })

    // Attempt authentication
    const authResult = await distroKid.authenticate({
      email,
      password,
    })

    if (!authResult.success) {
      await distroKid.cleanup()

      if (authResult.requires2FA) {
        return NextResponse.json({
          success: false,
          requires2FA: true,
          sessionId: authResult.sessionId,
          message: authResult.error || 'Two-factor authentication required',
        })
      }

      return NextResponse.json({
        success: false,
        error: authResult.error || 'Authentication failed',
      }, { status: 401 })
    }

    // Store credentials and connect platform
    const credentials = JSON.stringify({
      email,
      cookies: authResult.cookies,
      distrokidId: authResult.accessToken,
      authenticatedAt: new Date().toISOString(),
    })

    await connectPlatformToArtist(
      artistId,
      'DISTROKID',
      authResult.accessToken || email,
      credentials
    )

    await distroKid.cleanup()

    return NextResponse.json({
      success: true,
      data: {
        distrokidId: authResult.accessToken,
        message: 'Successfully connected to DistroKid',
      },
    })
  } catch (error) {
    console.error('Error authenticating with DistroKid:', error)
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
 * PUT /api/platforms/distrokid/auth
 * Submit 2FA code for pending authentication
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, code, artistId } = body

    if (!sessionId || !code || !artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID, code, and artist ID are required',
        },
        { status: 400 }
      )
    }

    // Check if session exists
    const session = activeSessions.get(sessionId)
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session expired or invalid',
        },
        { status: 400 }
      )
    }

    // Create temporary integration instance for 2FA submission
    const distroKid = new DistroKidIntegration({
      email: session.email,
      password: session.password,
    })

    const authResult = await distroKid.submit2FACode(sessionId, code)

    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error || '2FA verification failed',
      }, { status: 400 })
    }

    // Store credentials and connect platform
    const credentials = JSON.stringify({
      email: session.email,
      cookies: authResult.cookies,
      distrokidId: authResult.accessToken,
      authenticatedAt: new Date().toISOString(),
    })

    await connectPlatformToArtist(
      artistId,
      'DISTROKID',
      authResult.accessToken || session.email,
      credentials
    )

    return NextResponse.json({
      success: true,
      data: {
        distrokidId: authResult.accessToken,
        message: 'Successfully connected to DistroKid with 2FA',
      },
    })
  } catch (error) {
    console.error('Error handling DistroKid 2FA:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}