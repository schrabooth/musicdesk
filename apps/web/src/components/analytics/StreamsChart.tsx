'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface StreamsChartProps {
  data: Array<{
    date: string
    streams: number
    source: 'SPOTIFY' | 'APPLE_MUSIC' | 'TOTAL'
  }>
  timeframe: '7d' | '30d' | '90d' | '1y'
  showGrowth?: boolean
}

export default function StreamsChart({ data, timeframe, showGrowth = true }: StreamsChartProps) {
  const chartData = useMemo(() => {
    // Group data by date and calculate totals
    const grouped = data.reduce((acc, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { date: item.date, spotify: 0, appleMusic: 0, total: 0 }
      }
      
      if (item.source === 'SPOTIFY') {
        acc[item.date].spotify = item.streams
      } else if (item.source === 'APPLE_MUSIC') {
        acc[item.date].appleMusic = item.streams
      }
      
      acc[item.date].total = acc[item.date].spotify + acc[item.date].appleMusic
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [data])

  const growth = useMemo(() => {
    if (!showGrowth || chartData.length < 2) return null
    
    const latest = chartData[chartData.length - 1]?.total || 0
    const previous = chartData[chartData.length - 2]?.total || 0
    const change = latest - previous
    const percentage = previous > 0 ? ((change / previous) * 100) : 0
    
    return {
      change,
      percentage,
      isPositive: change >= 0,
    }
  }, [chartData, showGrowth])

  const formatXAxisTick = (value: string) => {
    const date = new Date(value)
    if (timeframe === '7d') {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else if (timeframe === '30d') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short' })
    }
  }

  const formatTooltipValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString()
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Streams Over Time</h3>
          <p className="text-sm text-gray-500">Track your streaming performance across platforms</p>
        </div>
        
        {growth && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            growth.isPositive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <span className="text-sm font-medium">
              {growth.isPositive ? '+' : ''}{growth.change.toLocaleString()} 
              ({growth.percentage.toFixed(1)}%)
            </span>
            <svg 
              className={`w-4 h-4 ${growth.isPositive ? 'rotate-0' : 'rotate-180'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisTick}
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis 
              tickFormatter={formatTooltipValue}
              stroke="#6b7280"
              fontSize={12}
            />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: number, name: string) => [
                formatTooltipValue(value),
                name === 'spotify' ? 'Spotify' : 
                name === 'appleMusic' ? 'Apple Music' : 'Total'
              ]}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            
            <Line
              type="monotone"
              dataKey="total"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="spotify"
              stroke="#1db954"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="appleMusic"
              stroke="#000000"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-gray-600">Total Streams</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-gray-600">Spotify</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-black" style={{ borderStyle: 'dashed' }}></div>
          <span className="text-gray-600">Apple Music</span>
        </div>
      </div>
    </div>
  )
}