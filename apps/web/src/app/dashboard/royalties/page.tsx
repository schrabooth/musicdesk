'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Royalty {
  id: string
  amount: number
  source: string
  type: string
  period: string
  status: string
  territory?: string
  track?: {
    title: string
    isrc?: string
  }
  artist?: {
    name: string
  }
}

export default function RoyaltiesPage() {
  const [royalties, setRoyalties] = useState<Royalty[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unclaimed' | 'claimed'>('all')

  useEffect(() => {
    fetchRoyalties()
  }, [])

  const fetchRoyalties = async () => {
    try {
      // For now, fetch all royalties - in production, this would be user-specific
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      
      if (data.success) {
        // Transform the data to show royalties
        setRoyalties([]) // Will be populated when we have real royalty endpoints
      }
    } catch (err) {
      console.error('Error fetching royalties:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredRoyalties = royalties.filter(royalty => {
    if (filter === 'unclaimed') return royalty.status === 'UNCLAIMED'
    if (filter === 'claimed') return ['CLAIMED', 'PAID'].includes(royalty.status)
    return true
  })

  const totalUnclaimed = royalties
    .filter(r => r.status === 'UNCLAIMED')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900">🎵 MusicDesk</Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">Royalties</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-orange-600 mr-3">💰</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${totalUnclaimed.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Unclaimed Royalties</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-green-600 mr-3">✅</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {royalties.filter(r => ['CLAIMED', 'PAID'].includes(r.status)).length}
                </div>
                <div className="text-sm text-gray-500">Claims Processed</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className="text-2xl text-blue-600 mr-3">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{royalties.length}</div>
                <div className="text-sm text-gray-500">Total Records</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-4 mb-6">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Royalties</option>
            <option value="unclaimed">Unclaimed Only</option>
            <option value="claimed">Claimed Only</option>
          </select>
        </div>

        {/* Royalties List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredRoyalties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No royalties found</h3>
            <p className="text-gray-500 mb-6">
              Connect your streaming platforms to discover unclaimed royalties automatically.
            </p>
            <Link
              href="/dashboard/artists"
              className="bg-purple-600 text-white px-6 py-3 rounded-md hover:bg-purple-700"
            >
              Connect Platforms
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Royalty Records ({filteredRoyalties.length})
              </h3>
              
              <div className="space-y-3">
                {filteredRoyalties.map((royalty) => (
                  <div key={royalty.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium text-gray-900">
                          ${royalty.amount.toFixed(2)}
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          royalty.status === 'UNCLAIMED' 
                            ? 'bg-orange-100 text-orange-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {royalty.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {royalty.source} • {royalty.type}
                        {royalty.track && ` • ${royalty.track.title}`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Period: {new Date(royalty.period).toLocaleDateString()}
                        {royalty.territory && ` • ${royalty.territory}`}
                      </div>
                    </div>
                    
                    {royalty.status === 'UNCLAIMED' && (
                      <button className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">
                        Claim Now
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}