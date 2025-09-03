'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StreamsChart from '@/components/analytics/StreamsChart'
import MetricsGrid, { useMetricsData, fallbackMetrics } from '@/components/analytics/MetricsGrid'

export default function AnalyticsPage() {
  const { metrics, loading: metricsLoading } = useMetricsData()
  const [analyticsData, setAnalyticsData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // Get analytics for all artists
      const response = await fetch('/api/analytics/overview')
      const data = await response.json()
      
      if (data.success) {
        // Transform data for charts
        const chartData = []
        for (let i = 29; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          
          chartData.push({
            date: date.toISOString().split('T')[0],
            streams: Math.floor(Math.random() * 1000) + 500, // Simulated until real data
            source: 'TOTAL' as const
          })
        }
        setAnalyticsData(chartData)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
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
              <h1 className="text-lg font-medium text-gray-900">Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Overview Metrics */}
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

        {/* Streams Chart */}
        <div className="mb-8">
          <StreamsChart 
            data={analyticsData}
            timeframe="30d"
            showGrowth={true}
          />
        </div>

        {/* Top Performing Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Artists</h3>
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <p>Artist performance analytics will appear here</p>
                <p className="text-sm">Connect platform integrations to see real data</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="text-center py-8 text-gray-500">
                <p>Recent platform activity will appear here</p>
                <p className="text-sm">Real-time updates from connected platforms</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}