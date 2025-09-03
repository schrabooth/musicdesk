import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * POST /api/releases/[id]/distribute
 * Submit release for distribution
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { stores, provider = 'NUEMETA' } = body

    if (!stores || !Array.isArray(stores)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Target stores are required',
        },
        { status: 400 }
      )
    }

    // Get release details
    const release = await prisma.release.findUnique({
      where: { id },
      include: {
        tracks: true,
        artist: {
          select: {
            id: true,
            name: true,
            verified: true,
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

    // Validate release is ready for distribution
    if (release.status !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Release must be approved before distribution',
        },
        { status: 400 }
      )
    }

    if (!release.tracks || release.tracks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Release must have at least one track',
        },
        { status: 400 }
      )
    }

    // Validate all tracks have required fields
    const invalidTracks = release.tracks.filter(track => !track.audioUrl || !track.isrc)
    if (invalidTracks.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'All tracks must have audio files and ISRC codes',
        },
        { status: 400 }
      )
    }

    // Create distribution record and store entries in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create distribution record
      const distribution = await tx.distribution.create({
        data: {
          releaseId: id,
          provider,
          status: 'PENDING',
          submittedAt: new Date(),
          metadata: {
            requestedStores: stores,
            submittedBy: 'system', // In production, use authenticated user
          },
        },
      })

      // Create store entries
      const storeEntries = stores.map((store: string) => ({
        releaseId: id,
        store: store as any, // Type assertion for enum
        status: 'PENDING' as const,
      }))

      await tx.releaseStore.createMany({
        data: storeEntries,
      })

      // Update release status
      await tx.release.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
        },
      })

      return distribution
    })

    // In production, this would trigger background jobs for actual distribution
    // For now, simulate the process
    console.log('Distribution submitted:', {
      releaseId: id,
      distributionId: result.id,
      stores,
      provider,
    })

    // Simulate immediate processing (in production this would be async)
    setTimeout(async () => {
      try {
        await prisma.distribution.update({
          where: { id: result.id },
          data: {
            status: 'DISTRIBUTED',
            approvedAt: new Date(),
            metadata: {
              distributedAt: new Date().toISOString(),
              externalId: `EXT_${Date.now()}`,
            },
          },
        })

        // Update release status
        await prisma.release.update({
          where: { id },
          data: {
            status: 'DISTRIBUTED',
          },
        })
      } catch (error) {
        console.error('Error updating distribution status:', error)
      }
    }, 2000) // 2 second delay for demo

    return NextResponse.json({
      success: true,
      data: {
        distributionId: result.id,
        releaseId: id,
        provider,
        stores,
        status: 'SUBMITTED',
        submittedAt: result.submittedAt,
      },
      message: 'Release submitted for distribution',
    })
  } catch (error) {
    console.error('Error distributing release:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit release for distribution',
      },
      { status: 500 }
    )
  }
}