import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/artists/[id]/analytics
 * Fetch detailed analytics for a specific artist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const days = parseInt(searchParams.get('days') || '30')
    const source = searchParams.get('source') // Optional: SPOTIFY, APPLE_MUSIC, etc.
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify artist exists
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: { id: true, name: true },
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

    // Build date filter
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else {
      // Default to last N days
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      dateFilter.date = {
        gte: fromDate,
      }
    }

    // Build where clause
    const whereClause: any = {
      artistId: id,
      ...dateFilter,
    }

    if (source) {
      whereClause.source = source
    }

    // Fetch analytics data
    const [analytics, aggregated] = await Promise.all([
      // Time series data
      prisma.analytics.findMany({
        where: whereClause,
        orderBy: {
          date: 'asc',
        },
      }),
      
      // Aggregated totals
      prisma.analytics.groupBy({
        by: ['source'],
        where: whereClause,
        _sum: {
          streams: true,
          listeners: true,
          followers: true,
          saves: true,
        },
        _avg: {
          streams: true,
          listeners: true,
        },
        _count: true,
      }),
    ])

    // Calculate growth metrics
    const growthMetrics = await calculateGrowthMetrics(id, days)

    // Format response
    const response = {
      artist: {
        id: artist.id,
        name: artist.name,
      },
      period: {
        days,
        startDate: startDate || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: endDate || new Date().toISOString(),
      },
      timeSeries: analytics,
      aggregated: aggregated.reduce((acc, item) => {
        acc[item.source] = {
          totalStreams: item._sum.streams || 0,
          totalListeners: item._sum.listeners || 0,
          totalFollowers: item._sum.followers || 0,
          totalSaves: item._sum.saves || 0,
          avgStreams: Math.round(item._avg.streams || 0),
          avgListeners: Math.round(item._avg.listeners || 0),
          dataPoints: item._count,
        }
        return acc
      }, {} as Record<string, any>),
      growth: growthMetrics,
    }

    return NextResponse.json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error fetching artist analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artist analytics',
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate growth metrics comparing current period to previous period
 */
async function calculateGrowthMetrics(artistId: string, days: number) {
  try {
    const now = new Date()
    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - days * 24 * 60 * 60 * 1000)

    const [currentPeriod, previousPeriod] = await Promise.all([
      prisma.analytics.aggregate({
        where: {
          artistId,
          date: {
            gte: currentPeriodStart,
            lte: now,
          },
        },
        _sum: {
          streams: true,
          listeners: true,
          followers: true,
          saves: true,
        },
      }),
      prisma.analytics.aggregate({
        where: {
          artistId,
          date: {
            gte: previousPeriodStart,
            lt: currentPeriodStart,
          },
        },
        _sum: {
          streams: true,
          listeners: true,
          followers: true,
          saves: true,
        },
      }),
    ])

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return {
      streams: {
        current: currentPeriod._sum.streams || 0,
        previous: previousPeriod._sum.streams || 0,
        growth: calculateGrowth(
          currentPeriod._sum.streams || 0,
          previousPeriod._sum.streams || 0
        ),
      },
      listeners: {
        current: currentPeriod._sum.listeners || 0,
        previous: previousPeriod._sum.listeners || 0,
        growth: calculateGrowth(
          currentPeriod._sum.listeners || 0,
          previousPeriod._sum.listeners || 0
        ),
      },
      followers: {
        current: currentPeriod._sum.followers || 0,
        previous: previousPeriod._sum.followers || 0,
        growth: calculateGrowth(
          currentPeriod._sum.followers || 0,
          previousPeriod._sum.followers || 0
        ),
      },
      saves: {
        current: currentPeriod._sum.saves || 0,
        previous: previousPeriod._sum.saves || 0,
        growth: calculateGrowth(
          currentPeriod._sum.saves || 0,
          previousPeriod._sum.saves || 0
        ),
      },
    }
  } catch (error) {
    console.error('Error calculating growth metrics:', error)
    return null
  }
}