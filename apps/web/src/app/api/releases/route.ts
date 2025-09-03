import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/releases
 * Fetch releases for authenticated user/artist
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const whereClause: any = {}
    if (artistId) {
      whereClause.artistId = artistId
    }
    if (status) {
      whereClause.status = status
    }

    const releases = await prisma.release.findMany({
      where: whereClause,
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        tracks: {
          select: {
            id: true,
            title: true,
            isrc: true,
            duration: true,
            trackNumber: true,
          },
          orderBy: {
            trackNumber: 'asc',
          },
        },
        distribution: {
          select: {
            id: true,
            provider: true,
            status: true,
            submittedAt: true,
            approvedAt: true,
          },
        },
        stores: {
          select: {
            store: true,
            status: true,
            goLiveDate: true,
            storeUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: releases,
    })
  } catch (error) {
    console.error('Error fetching releases:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch releases',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/releases
 * Create a new release
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      artistId,
      releaseType = 'SINGLE',
      releaseDate,
      label,
      copyright,
      genre,
      coverArt,
      tracks = [],
    } = body

    if (!title || !artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and artist ID are required',
        },
        { status: 400 }
      )
    }

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, organizationId: true },
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

    // Generate UPC if needed (simplified - in production use GS1)
    const upc = `UPC${Date.now()}`

    // Create release in transaction
    const release = await prisma.$transaction(async (tx) => {
      const newRelease = await tx.release.create({
        data: {
          title,
          artistId,
          upc,
          releaseType,
          releaseDate: releaseDate ? new Date(releaseDate) : null,
          label,
          copyright,
          genre,
          coverArt,
          status: 'DRAFT',
        },
      })

      // Create tracks if provided
      if (tracks.length > 0) {
        const tracksData = tracks.map((track: any, index: number) => ({
          title: track.title,
          artistId,
          releaseId: newRelease.id,
          isrc: track.isrc || `ISRC${Date.now()}${index}`, // Generate ISRC
          duration: track.duration,
          trackNumber: track.trackNumber || index + 1,
          explicit: track.explicit || false,
          genres: track.genres || [],
          audioUrl: track.audioUrl,
        }))

        await tx.track.createMany({
          data: tracksData,
        })
      }

      return newRelease
    })

    // Fetch complete release with relations
    const completeRelease = await prisma.release.findUnique({
      where: { id: release.id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        tracks: {
          orderBy: {
            trackNumber: 'asc',
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: completeRelease,
      message: 'Release created successfully',
    })
  } catch (error) {
    console.error('Error creating release:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create release',
      },
      { status: 500 }
    )
  }
}