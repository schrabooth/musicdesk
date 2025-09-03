'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ArtistCard from '@/components/dashboard/ArtistCard';

interface Artist {
  id: string;
  name: string;
  slug: string;
  verified: boolean;
  avatar?: string;
  genres: string[];
  spotifyId?: string;
  appleMusicId?: string;
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

  useEffect(() => {
    fetchArtists();
  }, []);

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
                placeholder="Search artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
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
            {!searchTerm && (
              <Link
                href="/dashboard/artists/new"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
                Add Your First Artist
              </Link>
            )}
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
