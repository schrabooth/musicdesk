import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@musicdesk/database'
import { QueueManager } from '@musicdesk/utils/queue'

/**
 * GET /api/admin/stats
 * Get platform-wide statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required',
        },
        { status: 403 }
      )
    }

    // Get comprehensive platform statistics
    const [
      userStats,
      artistStats,
      releaseStats,
      royaltyStats,
      platformStats,
      recentActivity,
      queueStats,
    ] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: true,
        where: { emailVerified: true },
      }).then(async (verified) => ({
        total: await prisma.user.count(),
        verified: verified._count,
        admins: await prisma.user.count({ where: { role: 'ADMIN' } }),
        thisMonth: await prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      })),

      // Artist statistics
      prisma.artist.aggregate({
        _count: true,
        where: { verified: true },
      }).then(async (verified) => ({
        total: await prisma.artist.count(),
        verified: verified._count,
        withSpotify: await prisma.artist.count({ where: { spotifyId: { not: null } } }),
        withAppleMusic: await prisma.artist.count({ where: { appleMusicId: { not: null } } }),
      })),

      // Release statistics
      prisma.release.groupBy({
        by: ['status'],
        _count: true,
      }).then(async (grouped) => ({
        byStatus: grouped.reduce((acc, item) => {
          acc[item.status] = item._count
          return acc
        }, {} as Record<string, number>),
        total: await prisma.release.count(),
        thisMonth: await prisma.release.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      })),

      // Royalty statistics
      prisma.royalty.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'UNCLAIMED' },
      }).then(async (unclaimed) => ({
        totalUnclaimed: unclaimed._sum.amount || 0,
        unclaimedCount: unclaimed._count,
        totalRoyalties: await prisma.royalty.count(),
        totalValue: await prisma.royalty.aggregate({ _sum: { amount: true } }),
      })),

      // Platform connection statistics
      prisma.platform.groupBy({
        by: ['type', 'status'],
        _count: true,
      }),

      // Recent activity
      Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.artist.findMany({
          select: {
            id: true,
            name: true,
            verified: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.release.findMany({
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            artist: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]).then(([users, artists, releases]) => ({ users, artists, releases })),

      // Queue statistics
      QueueManager.getQueueStats().catch(() => ({
        analytics: { waiting: 0, active: 0, completed: 0, failed: 0 },
        distribution: { waiting: 0, active: 0, completed: 0, failed: 0 },
        fileProcessing: { waiting: 0, active: 0, completed: 0, failed: 0 },
        email: { waiting: 0, active: 0, completed: 0, failed: 0 },
      })),
    ])

    const stats = {
      overview: {
        totalUsers: userStats.total,
        verifiedUsers: userStats.verified,
        totalArtists: artistStats.total,
        verifiedArtists: artistStats.verified,
        totalReleases: releaseStats.total,
        totalRoyalties: royaltyStats.totalRoyalties,
        unclaimedValue: royaltyStats.totalUnclaimed,
      },
      users: userStats,
      artists: artistStats,
      releases: releaseStats,
      royalties: royaltyStats,
      platforms: platformStats.reduce((acc, item) => {
        if (!acc[item.type]) acc[item.type] = {}
        acc[item.type][item.status] = item._count
        return acc
      }, {} as Record<string, Record<string, number>>),
      recentActivity,
      queues: queueStats,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    )
  }
}