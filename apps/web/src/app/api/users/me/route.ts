import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@musicdesk/database'

/**
 * GET /api/users/me
 * Get current user info with organizations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      include: {
        organizations: {
          include: {
            organization: true,
          },
        },
        artists: {
          include: {
            artist: {
              select: {
                id: true,
                name: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        organizations: user.organizations.map(org => ({
          id: org.organization.id,
          name: org.organization.name,
          role: org.role,
        })),
        managedArtists: user.artists.map(ua => ({
          ...ua.artist,
          userRole: ua.role,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user info',
      },
      { status: 500 }
    )
  }
}