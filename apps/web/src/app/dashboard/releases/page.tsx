'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Release } from '@/types/artist'

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReleases()
  }, [])

  const fetchReleases = async () => {
    try {
      const response = await fetch('/api/releases')
      const data = await response.json()
      
      if (data.success) {
        setReleases(data.data)
      }
    } catch (err) {
      console.error('Error fetching releases:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE': return 'bg-green-100 text-green-800'
      case 'DISTRIBUTED': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-purple-100 text-purple-800'
      case 'SUBMITTED': return 'bg-yellow-100 text-yellow-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">🎵 MusicDesk</Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">Releases</h1>
            </div>
            <Link
              href="/dashboard/releases/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
            >
              Create Release
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : releases.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="text-6xl mb-4">🎼</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No releases yet</h3>
            <p className="text-gray-500 mb-6">Upload your first track to get started with distribution.</p>
            <Link
              href="/dashboard/releases/new"
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
            >
              Create Your First Release
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {releases.map((release) => (
              <div key={release.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  {release.coverArt ? (
                    <img src={release.coverArt} alt={release.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-4xl">🎵</span>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate">{release.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(release.status)}`}>
                      {release.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{release.releaseType}</p>
                  
                  {release.releaseDate && (
                    <p className="text-xs text-gray-500 mb-3">
                      Released: {new Date(release.releaseDate).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <Link
                      href={`/dashboard/releases/${release.id}`}
                      className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                    
                    {release.status === 'DRAFT' && (
                      <Link
                        href={`/dashboard/releases/${release.id}/edit`}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}