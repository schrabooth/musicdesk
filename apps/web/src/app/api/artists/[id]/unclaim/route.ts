import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * DELETE /api/artists/[id]/unclaim
 * Remove artist from user's list (unclaim)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // In production, get from session

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required',
        },
        { status: 400 }
      )
    }

    // Check if user has relationship with this artist
    const userArtist = await prisma.userArtist.findUnique({
      where: {
        userId_artistId: {
          userId,
          artistId: id,
        },
      },
    })

    if (!userArtist) {
      return NextResponse.json(
        {
          success: false,
          error: 'You do not manage this artist',
        },
        { status: 404 }
      )
    }

    // Remove user-artist relationship
    await prisma.userArtist.delete({
      where: {
        userId_artistId: {
          userId,
          artistId: id,
        },
      },
    })

    // If no other users manage this artist and it was imported (not manually created),
    // we could optionally remove the artist entirely
    const remainingManagers = await prisma.userArtist.count({
      where: { artistId: id },
    })

    let artistRemoved = false
    if (remainingManagers === 0) {
      const artist = await prisma.artist.findUnique({
        where: { id },
        select: { metadata: true },
      })

      // Only remove if it was auto-imported from search (not manually created)
      if (artist?.metadata && artist.metadata.searchResult === true) {
        await prisma.artist.delete({
          where: { id },
        })
        artistRemoved = true
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Artist removed from your list',
      data: {
        artistRemoved,
        remainingManagers,
      },
    })
  } catch (error) {
    console.error('Error unclaiming artist:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove artist',
      },
      { status: 500 }
    )
  }
}