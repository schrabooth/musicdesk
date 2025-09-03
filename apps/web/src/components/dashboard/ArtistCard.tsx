'use client'

import { Artist } from '@musicdesk/database'
import Image from 'next/image'
import Link from 'next/link'

interface ArtistCardProps {
  artist: Artist & {
    _count: {
      tracks: number
      releases: number
      royalties: number
    }
  }
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/dashboard/artists/${artist.id}`}
      className="block group hover:scale-[1.02] transition-transform duration-200"
    >
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
        {/* Artist Avatar */}
        <div className="aspect-square relative bg-gradient-to-br from-purple-400 to-pink-400">
          {artist.avatar ? (
            <Image
              src={artist.avatar}
              alt={artist.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-2xl font-bold">
                {artist.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Verified Badge */}
          {artist.verified && (
            <div className="absolute top-2 right-2">
              <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified
              </div>
            </div>
          )}
        </div>

        {/* Artist Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-purple-600 transition-colors">
            {artist.name}
          </h3>
          
          {/* Genres */}
          {artist.genres && artist.genres.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {artist.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                >
                  {genre}
                </span>
              ))}
              {artist.genres.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{artist.genres.length - 2} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {artist._count.tracks}
              </div>
              <div className="text-xs text-gray-500">Tracks</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {artist._count.releases}
              </div>
              <div className="text-xs text-gray-500">Releases</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">
                {artist._count.royalties}
              </div>
              <div className="text-xs text-gray-500">Royalties</div>
            </div>
          </div>

          {/* Platform Connections */}
          <div className="mt-3 flex gap-2 justify-center">
            {artist.spotifyId && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
            )}
            {artist.appleMusicId && (
              <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">A</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}