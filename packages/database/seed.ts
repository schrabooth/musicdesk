import { prisma } from './client'
import bcrypt from 'bcryptjs'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Create default admin user
    const adminEmail = 'admin@musicdesk.dev'
    const adminPassword = await bcrypt.hash('admin123!', 12)

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: 'Admin User',
        password: adminPassword,
        role: 'ADMIN',
        emailVerified: true,
      },
    })

    console.log('✅ Admin user created:', adminUser.email)

    // Create default organization
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'musicdesk-default' },
      update: {},
      create: {
        name: 'MusicDesk Default Organization',
        slug: 'musicdesk-default',
        plan: 'ENTERPRISE',
        members: {
          create: {
            userId: adminUser.id,
            role: 'OWNER',
          },
        },
      },
    })

    console.log('✅ Default organization created:', defaultOrg.name)

    // Create sample artist
    const sampleArtist = await prisma.artist.upsert({
      where: { slug: 'sample-artist' },
      update: {},
      create: {
        name: 'Sample Artist',
        slug: 'sample-artist',
        bio: 'A demo artist for testing the platform',
        verified: true,
        organizationId: defaultOrg.id,
        genres: ['Pop', 'Electronic'],
        socialLinks: {
          website: 'https://example.com',
          spotify: 'https://spotify.com/artist/sample',
          instagram: 'https://instagram.com/sampleartist',
        },
        users: {
          create: {
            userId: adminUser.id,
            role: 'OWNER',
          },
        },
      },
    })

    console.log('✅ Sample artist created:', sampleArtist.name)

    // Create sample track
    const sampleTrack = await prisma.track.upsert({
      where: { isrc: 'USRC12300001' },
      update: {},
      create: {
        title: 'Demo Track',
        artistId: sampleArtist.id,
        isrc: 'USRC12300001',
        duration: 180000, // 3 minutes
        trackNumber: 1,
        genres: ['Pop'],
      },
    })

    console.log('✅ Sample track created:', sampleTrack.title)

    // Create sample release
    const sampleRelease = await prisma.release.upsert({
      where: { upc: '123456789012' },
      update: {},
      create: {
        title: 'Demo Release',
        artistId: sampleArtist.id,
        upc: '123456789012',
        releaseType: 'SINGLE',
        status: 'LIVE',
        releaseDate: new Date(),
        genre: 'Pop',
        label: 'Independent',
        copyright: '2024 Sample Artist',
      },
    })

    // Link track to release
    await prisma.track.update({
      where: { id: sampleTrack.id },
      data: { releaseId: sampleRelease.id },
    })

    console.log('✅ Sample release created:', sampleRelease.title)

    // Create sample analytics data
    const analyticsData = []
    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Spotify analytics
      analyticsData.push({
        artistId: sampleArtist.id,
        date,
        source: 'SPOTIFY' as const,
        streams: Math.floor(Math.random() * 1000) + 500,
        listeners: Math.floor(Math.random() * 500) + 250,
        followers: Math.floor(Math.random() * 100) + 1000,
        saves: Math.floor(Math.random() * 50) + 25,
        countries: {
          US: Math.floor(Math.random() * 100),
          CA: Math.floor(Math.random() * 50),
          UK: Math.floor(Math.random() * 30),
        },
      })

      // Apple Music analytics
      analyticsData.push({
        artistId: sampleArtist.id,
        date,
        source: 'APPLE_MUSIC' as const,
        streams: Math.floor(Math.random() * 600) + 300,
        listeners: Math.floor(Math.random() * 300) + 150,
        followers: Math.floor(Math.random() * 80) + 500,
        saves: Math.floor(Math.random() * 30) + 15,
        countries: {
          US: Math.floor(Math.random() * 80),
          CA: Math.floor(Math.random() * 40),
          UK: Math.floor(Math.random() * 25),
        },
      })
    }

    await prisma.analytics.createMany({
      data: analyticsData,
      skipDuplicates: true,
    })

    console.log('✅ Sample analytics data created')

    // Create sample royalties
    const royaltiesData = []
    for (let i = 0; i < 10; i++) {
      const period = new Date()
      period.setMonth(period.getMonth() - i)

      royaltiesData.push({
        trackId: sampleTrack.id,
        artistId: sampleArtist.id,
        source: 'Spotify Mechanical',
        type: 'MECHANICAL' as const,
        amount: Math.random() * 50 + 10,
        currency: 'USD',
        period,
        reportedAt: new Date(),
        status: Math.random() > 0.3 ? 'CLAIMED' : 'UNCLAIMED',
        territory: 'US',
      })
    }

    await prisma.royalty.createMany({
      data: royaltiesData,
    })

    console.log('✅ Sample royalties created')

    // Create platform connections
    await prisma.platform.createMany({
      data: [
        {
          artistId: sampleArtist.id,
          type: 'SPOTIFY',
          externalId: 'spotify_artist_123',
          status: 'SYNCED',
          lastSync: new Date(),
          metadata: {
            monthlyListeners: 15000,
            followers: 2500,
          },
        },
        {
          artistId: sampleArtist.id,
          type: 'APPLE_MUSIC',
          externalId: 'ami:identity:456789',
          status: 'SYNCED',
          lastSync: new Date(),
          metadata: {
            shazams: 1200,
          },
        },
      ],
      skipDuplicates: true,
    })

    console.log('✅ Sample platform connections created')

    console.log('🎉 Database seeding completed successfully!')
    console.log('\nLogin credentials:')
    console.log('Email:', adminEmail)
    console.log('Password: admin123!')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

// Run the seed function
if (require.main === module) {
  seed()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}

export default seed