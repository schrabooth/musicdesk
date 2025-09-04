'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface ManagedArtist {
  id: string
  name: string
  avatar?: string
  verified: boolean
  userRole: 'OWNER' | 'MANAGER' | 'CONTRIBUTOR' | 'VIEWER'
}

export default function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [managedArtists, setManagedArtists] = useState<ManagedArtist[]>([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchManagedArtists()
    }
  }, [isOpen, session])

  const fetchManagedArtists = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/users/me')
      const data = await response.json()
      
      if (data.success) {
        setManagedArtists(data.data.managedArtists || [])
      }
    } catch (error) {
      console.error('Error fetching managed artists:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeArtist = async (artistId: string) => {
    try {
      const response = await fetch(`/api/artists/${artistId}/unclaim`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setManagedArtists(prev => prev.filter(a => a.id !== artistId))
      }
    } catch (error) {
      console.error('Error removing artist:', error)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar/Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt={session.user.name || session.user.email || ''} 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-purple-600 text-sm font-bold">
              {session?.user?.name?.[0] || session?.user?.email?.[0] || 'U'}
            </span>
          )}
        </div>
        
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Demo User'}
          </div>
          <div className="text-xs text-gray-500">
            {managedArtists.length} artist{managedArtists.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Your Artists</h3>
              <Link
                href="/dashboard/artists"
                className="text-purple-600 hover:text-purple-700 text-sm"
                onClick={() => setIsOpen(false)}
              >
                Manage All
              </Link>
            </div>
          </div>

          {/* Artists List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : managedArtists.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <div className="text-2xl mb-2">🎤</div>
                <p className="text-sm mb-3">No artists claimed yet</p>
                <Link
                  href="/dashboard/artists"
                  className="text-purple-600 hover:text-purple-700 text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Search & Claim Artists
                </Link>
              </div>
            ) : (
              <div className="py-2">
                {managedArtists.map((artist) => (
                  <div key={artist.id} className="px-4 py-3 hover:bg-gray-50 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                        {artist.avatar ? (
                          <img 
                            src={artist.avatar} 
                            alt={artist.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">{artist.name[0]}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/artists/${artist.id}`}
                            className="font-medium text-gray-900 hover:text-purple-600 truncate"
                            onClick={() => setIsOpen(false)}
                          >
                            {artist.name}
                          </Link>
                          
                          {artist.verified && (
                            <span className="text-green-500 text-xs">✓</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            artist.userRole === 'OWNER' ? 'bg-purple-100 text-purple-700' :
                            artist.userRole === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {artist.userRole}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              if (confirm(`Remove ${artist.name} from your artists?`)) {
                                removeArtist(artist.id)
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {managedArtists.length} managed artist{managedArtists.length !== 1 ? 's' : ''}
              </span>
              <Link
                href="/dashboard/artists"
                className="text-purple-600 hover:text-purple-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Add More Artists
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}