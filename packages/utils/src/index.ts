// Utilities package entry point

export * from './queue'

// Common utility functions
export const formatCurrency = (amount: number, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString()
}

export const formatDuration = (milliseconds: number): string => {
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidISRC = (isrc: string): boolean => {
  // ISRC format: CCXXXYYNNNNN (Country-Registrant-Year-Number)
  const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/
  return isrcRegex.test(isrc)
}

export const isValidUPC = (upc: string): boolean => {
  // UPC format: 12-digit number
  const upcRegex = /^[0-9]{12}$/
  return upcRegex.test(upc)
}

// Date utilities
export const getDateRange = (days: number) => {
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// Platform utilities
export const getPlatformColor = (platform: string): string => {
  const colors: Record<string, string> = {
    SPOTIFY: 'text-green-600 bg-green-100',
    APPLE_MUSIC: 'text-gray-900 bg-gray-100',
    DISTROKID: 'text-blue-600 bg-blue-100',
    YOUTUBE_MUSIC: 'text-red-600 bg-red-100',
    TIDAL: 'text-indigo-600 bg-indigo-100',
  }
  return colors[platform] || 'text-gray-600 bg-gray-100'
}

export const getPlatformIcon = (platform: string): string => {
  const icons: Record<string, string> = {
    SPOTIFY: '🎵',
    APPLE_MUSIC: '🍎',
    DISTROKID: '🎼',
    YOUTUBE_MUSIC: '📺',
    TIDAL: '🌊',
  }
  return icons[platform] || '🎶'
}