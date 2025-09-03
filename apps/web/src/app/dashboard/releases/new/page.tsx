'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FileUploader from '@/components/upload/FileUploader'

export default function NewReleasePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [releaseData, setReleaseData] = useState({
    title: '',
    releaseType: 'SINGLE' as const,
    releaseDate: '',
    genre: '',
    label: '',
    copyright: '',
    coverArt: '',
    tracks: [{ title: '', audioFile: null as File | null, audioUrl: '' }]
  })

  const [saving, setSaving] = useState(false)

  const updateReleaseData = (field: string, value: any) => {
    setReleaseData(prev => ({ ...prev, [field]: value }))
  }

  const addTrack = () => {
    setReleaseData(prev => ({
      ...prev,
      tracks: [...prev.tracks, { title: '', audioFile: null, audioUrl: '' }]
    }))
  }

  const updateTrack = (index: number, field: string, value: any) => {
    setReleaseData(prev => ({
      ...prev,
      tracks: prev.tracks.map((track, i) => 
        i === index ? { ...track, [field]: value } : track
      )
    }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      // Create release
      const response = await fetch('/api/releases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...releaseData,
          artistId: 'demo-artist-id', // In production, get from session
          tracks: releaseData.tracks.map(track => ({
            title: track.title,
            audioUrl: track.audioUrl,
          }))
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/releases/${data.data.id}`)
      } else {
        console.error('Error creating release:', data.error)
      }
    } catch (err) {
      console.error('Error creating release:', err)
    } finally {
      setSaving(false)
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
              <Link href="/dashboard/releases" className="text-gray-500 hover:text-gray-700">Releases</Link>
              <span className="text-gray-400">→</span>
              <h1 className="text-lg font-medium text-gray-900">New Release</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  step >= stepNum 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 ${
                    step > stepNum ? 'bg-purple-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 text-sm text-gray-600">
            <span className="text-center">
              Step {step} of 3: {
                step === 1 ? 'Basic Info' :
                step === 2 ? 'Upload Files' :
                'Review & Submit'
              }
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Release Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release Title *
                  </label>
                  <input
                    type="text"
                    value={releaseData.title}
                    onChange={(e) => updateReleaseData('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Enter release title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release Type
                  </label>
                  <select
                    value={releaseData.releaseType}
                    onChange={(e) => updateReleaseData('releaseType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="SINGLE">Single</option>
                    <option value="EP">EP</option>
                    <option value="ALBUM">Album</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={releaseData.releaseDate}
                    onChange={(e) => updateReleaseData('releaseDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={releaseData.genre}
                    onChange={(e) => updateReleaseData('genre', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., Pop, Rock, Hip-Hop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Record Label
                  </label>
                  <input
                    type="text"
                    value={releaseData.label}
                    onChange={(e) => updateReleaseData('label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Independent or label name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Copyright
                  </label>
                  <input
                    type="text"
                    value={releaseData.copyright}
                    onChange={(e) => updateReleaseData('copyright', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="© 2024 Artist Name"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!releaseData.title}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Upload Files
                </button>
              </div>
            </div>
          )}

          {/* Step 2: File Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
              
              {/* Cover Art */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Cover Artwork *
                </label>
                <FileUploader
                  type="artwork"
                  onUpload={(file, url) => updateReleaseData('coverArt', url)}
                />
              </div>

              {/* Tracks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Tracks
                </label>
                
                {releaseData.tracks.map((track, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => updateTrack(index, 'title', e.target.value)}
                        placeholder={`Track ${index + 1} title`}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <FileUploader
                      type="audio"
                      onUpload={(file, url) => {
                        updateTrack(index, 'audioFile', file)
                        updateTrack(index, 'audioUrl', url)
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={addTrack}
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  + Add Another Track
                </button>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!releaseData.coverArt || !releaseData.tracks[0].audioUrl}
                  className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Submit</h2>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">{releaseData.title}</h3>
                <p className="text-sm text-gray-600">
                  {releaseData.releaseType} • {releaseData.genre} • {releaseData.tracks.length} track(s)
                </p>
                <p className="text-sm text-gray-600">
                  Release Date: {releaseData.releaseDate || 'Not specified'}
                </p>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(2)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Creating Release...' : 'Create Release'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}