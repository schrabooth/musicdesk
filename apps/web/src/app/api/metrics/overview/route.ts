import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/metrics/overview
 * Get platform-wide metrics for dashboard overview
 */
export async function GET(request: NextRequest) {
  try {
    // Get current and previous month dates
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Fetch analytics data for current and previous periods
    const [currentPeriod, previousPeriod, royaltiesData, artistCount] = await Promise.all([
      // Current month analytics
      prisma.analytics.aggregate({
        where: {
          date: {
            gte: currentMonthStart,
          },
        },
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
      }),

      // Previous month analytics for comparison
      prisma.analytics.aggregate({
        where: {
          date: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
        _sum: {
          streams: true,
          listeners: true,
          followers: true,
          saves: true,
        },
      }),

      // Royalty data
      prisma.royalty.aggregate({
        _sum: { amount: true },
        _count: true,
        where: {
          status: 'UNCLAIMED',
        },
      }),

      // Artist count
      prisma.artist.count(),
    ])

    // Calculate engagement rate (saves / streams * 100)
    const currentStreams = currentPeriod._sum.streams || 0
    const currentSaves = currentPeriod._sum.saves || 0
    const engagementRate = currentStreams > 0 ? (currentSaves / currentStreams) * 100 : 0

    const previousStreams = previousPeriod._sum.streams || 0
    const previousSaves = previousPeriod._sum.saves || 0
    const previousEngagementRate = previousStreams > 0 ? (previousSaves / previousStreams) * 100 : 0

    // Calculate total earnings from claimed royalties
    const totalEarnings = await prisma.royalty.aggregate({
      _sum: { amount: true },
      where: {
        status: {
          in: ['CLAIMED', 'PAID'],
        },
      },
    })

    // Previous month earnings for comparison
    const previousEarnings = await prisma.royalty.aggregate({
      _sum: { amount: true },
      where: {
        status: {
          in: ['CLAIMED', 'PAID'],
        },
        period: {
          gte: previousMonthStart,
          lte: previousMonthEnd,
        },
      },
    })

    const metrics = [
      {
        label: 'Total Streams',
        value: currentPeriod._sum.streams || 0,
        previousValue: previousPeriod._sum.streams || 0,
        format: 'number' as const,
        icon: '🎵',
        color: 'purple' as const,
      },
      {
        label: 'Monthly Listeners',
        value: currentPeriod._sum.listeners || 0,
        previousValue: previousPeriod._sum.listeners || 0,
        format: 'number' as const,
        icon: '👥',
        color: 'blue' as const,
      },
      {
        label: 'Total Earnings',
        value: Number(totalEarnings._sum.amount || 0),
        previousValue: Number(previousEarnings._sum.amount || 0),
        format: 'currency' as const,
        icon: '💰',
        color: 'green' as const,
      },
      {
        label: 'Engagement Rate',
        value: engagementRate,
        previousValue: previousEngagementRate,
        format: 'percentage' as const,
        icon: '📈',
        color: 'orange' as const,
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        summary: {
          totalArtists: artistCount,
          totalStreams: currentPeriod._sum.streams || 0,
          totalListeners: currentPeriod._sum.listeners || 0,
          totalEarnings: Number(totalEarnings._sum.amount || 0),
          unclaimedRoyalties: Number(royaltiesData._sum.amount || 0),
          unclaimedCount: royaltiesData._count || 0,
        },
        period: {
          current: {
            start: currentMonthStart.toISOString(),
            end: now.toISOString(),
          },
          previous: {
            start: previousMonthStart.toISOString(),
            end: previousMonthEnd.toISOString(),
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching overview metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch metrics',
      },
      { status: 500 }
    )
  }
}