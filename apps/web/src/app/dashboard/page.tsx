'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import ArtistCard from '@/components/dashboard/ArtistCard'
import MetricsGrid, { useMetricsData, fallbackMetrics } from '@/components/analytics/MetricsGrid'

interface Artist {
  id: string
  name: string
  slug: string
  verified: boolean
  avatar?: string
  genres: string[]
  spotifyId?: string
  appleMusicId?: string
  _count: {
    tracks: number
    releases: number
    royalties: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Fetch real metrics data
  const { metrics, loading: metricsLoading } = useMetricsData()

  // Development mode - skip authentication for now
  // In production, uncomment authentication guards
  // if (status === 'loading') {
  //   return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
  //   </div>
  // }
  // if (status === 'unauthenticated') {
  //   window.location.href = '/auth/signin'
  //   return null
  // }

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/artists')
      const data = await response.json()
      
      if (data.success) {
        setArtists(data.data)
      } else {
        setError(data.error || 'Failed to fetch artists')
      }
    } catch (err) {
      setError('Error connecting to API')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your music dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">🎵 MusicDesk</h1>
              <nav className="flex gap-6">
                <Link href="/dashboard" className="text-purple-600 font-medium">
                  Dashboard
                </Link>
                <Link href="/dashboard/artists" className="text-gray-500 hover:text-gray-700">
                  Artists
                </Link>
                <Link href="/dashboard/releases" className="text-gray-500 hover:text-gray-700">
                  Releases
                </Link>
                <Link href="/dashboard/analytics" className="text-gray-500 hover:text-gray-700">
                  Analytics
                </Link>
                <Link href="/dashboard/royalties" className="text-gray-500 hover:text-gray-700">
                  Royalties
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session?.user?.name || session?.user?.email || 'Demo User'}
              </span>
              <Link
                href="/auth/signin"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {session?.user ? 'Account' : 'Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome to MusicDesk</h1>
            <p className="text-purple-100 mb-4">
              Manage your music career, track analytics, and claim your royalties - all in one place.
            </p>
            <div className="flex gap-4">
              <Link
                href="/dashboard/artists"
                className="bg-white text-purple-600 px-4 py-2 rounded-md font-medium hover:bg-purple-50 transition-colors"
              >
                Manage Artists
              </Link>
              <Link
                href="/dashboard/releases"
                className="border border-white text-white px-4 py-2 rounded-md font-medium hover:bg-white hover:text-purple-600 transition-colors"
              >
                Upload Music
              </Link>
            </div>
          </div>

          {/* Metrics Overview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
            {metricsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <MetricsGrid metrics={metrics.length > 0 ? metrics : fallbackMetrics} />
            )}
          </div>

          {/* Artists Section */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Artists</h2>
            <Link
              href="/dashboard/artists/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              Add Artist
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p className="text-red-800">{error}</p>
              <button
                onClick={fetchArtists}
                className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
              >
                Try again
              </button>
            </div>
          )}

          {artists.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-400 text-6xl mb-4">🎤</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artists yet</h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first artist to the platform.
              </p>
              <Link
                href="/dashboard/artists/new"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Add Your First Artist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-purple-600 text-2xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-gray-600 text-sm mb-4">
                Track your streaming performance across all platforms
              </p>
              <Link
                href="/dashboard/analytics"
                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                View Analytics →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-green-600 text-2xl mb-3">💰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Royalties</h3>
              <p className="text-gray-600 text-sm mb-4">
                Discover and claim your unclaimed royalties
              </p>
              <Link
                href="/dashboard/royalties"
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Find Royalties →
              </Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-blue-600 text-2xl mb-3">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-2">Distribution</h3>
              <p className="text-gray-600 text-sm mb-4">
                Release your music to 150+ streaming platforms
              </p>
              <Link
                href="/dashboard/releases"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Upload Music →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}