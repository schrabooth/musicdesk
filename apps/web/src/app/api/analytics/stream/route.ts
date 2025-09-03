import { NextRequest } from 'next/server'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/analytics/stream
 * Server-Sent Events endpoint for real-time analytics updates
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const artistId = searchParams.get('artistId')

  if (!artistId) {
    return new Response('Artist ID is required', { status: 400 })
  }

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', artistId })}\n\n`)
      )

      // Set up interval to send periodic updates
      const intervalId = setInterval(async () => {
        try {
          // Fetch latest analytics data
          const analytics = await prisma.analytics.findMany({
            where: { artistId },
            orderBy: { date: 'desc' },
            take: 1,
          })

          if (analytics.length > 0) {
            const data = {
              type: 'analytics_update',
              data: analytics[0],
              timestamp: new Date().toISOString(),
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            )
          }

          // Send heartbeat every 30 seconds
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`)
          )
        } catch (error) {
          console.error('SSE Error:', error)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Failed to fetch analytics' })}\n\n`)
          )
        }
      }, 30000) // Update every 30 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(intervalId)
        try {
          controller.close()
        } catch (e) {
          // Controller might already be closed
        }
      }

      // Handle client disconnect
      request.signal.addEventListener('abort', cleanup)

      // Store cleanup function for potential later use
      ;(controller as any).cleanup = cleanup
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

/**
 * POST /api/analytics/stream
 * Trigger analytics update for specific artist
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, type, data } = body

    if (!artistId || !type) {
      return Response.json(
        { success: false, error: 'Artist ID and type are required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would trigger background jobs
    // to sync data from platforms and update the database
    
    // For now, simulate an analytics update
    if (type === 'sync_platforms') {
      // Get connected platforms for this artist
      const platforms = await prisma.platform.findMany({
        where: {
          artistId,
          status: 'SYNCED',
        },
      })

      // Simulate data sync (in production, this would trigger background jobs)
      for (const platform of platforms) {
        // Create a simulated analytics entry
        await prisma.analytics.create({
          data: {
            artistId,
            date: new Date(),
            source: platform.type,
            streams: Math.floor(Math.random() * 1000) + 100,
            listeners: Math.floor(Math.random() * 500) + 50,
            followers: Math.floor(Math.random() * 100) + 10,
            saves: Math.floor(Math.random() * 50) + 5,
            countries: {
              US: Math.floor(Math.random() * 100),
              CA: Math.floor(Math.random() * 50),
              UK: Math.floor(Math.random() * 30),
            },
          },
        })
      }

      return Response.json({
        success: true,
        message: 'Analytics sync triggered',
        platformsUpdated: platforms.length,
      })
    }

    return Response.json({
      success: false,
      error: 'Unknown sync type',
    }, { status: 400 })
  } catch (error) {
    console.error('Error triggering analytics sync:', error)
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}