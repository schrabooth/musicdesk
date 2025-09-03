import { NextRequest, NextResponse } from 'next/server';
import { IntegrationFactory } from '@musicdesk/integrations';
import { prisma } from '@musicdesk/database';

/**
 * GET /api/artists/search
 * Search for artists across platforms and optionally save to database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const platform = searchParams.get('platform'); // 'spotify', 'apple', 'all'
    const saveResults = searchParams.get('save') === 'true';
    const organizationId = searchParams.get('organizationId'); // Required if saving

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Search query must be at least 2 characters',
        },
        { status: 400 }
      );
    }

    const results: any[] = [];

    // Search Spotify if requested or platform is 'all'
    if (!platform || platform === 'spotify' || platform === 'all') {
      try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

        if (clientId && clientSecret) {
          const spotify = IntegrationFactory.createSpotify(
            clientId,
            clientSecret
          );
          const spotifyArtists = await spotify.searchArtists(query, {
            success: true,
          });

          for (const artist of spotifyArtists) {
            results.push({
              platform: 'SPOTIFY',
              externalId: artist.id,
              name: artist.name,
              image: artist.image,
              genres: artist.genres || [],
              followers: artist.followers || 0,
              verified: artist.verified || false,
              externalUrls: artist.externalUrls,
              confidence: calculateMatchConfidence(query, artist.name),
            });
          }
        }
      } catch (error) {
        console.error('Spotify search error:', error);
      }
    }

    // Future: Add Apple Music search when API is available
    // Future: Add other platform searches

    // Sort by confidence score and relevance
    results.sort((a, b) => {
      // Higher confidence first
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      // Then by follower count
      return (b.followers || 0) - (a.followers || 0);
    });

    console.log('results', results);

    // If saveResults is true, save matching artists to database
    const savedArtists: any[] = [];
    if (saveResults && organizationId) {
      for (const result of results) {
        // Only save high-confidence matches to avoid spam
        if (result.confidence >= 0.7) {
          try {
            const existingArtist = await prisma.artist.findFirst({
              where: {
                spotifyId: result.externalId,
              },
            });

            if (!existingArtist) {
              const savedArtist = await prisma.artist.create({
                data: {
                  name: result.name,
                  slug: result.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, ''),
                  organizationId,
                  avatar: result.image, // Save Spotify image
                  spotifyId:
                    result.platform === 'SPOTIFY'
                      ? result.externalId
                      : undefined,
                  verified: result.verified,
                  genres: result.genres.slice(0, 5), // Limit genres
                  metadata: {
                    searchResult: true,
                    platform: result.platform,
                    confidence: result.confidence,
                    followers: result.followers,
                    importedAt: new Date().toISOString(),
                  },
                },
              });

              savedArtists.push(savedArtist);
            } else {
              // Update existing artist with new platform data if missing
              const updateData: any = {};
              if (result.platform === 'SPOTIFY' && !existingArtist.spotifyId) {
                updateData.spotifyId = result.externalId;
              }
              if (!existingArtist.avatar && result.image) {
                updateData.avatar = result.image; // Add missing avatar
              }
              if (Object.keys(updateData).length > 0) {
                await prisma.artist.update({
                  where: { id: existingArtist.id },
                  data: updateData,
                });
              }
            }
          } catch (error) {
            console.error('Error saving artist:', error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        query,
        results: results.slice(0, 20), // Limit to 20 results
        platforms: platform === 'all' ? ['SPOTIFY'] : [platform?.toUpperCase()],
        saved: savedArtists.length,
        total: results.length,
      },
    });
  } catch (error) {
    console.error('Error searching artists:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Search failed',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate match confidence between search query and artist name
 */
function calculateMatchConfidence(query: string, artistName: string): number {
  const queryLower = query.toLowerCase().trim();
  const nameLower = artistName.toLowerCase().trim();

  // Exact match
  if (queryLower === nameLower) {
    return 1.0;
  }

  // Starts with match
  if (nameLower.startsWith(queryLower)) {
    return 0.9;
  }

  // Contains match
  if (nameLower.includes(queryLower)) {
    return 0.8;
  }

  // Fuzzy match using simple string similarity
  const similarity = calculateStringSimilarity(queryLower, nameLower);
  return Math.max(0.1, similarity);
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;

  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[0][i] = i;
  for (let j = 0; j <= len2; j++) matrix[j][0] = j;

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len2][len1];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}
