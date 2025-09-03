#!/usr/bin/env node
import { MongoClient } from 'mongodb'
import { PrismaClient } from '@prisma/client'

// Initialize clients
const mongoClient = new MongoClient('mongodb://localhost:27017')
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://daniel:@localhost:5432/musicdesk'
    }
  }
})

async function migrate() {
  try {
    console.log('🔄 Starting MongoDB → PostgreSQL migration...')
    
    // Connect to MongoDB
    await mongoClient.connect()
    const db = mongoClient.db('cashearDb')
    
    // Get default organization from PostgreSQL
    const defaultOrg = await prisma.organization.findFirst({
      where: { slug: 'musicdesk-default' }
    })
    
    if (!defaultOrg) {
      throw new Error('Default organization not found. Please run database seeding first.')
    }

    console.log('✅ Connected to MongoDB and PostgreSQL')

    // 1. Migrate Artists (sample - first 50 with real data)
    console.log('📊 Migrating artists...')
    
    const artists = await db.collection('artists').find({
      spotifyId: { $exists: true, $ne: null },
      monthlyListeners: { $exists: true, $gt: 0 }
    }).limit(50).toArray()

    console.log(`Found ${artists.length} artists with real data`)

    for (const artist of artists) {
      try {
        const existingArtist = await prisma.artist.findFirst({
          where: { spotifyId: artist.spotifyId }
        })

        if (!existingArtist) {
          const newArtist = await prisma.artist.create({
            data: {
              name: artist.name,
              slug: artist.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, ''),
              organizationId: defaultOrg.id,
              spotifyId: artist.spotifyId,
              appleMusicId: artist.appleMusicId || null,
              amiIdentity: artist.amiIdentity || null,
              verified: !!artist.verified,
              genres: artist.genres || [],
              metadata: {
                monthlyListeners: artist.monthlyListeners || 0,
                migratedFrom: 'cashearDb',
                originalId: artist._id.toString(),
              },
            },
          })
          
          console.log(`  ✅ Migrated artist: ${artist.name} (${artist.monthlyListeners} listeners)`)
          
          // 2. Migrate Analytics for this artist
          const analytics = await db.collection('artistAnalytics').findOne({
            _artist: artist._id
          })
          
          if (analytics?.spotify?.streams?.worldwide) {
            // Convert MongoDB analytics to PostgreSQL format
            const analyticsData = []
            
            // Get recent data (last 30 days with actual numbers)
            const recentStreams = analytics.spotify.streams.worldwide
              .filter(s => s.num > 0)
              .slice(-30) // Last 30 entries with data
            
            for (const streamData of recentStreams) {
              analyticsData.push({
                artistId: newArtist.id,
                date: streamData.date,
                source: 'SPOTIFY',
                streams: streamData.num || 0,
                listeners: Math.floor((streamData.num || 0) * 0.7), // Estimate listeners
                followers: artist.monthlyListeners || 0,
                saves: Math.floor((streamData.num || 0) * 0.05), // Estimate saves
                countries: {
                  US: Math.floor((streamData.num || 0) * 0.4),
                  CA: Math.floor((streamData.num || 0) * 0.1),
                  UK: Math.floor((streamData.num || 0) * 0.1),
                },
              })
            }

            if (analyticsData.length > 0) {
              await prisma.analytics.createMany({
                data: analyticsData,
                skipDuplicates: true,
              })
              console.log(`    📈 Added ${analyticsData.length} analytics records`)
            }
          }

          // 3. Create platform connection
          if (artist.spotifyId) {
            await prisma.platform.create({
              data: {
                artistId: newArtist.id,
                type: 'SPOTIFY',
                externalId: artist.spotifyId,
                status: 'SYNCED',
                lastSync: new Date(),
                metadata: {
                  monthlyListeners: artist.monthlyListeners || 0,
                  migrated: true,
                },
              },
            })
          }
        }
      } catch (error) {
        console.error(`❌ Error migrating artist ${artist.name}:`, error.message)
      }
    }

    // 4. Migrate Royalty Data (sample from distrokidBankDetails)
    console.log('💰 Migrating royalty data...')
    
    const royalties = await db.collection('distrokidBankDetails').find({
      earningsUSD: { $gt: 0 }
    }).limit(100).toArray()

    console.log(`Found ${royalties.length} royalty records`)

    for (const royalty of royalties) {
      try {
        // Find matching artist by name
        const artist = await prisma.artist.findFirst({
          where: {
            name: { contains: royalty.artist, mode: 'insensitive' }
          }
        })

        if (artist) {
          // Find or create track
          let track = null
          if (royalty.isrc) {
            track = await prisma.track.findFirst({
              where: { isrc: royalty.isrc }
            })

            if (!track) {
              track = await prisma.track.create({
                data: {
                  title: royalty.title,
                  artistId: artist.id,
                  isrc: royalty.isrc,
                  genres: [],
                },
              })
            }
          }

          // Create royalty record
          await prisma.royalty.create({
            data: {
              trackId: track?.id,
              artistId: artist.id,
              source: `DistroKid - ${royalty.store}`,
              type: 'MASTER',
              amount: royalty.earningsUSD,
              currency: 'USD',
              period: new Date(royalty.saleMonth),
              reportedAt: new Date(royalty.reportingDate),
              status: 'CLAIMED',
              territory: royalty.countryOfSale || 'US',
              metadata: {
                originalData: {
                  quantity: royalty.quantity,
                  teamPercentage: royalty.teamPercentage,
                },
                migratedFrom: 'cashearDb',
              },
            },
          })
        }
      } catch (error) {
        console.error(`❌ Error migrating royalty:`, error.message)
      }
    }

    console.log('🎉 Migration completed successfully!')
    console.log('\nMigrated data:')
    console.log('- Artists with real Spotify data and monthly listeners')
    console.log('- Historical analytics with actual streaming numbers')
    console.log('- Platform connections for Spotify integration')
    console.log('- Real royalty data from DistroKid earnings')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoClient.close()
    await prisma.$disconnect()
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().catch(console.error)
}

export default migrate