import { NextRequest, NextResponse } from 'next/server'
import { IntegrationFactory } from '@musicdesk/integrations'

/**
 * GET /api/platforms/spotify/search
 * Search for Spotify artists
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query is required',
        },
        { status: 400 }
      )
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Spotify credentials not configured',
        },
        { status: 500 }
      )
    }

    const spotify = IntegrationFactory.createSpotify(clientId, clientSecret)
    
    // Use client credentials (no user auth needed for search)
    const artists = await spotify.searchArtists(query, { success: true })

    return NextResponse.json({
      success: true,
      data: {
        query,
        artists,
      },
    })
  } catch (error) {
    console.error('Error searching Spotify artists:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search artists',
      },
      { status: 500 }
    )
  }
}