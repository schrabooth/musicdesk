import { NextRequest, NextResponse } from 'next/server'
import { prisma, getArtistAnalytics, getUnclaimedRoyalties } from '@musicdesk/database'

/**
 * GET /api/artists/[id]
 * Fetch a specific artist with detailed information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        platforms: {
          select: {
            id: true,
            type: true,
            status: true,
            lastSync: true,
          },
        },
        tracks: {
          select: {
            id: true,
            title: true,
            isrc: true,
            duration: true,
            trackNumber: true,
            spotifyId: true,
            appleMusicId: true,
          },
          take: 10, // Limit to latest 10 tracks
          orderBy: {
            createdAt: 'desc',
          },
        },
        releases: {
          select: {
            id: true,
            title: true,
            upc: true,
            releaseType: true,
            status: true,
            releaseDate: true,
            coverArt: true,
          },
          take: 5, // Limit to latest 5 releases
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            tracks: true,
            releases: true,
            royalties: true,
            analytics: true,
          },
        },
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

    // Fetch recent analytics data
    const analytics = await getArtistAnalytics(id)
    
    // Fetch unclaimed royalties
    const unclaimedRoyalties = await getUnclaimedRoyalties(id)

    return NextResponse.json({
      success: true,
      data: {
        ...artist,
        analytics,
        unclaimedRoyalties,
      },
    })
  } catch (error) {
    console.error('Error fetching artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artist',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/artists/[id]
 * Update an artist
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { name, bio, avatar, genres, verified, socialLinks } = body

    const artist = await prisma.artist.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
        ...(genres && { genres }),
        ...(verified !== undefined && { verified }),
        ...(socialLinks && { socialLinks }),
      },
    })

    return NextResponse.json({
      success: true,
      data: artist,
    })
  } catch (error) {
    console.error('Error updating artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update artist',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/artists/[id]
 * Delete an artist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.artist.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Artist deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete artist',
      },
      { status: 500 }
    )
  }
}