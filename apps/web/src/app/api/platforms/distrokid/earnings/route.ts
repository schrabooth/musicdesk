import { NextRequest, NextResponse } from 'next/server'
import { DistroKidIntegration } from '@musicdesk/integrations/distrokid'
import { prisma } from '@musicdesk/database'

/**
 * POST /api/platforms/distrokid/earnings
 * Download and process DistroKid earnings data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId } = body

    if (!artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist ID is required',
        },
        { status: 400 }
      )
    }

    // Get DistroKid platform connection
    const platform = await prisma.platform.findFirst({
      where: {
        artistId,
        type: 'DISTROKID',
        status: 'SYNCED',
      },
    })

    if (!platform || !platform.credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'DistroKid not connected or credentials missing',
        },
        { status: 404 }
      )
    }

    const credentials = JSON.parse(platform.credentials)
    
    // Create integration instance
    const distroKid = new DistroKidIntegration({
      email: credentials.email,
      password: '', // Not needed for authenticated requests
    })

    // Download bank details
    const royalties = await distroKid.downloadBankDetails({
      success: true,
      cookies: credentials.cookies,
    })

    // Store royalties in database
    for (const royalty of royalties) {
      // Find or create track
      let track = await prisma.track.findFirst({
        where: {
          isrc: royalty.isrc,
          artistId,
        },
      })

      if (!track && royalty.isrc) {
        track = await prisma.track.create({
          data: {
            title: royalty.title,
            artistId,
            isrc: royalty.isrc,
            genres: [],
          },
        })
      }

      // Create royalty record
      await prisma.royalty.create({
        data: {
          trackId: track?.id,
          artistId,
          source: `DistroKid - ${royalty.source}`,
          type: 'MASTER', // DistroKid typically handles master recordings
          amount: royalty.amount,
          currency: royalty.currency,
          period: new Date(royalty.period),
          reportedAt: new Date(),
          status: 'CLAIMED', // DistroKid royalties are already claimed
          territory: royalty.territory,
          metadata: {
            originalData: royalty,
          },
        },
      })
    }

    // Update platform last sync
    await prisma.platform.update({
      where: { id: platform.id },
      data: {
        lastSync: new Date(),
        status: 'SYNCED',
      },
    })

    await distroKid.cleanup()

    return NextResponse.json({
      success: true,
      data: {
        royaltiesCount: royalties.length,
        totalAmount: royalties.reduce((sum, r) => sum + r.amount, 0),
        lastSync: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error downloading DistroKid earnings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to download earnings data',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/platforms/distrokid/earnings
 * Get processed DistroKid earnings for an artist
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!artistId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Artist ID is required',
        },
        { status: 400 }
      )
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.period = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get DistroKid royalties
    const royalties = await prisma.royalty.findMany({
      where: {
        artistId,
        source: {
          startsWith: 'DistroKid',
        },
        ...dateFilter,
      },
      include: {
        track: {
          select: {
            id: true,
            title: true,
            isrc: true,
          },
        },
      },
      orderBy: {
        period: 'desc',
      },
    })

    // Calculate summary statistics
    const summary = {
      totalEarnings: royalties.reduce((sum, r) => sum + Number(r.amount), 0),
      totalRoyalties: royalties.length,
      avgPerRoyalty: royalties.length > 0 
        ? royalties.reduce((sum, r) => sum + Number(r.amount), 0) / royalties.length 
        : 0,
      topStores: {} as Record<string, number>,
      topTracks: {} as Record<string, number>,
    }

    // Calculate top stores and tracks
    royalties.forEach(royalty => {
      const store = royalty.source.replace('DistroKid - ', '')
      summary.topStores[store] = (summary.topStores[store] || 0) + Number(royalty.amount)
      
      if (royalty.track) {
        const trackKey = `${royalty.track.title} (${royalty.track.isrc})`
        summary.topTracks[trackKey] = (summary.topTracks[trackKey] || 0) + Number(royalty.amount)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        royalties,
        summary,
        period: {
          startDate: startDate || royalties[royalties.length - 1]?.period,
          endDate: endDate || royalties[0]?.period,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching DistroKid earnings:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch earnings data',
      },
      { status: 500 }
    )
  }
}