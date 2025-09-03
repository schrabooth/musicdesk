'use client'

import { useMemo } from 'react'

interface Metric {
  label: string
  value: number
  previousValue?: number
  format: 'number' | 'currency' | 'percentage'
  icon: string
  color: 'purple' | 'green' | 'blue' | 'orange'
}

interface MetricsGridProps {
  metrics: Metric[]
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const formatValue = (value: number, format: Metric['format']) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value)
      case 'percentage':
        return `${value.toFixed(1)}%`
      case 'number':
      default:
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`
        }
        return value.toLocaleString()
    }
  }

  const getColorClasses = (color: Metric['color']) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-500 text-purple-100'
      case 'green':
        return 'bg-green-500 text-green-100'
      case 'blue':
        return 'bg-blue-500 text-blue-100'
      case 'orange':
        return 'bg-orange-500 text-orange-100'
      default:
        return 'bg-gray-500 text-gray-100'
    }
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const change = metric.previousValue !== undefined 
          ? calculateChange(metric.value, metric.previousValue)
          : null

        return (
          <div
            key={index}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatValue(metric.value, metric.format)}
                </p>
                
                {change !== null && (
                  <div className={`flex items-center gap-1 mt-2 ${
                    change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <svg 
                      className={`w-4 h-4 ${change >= 0 ? 'rotate-0' : 'rotate-180'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">
                      {Math.abs(change).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <div className={`p-3 rounded-full ${getColorClasses(metric.color)}`}>
                <span className="text-xl">{metric.icon}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Example usage with common music industry metrics
export const defaultMusicMetrics: Metric[] = [
  {
    label: 'Total Streams',
    value: 1250000,
    previousValue: 980000,
    format: 'number',
    icon: '🎵',
    color: 'purple',
  },
  {
    label: 'Monthly Listeners',
    value: 45600,
    previousValue: 38200,
    format: 'number',
    icon: '👥',
    color: 'blue',
  },
  {
    label: 'Total Earnings',
    value: 4250.75,
    previousValue: 3890.20,
    format: 'currency',
    icon: '💰',
    color: 'green',
  },
  {
    label: 'Engagement Rate',
    value: 12.4,
    previousValue: 10.8,
    format: 'percentage',
    icon: '📈',
    color: 'orange',
  },
]