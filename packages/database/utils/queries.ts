import { prisma } from '../client'
import { Prisma, User, Artist, PlatformType } from '@prisma/client'

/**
 * Database utility functions for common queries
 */

export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { success: true, message: 'Database connection successful' }
  } catch (error) {
    return { success: false, message: `Database connection failed: ${error}` }
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
    include: {
      artists: {
        include: {
          artist: true
        }
      },
      organizations: {
        include: {
          organization: true
        }
      }
    }
  })
}

export async function findArtistBySpotifyId(spotifyId: string): Promise<Artist | null> {
  return prisma.artist.findUnique({
    where: { spotifyId },
    include: {
      platforms: true,
      analytics: true,
      royalties: true
    }
  })
}

export async function getArtistAnalytics(artistId: string) {
  return prisma.analytics.findMany({
    where: { artistId },
    orderBy: { date: 'desc' },
    take: 30 // Last 30 days
  })
}

export async function createOrUpdateArtist(data: {
  name: string
  organizationId: string
  spotifyId?: string
  appleMusicId?: string
  amiIdentity?: string
  genres?: string[]
  verified?: boolean
}) {
  const slug = data.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return prisma.artist.upsert({
    where: { 
      spotifyId: data.spotifyId || '',
    },
    update: {
      name: data.name,
      genres: data.genres || [],
      verified: data.verified || false,
      appleMusicId: data.appleMusicId,
      amiIdentity: data.amiIdentity,
    },
    create: {
      name: data.name,
      slug,
      organizationId: data.organizationId,
      spotifyId: data.spotifyId,
      appleMusicId: data.appleMusicId,
      amiIdentity: data.amiIdentity,
      genres: data.genres || [],
      verified: data.verified || false,
    }
  })
}

export async function getUnclaimedRoyalties(artistId: string) {
  return prisma.royalty.findMany({
    where: {
      artistId,
      status: 'UNCLAIMED'
    },
    include: {
      track: true
    },
    orderBy: { amount: 'desc' }
  })
}

export async function connectPlatformToArtist(
  artistId: string, 
  type: PlatformType, 
  externalId: string,
  credentials?: string
) {
  return prisma.platform.upsert({
    where: {
      type_externalId: {
        type,
        externalId
      }
    },
    update: {
      credentials,
      status: 'SYNCED',
      lastSync: new Date()
    },
    create: {
      artistId,
      type,
      externalId,
      credentials,
      status: 'PENDING'
    }
  })
}

// Common query selections
export const userSelect = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  role: true,
  createdAt: true,
} satisfies Prisma.UserSelect

export const artistSelect = {
  id: true,
  name: true,
  slug: true,
  bio: true,
  avatar: true,
  verified: true,
  genres: true,
  socialLinks: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ArtistSelect

export const trackSelect = {
  id: true,
  title: true,
  isrc: true,
  duration: true,
  trackNumber: true,
  explicit: true,
  genres: true,
  audioUrl: true,
  waveformUrl: true,
  createdAt: true,
} satisfies Prisma.TrackSelect

export const releaseSelect = {
  id: true,
  title: true,
  upc: true,
  releaseType: true,
  releaseDate: true,
  status: true,
  coverArt: true,
  label: true,
  copyright: true,
  genre: true,
  createdAt: true,
} satisfies Prisma.ReleaseSelect

// Common query filters
export const activeArtistWhere = {
  verified: true,
} satisfies Prisma.ArtistWhereInput

export const liveReleaseWhere = {
  status: 'LIVE',
} satisfies Prisma.ReleaseWhereInput

export const unclaimedRoyaltiesWhere = {
  status: 'UNCLAIMED',
} satisfies Prisma.RoyaltyWhereInput

// Complex queries
export const artistWithStats = {
  include: {
    tracks: {
      select: {
        id: true,
        title: true,
        isrc: true,
      },
    },
    releases: {
      select: {
        id: true,
        title: true,
        status: true,
      },
    },
    _count: {
      select: {
        tracks: true,
        releases: true,
        royalties: true,
      },
    },
  },
} satisfies Prisma.ArtistFindManyArgs

export const releaseWithTracks = {
  include: {
    tracks: {
      orderBy: {
        trackNumber: 'asc',
      },
    },
    artist: {
      select: artistSelect,
    },
    distribution: true,
    stores: true,
  },
} satisfies Prisma.ReleaseFindManyArgs