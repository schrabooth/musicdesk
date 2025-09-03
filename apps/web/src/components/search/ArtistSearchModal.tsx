'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface SearchResult {
  platform: string
  externalId: string
  name: string
  image?: string
  genres: string[]
  followers: number
  verified: boolean
  confidence: number
  externalUrls?: Record<string, string>
}

interface ArtistSearchModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onArtistAdded?: (artist: any) => void
}

export default function ArtistSearchModal({ 
  isOpen, 
  onClose, 
  organizationId,
  onArtistAdded 
}: ArtistSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'spotify' | 'apple'>('all')
  
  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Search function
  const searchArtists = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        q: query,
        platform: selectedPlatform,
        organizationId,
      })

      const response = await fetch(`/api/artists/search?${params}`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.results || [])
      } else {
        setError(data.error || 'Search failed')
        setSearchResults([])
      }
    } catch (err) {
      setError('Error performing search')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [selectedPlatform, organizationId])

  // Trigger search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchArtists(debouncedSearchTerm)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchTerm, searchArtists])

  // Add artist to database
  const addArtist = async (result: SearchResult) => {
    try {
      setLoading(true)

      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: result.name,
          organizationId,
          spotifyId: result.platform === 'SPOTIFY' ? result.externalId : undefined,
          appleMusicId: result.platform === 'APPLE_MUSIC' ? result.externalId : undefined,
          genres: result.genres,
          verified: result.verified,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onArtistAdded?.(data.data)
        onClose()
      } else {
        setError(data.error || 'Failed to add artist')
      }
    } catch (err) {
      setError('Error adding artist')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b">
          <h3 className="text-lg font-medium text-gray-900">Search for Artists</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search Controls */}
        <div className="mt-4 space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search for artists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Platforms</option>
              <option value="spotify">Spotify Only</option>
              <option value="apple">Apple Music Only</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mt-4 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Searching...</span>
          </div>
        )}

        {/* Search Results */}
        <div className="mt-4 max-h-96 overflow-y-auto">
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Found {searchResults.length} artist{searchResults.length !== 1 ? 's' : ''}
              </h4>
              
              {searchResults.map((result, index) => (
                <div
                  key={`${result.platform}-${result.externalId}`}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold">{result.name[0]}</span>
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-gray-900">{result.name}</h5>
                        {result.verified && (
                          <span className="text-blue-500 text-xs">✓</span>
                        )}
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {result.platform}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{result.followers.toLocaleString()} followers</span>
                        <span>{Math.round(result.confidence * 100)}% match</span>
                      </div>
                      
                      {result.genres.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {result.genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => addArtist(result)}
                    disabled={loading}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Add Artist
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && !loading && searchResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>No artists found for "{searchTerm}"</p>
              <p className="text-sm">Try a different search term or check the spelling.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}