import { NextRequest, NextResponse } from 'next/server'
import { prisma, createOrUpdateArtist } from '@musicdesk/database'

/**
 * GET /api/artists
 * Fetch all artists for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // For now, we'll return all artists
    // In production, this should be filtered by user authentication
    const artists = await prisma.artist.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        bio: true,
        avatar: true,
        verified: true,
        genres: true,
        spotifyId: true,
        appleMusicId: true,
        amiIdentity: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tracks: true,
            releases: true,
            royalties: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: artists,
    })
  } catch (error) {
    console.error('Error fetching artists:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artists',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/artists
 * Create or update an artist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, spotifyId, appleMusicId, amiIdentity, genres, verified } = body

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist name is required',
        },
        { status: 400 }
      )
    }

    // For now, use a default organization ID
    // In production, this should come from the authenticated user
    const defaultOrgId = 'cm0vm1234567890123456789' // You'll need to create this

    const artist = await createOrUpdateArtist({
      name,
      organizationId: defaultOrgId,
      spotifyId,
      appleMusicId,
      amiIdentity,
      genres: genres || [],
      verified: verified || false,
    })

    return NextResponse.json({
      success: true,
      data: artist,
    })
  } catch (error) {
    console.error('Error creating/updating artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create/update artist',
      },
      { status: 500 }
    )
  }
}