'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminStatsResponse } from '@/types/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || 'Failed to fetch stats')
      }
    } catch (err) {
      setError('Error connecting to admin API')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
          >
            Back to Dashboard
          </Link>
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
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">🎵 MusicDesk</Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">Admin Dashboard</h1>
            </div>
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-purple-600 mr-3">👥</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.overview.totalUsers || 0}
                </div>
                <div className="text-sm text-gray-500">Total Users</div>
                <div className="text-xs text-green-600">
                  {stats?.overview.verifiedUsers || 0} verified
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-3">🎤</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.overview.totalArtists || 0}
                </div>
                <div className="text-sm text-gray-500">Artists</div>
                <div className="text-xs text-green-600">
                  {stats?.overview.verifiedArtists || 0} verified
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-3">🚀</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats?.overview.totalReleases || 0}
                </div>
                <div className="text-sm text-gray-500">Releases</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-orange-600 mr-3">💰</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${stats?.overview.unclaimedValue?.toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-gray-500">Unclaimed Value</div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Connections</h3>
            <div className="space-y-3">
              {Object.entries(stats?.platforms || {}).map(([platform, statuses]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{platform}</span>
                  <div className="flex gap-2">
                    {Object.entries(statuses as Record<string, number>).map(([status, count]) => (
                      <span key={status} className={`px-2 py-1 rounded-full text-xs ${
                        status === 'SYNCED' ? 'bg-green-100 text-green-800' :
                        status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
            <div className="space-y-3">
              {Object.entries(stats?.queues || {}).map(([queue, queueStats]) => (
                <div key={queue} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700 capitalize">{queue}</span>
                  <div className="flex gap-2 text-xs">
                    <span className="text-yellow-600">{queueStats.waiting} waiting</span>
                    <span className="text-blue-600">{queueStats.active} active</span>
                    <span className="text-green-600">{queueStats.completed} done</span>
                    {queueStats.failed > 0 && (
                      <span className="text-red-600">{queueStats.failed} failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
            <div className="space-y-3">
              {stats?.recentActivity.users.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-bold">
                      {user.name?.[0] || user.email[0]}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Artists</h3>
            <div className="space-y-3">
              {stats?.recentActivity.artists.map((artist) => (
                <div key={artist.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">{artist.name[0]}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      {artist.name}
                      {artist.verified && (
                        <span className="text-blue-500 text-xs">✓</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(artist.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Releases</h3>
            <div className="space-y-3">
              {stats?.recentActivity.releases.map((release) => (
                <div key={release.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">🎵</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{release.title}</div>
                    <div className="text-xs text-gray-500">
                      by {release.artist.name} • {release.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}