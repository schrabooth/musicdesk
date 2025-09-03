import { NextRequest, NextResponse } from 'next/server'
import { IntegrationFactory } from '@musicdesk/integrations'

/**
 * GET /api/platforms/spotify/auth
 * Get Spotify authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')
    
    if (!artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist ID is required',
        },
        { status: 400 }
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/spotify/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Spotify credentials not configured',
        },
        { status: 500 }
      )
    }

    const spotify = IntegrationFactory.createSpotify(clientId, clientSecret, redirectUri)
    const authUrl = spotify.getAuthorizationUrl(`artist:${artistId}`)

    return NextResponse.json({
      success: true,
      data: {
        authUrl,
        state: `artist:${artistId}`,
      },
    })
  } catch (error) {
    console.error('Error generating Spotify auth URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate authorization URL',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/platforms/spotify/auth
 * Handle manual token submission
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, artistId } = body

    if (!code || !artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authorization code and artist ID are required',
        },
        { status: 400 }
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/spotify/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Spotify credentials not configured',
        },
        { status: 500 }
      )
    }

    const spotify = IntegrationFactory.createSpotify(clientId, clientSecret, redirectUri)
    const authResult = await spotify.authenticate({ code })

    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error,
      }, { status: 400 })
    }

    // Store credentials and connect platform to artist
    const credentials = JSON.stringify({
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresAt: authResult.expiresAt?.toISOString(),
      authenticatedAt: new Date().toISOString(),
    })

    await connectPlatformToArtist(
      artistId,
      'SPOTIFY',
      `spotify_user_${Date.now()}`, // Temporary external ID
      credentials
    )

    return NextResponse.json({
      success: true,
      data: {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt,
        message: 'Successfully connected to Spotify',
      },
    })
  } catch (error) {
    console.error('Error handling Spotify auth:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to authenticate with Spotify',
      },
      { status: 500 }
    )
  }
}