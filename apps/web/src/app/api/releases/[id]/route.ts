import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/releases/[id]
 * Get specific release details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const release = await prisma.release.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            name: true,
            avatar: true,
            verified: true,
          },
        },
        tracks: {
          orderBy: {
            trackNumber: 'asc',
          },
        },
        distribution: {
          select: {
            id: true,
            provider: true,
            status: true,
            externalId: true,
            submittedAt: true,
            approvedAt: true,
            metadata: true,
          },
        },
        stores: {
          select: {
            store: true,
            status: true,
            storeUrl: true,
            goLiveDate: true,
          },
        },
      },
    })

    if (!release) {
      return NextResponse.json(
        {
          success: false,
          error: 'Release not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: release,
    })
  } catch (error) {
    console.error('Error fetching release:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch release',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/releases/[id]
 * Update release details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const {
      title,
      releaseType,
      releaseDate,
      label,
      copyright,
      genre,
      coverArt,
      status,
    } = body

    const release = await prisma.release.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(releaseType && { releaseType }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
        ...(label !== undefined && { label }),
        ...(copyright !== undefined && { copyright }),
        ...(genre !== undefined && { genre }),
        ...(coverArt !== undefined && { coverArt }),
        ...(status && { status }),
      },
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
      data: release,
      message: 'Release updated successfully',
    })
  } catch (error) {
    console.error('Error updating release:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update release',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/releases/[id]
 * Delete a release (only if not distributed)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if release can be deleted (not distributed)
    const release = await prisma.release.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        distribution: {
          select: {
            status: true,
          },
        },
      },
    })

    if (!release) {
      return NextResponse.json(
        {
          success: false,
          error: 'Release not found',
        },
        { status: 404 }
      )
    }

    if (release.status === 'DISTRIBUTED' || release.status === 'LIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete distributed releases',
        },
        { status: 400 }
      )
    }

    await prisma.release.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Release deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting release:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete release',
      },
      { status: 500 }
    )
  }
}