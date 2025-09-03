'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ArtistCard from '@/components/dashboard/ArtistCard';
import { useDebounce } from '@/hooks/useDebounce';

interface Artist {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  avatar?: string;
  bio?: string;
  genres: string[];
  spotifyId?: string;
  appleMusicId?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
  _count: {
    tracks: number;
    releases: number;
    royalties: number;
  };
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>(
    'all'
  );
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search term for Spotify API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchArtists();
  }, []);

  // Search Spotify when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      searchSpotifyArtists(debouncedSearchTerm);
    } else {
      setSpotifyResults([]);
    }
  }, [debouncedSearchTerm]);

  const searchSpotifyArtists = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/artists/search?q=${encodeURIComponent(query)}&platform=spotify&save=true&organizationId=cmf3gu8qq00019mmqdmnwhv7x`
      );
      const data = await response.json();

      if (data.success) {
        setSpotifyResults(data.data.results || []);
        
        // If artists were auto-saved, refresh the main artist list
        if (data.data.saved > 0) {
          fetchArtists();
        }
      } else {
        console.error('Spotify search failed:', data.error);
        setSpotifyResults([]);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSpotifyResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addSpotifyArtist = async (spotifyResult: any) => {
    try {
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: spotifyResult.name,
          organizationId: 'cmf3gu8qq00019mmqdmnwhv7x',
          spotifyId: spotifyResult.externalId,
          genres: spotifyResult.genres,
          verified: spotifyResult.verified,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setArtists((prev) => [...prev, data.data]);
        setSearchTerm(''); // Clear search after adding
        setSpotifyResults([]);
      }
    } catch (err) {
      console.error('Error adding artist:', err);
    }
  };

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists');
      const data = await response.json();

      if (data.success) {
        setArtists(data.data);
      } else {
        setError(data.error || 'Failed to fetch artists');
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError('Error connecting to API');
    } finally {
      setLoading(false);
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const matchesSearch = artist.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'verified' && artist.verified) ||
      (filter === 'unverified' && !artist.verified);

    return matchesSearch && matchesFilter;
  }) as Artist[];

  const verifiedCount = artists.filter((a) => a.verified).length;
  const totalStreams = artists.reduce(
    (sum, a) => sum + a._count.tracks * 1000,
    0
  ); // Simulated
  const totalRoyalties = artists.reduce(
    (sum, a) => sum + a._count.royalties,
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-2xl font-bold text-gray-900">
                🎵 MusicDesk
              </Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">Artists</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-purple-600 mr-3">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {artists.length}
                </div>
                <div className="text-sm text-gray-500">Total Artists</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-3">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {verifiedCount}
                </div>
                <div className="text-sm text-gray-500">Verified</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-3">🎵</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalStreams.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Streams</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-orange-600 mr-3">💰</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {totalRoyalties}
                </div>
                <div className="text-sm text-gray-500">Royalties</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search artists or type to find on Spotify..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500">
              <option value="all">All Artists</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified</option>
            </select>

            <Link
              href="/dashboard/artists/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
              Add Artist
            </Link>
          </div>
        </div>

        {/* Spotify Search Results */}
        {searchTerm.length >= 2 && spotifyResults.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-green-800">
                🎵 Found {spotifyResults.length} artists on Spotify for "{searchTerm}":
              </h3>
              <span className="text-xs text-green-600">High matches auto-saved</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {spotifyResults.slice(0, 6).map((result) => (
                <div key={result.externalId} className="flex items-center justify-between bg-white p-3 rounded border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden">
                      {result.image ? (
                        <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-sm font-bold">{result.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{result.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{result.followers.toLocaleString()} followers</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          result.confidence >= 0.9 ? 'bg-green-100 text-green-700' :
                          result.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {Math.round(result.confidence * 100)}% match
                        </span>
                      </div>
                      {result.genres.length > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          {result.genres.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs">
                    {result.confidence >= 0.7 ? (
                      <span className="text-green-600 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Saved
                      </span>
                    ) : (
                      <button 
                        onClick={() => addSpotifyArtist(result)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Add
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {spotifyResults.length > 6 && (
              <p className="text-xs text-green-600 mt-3 text-center">
                +{spotifyResults.length - 6} more results found (clear search to see saved artists)
              </p>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchArtists}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline">
              Retry
            </button>
          </div>
        )}

        {/* Artists Grid */}
        {filteredArtists.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="text-gray-400 text-6xl mb-4">🎤</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No artists found' : 'No artists yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? `No artists match "${searchTerm}"`
                : 'Get started by adding your first artist to the platform.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredArtists.map((artist: Artist) => (
              <ArtistCard
                key={artist.id}
                artist={{
                  id: artist.id,
                  name: artist.name,
                  slug: artist.slug,
                  verified: artist.verified,
                  avatar: artist.avatar || null,
                  genres: artist.genres,
                  spotifyId: artist.spotifyId || null,
                  appleMusicId: artist.appleMusicId || null,
                  _count: {
                    tracks: artist._count.tracks,
                    releases: artist._count.releases,
                    royalties: artist._count.royalties,
                  },
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
