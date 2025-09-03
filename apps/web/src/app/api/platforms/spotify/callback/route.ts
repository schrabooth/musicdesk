import { NextRequest, NextResponse } from 'next/server'
import { IntegrationFactory } from '@musicdesk/integrations'
import { prisma, connectPlatformToArtist } from '@musicdesk/database'

/**
 * GET /api/platforms/spotify/callback
 * Handle Spotify OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=spotify_auth_denied`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=missing_auth_params`
      )
    }

    // Extract artist ID from state
    const artistId = state.startsWith('artist:') ? state.slice(7) : null
    if (!artistId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=invalid_state`
      )
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true }
    })

    if (!artist) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=artist_not_found`
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/platforms/spotify/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=spotify_config_missing`
      )
    }

    // Exchange code for tokens
    const spotify = IntegrationFactory.createSpotify(clientId, clientSecret, redirectUri)
    const authResult = await spotify.authenticate({ code })

    if (!authResult.success) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/artists?error=auth_failed&message=${encodeURIComponent(authResult.error || 'Unknown error')}`
      )
    }

    // Get user's Spotify profile to use as external ID
    const spotifyArtist = await spotify.getArtists(authResult)
    const userProfile = spotifyArtist[0] // This would typically be the user's profile

    // Store credentials and connect platform to artist
    const credentials = JSON.stringify({
      accessToken: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresAt: authResult.expiresAt?.toISOString(),
    })

    await connectPlatformToArtist(
      artistId,
      'SPOTIFY',
      userProfile?.id || `user_${Date.now()}`, // Use actual Spotify user ID
      credentials
    )

    // Redirect back to artist dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/artists/${artistId}?connected=spotify`
    )
  } catch (error) {
    console.error('Error in Spotify callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/artists?error=callback_failed`
    )
  }
}