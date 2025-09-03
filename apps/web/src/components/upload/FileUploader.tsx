'use client'

import { useState, useCallback } from 'react'

interface FileUploaderProps {
  type: 'audio' | 'artwork'
  onUpload: (file: File, url?: string) => void
  maxSize?: number
  accept?: string
  className?: string
}

export default function FileUploader({ 
  type, 
  onUpload, 
  maxSize = type === 'audio' ? 100 * 1024 * 1024 : 10 * 1024 * 1024, // 100MB for audio, 10MB for artwork
  accept = type === 'audio' ? 'audio/*' : 'image/*',
  className = ''
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFile = async (file: File) => {
    setError('')
    
    // Validate file type
    const validTypes = type === 'audio' 
      ? ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/mpeg']
      : ['image/jpeg', 'image/jpg', 'image/png']
    
    if (!validTypes.includes(file.type)) {
      setError(`Invalid file type. Supported: ${validTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024)
      setError(`File too large. Maximum size: ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 200)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('artistId', 'demo-artist-id')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (data.success) {
        onUpload(file, data.data.url)
      } else {
        setError(data.error || 'Upload failed')
      }
    } catch (err) {
      setError('Upload error occurred')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-purple-400 bg-purple-50'
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
        } ${uploading ? 'pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="text-4xl">⏳</div>
            <div>
              <p className="text-gray-600 mb-2">Uploading {type}...</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{Math.round(uploadProgress)}% complete</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-4xl">
              {type === 'audio' ? '🎵' : '🖼️'}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Drop your {type} file here
              </p>
              <p className="text-gray-500">
                or click to browse
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <p>
                Supported: {type === 'audio' ? 'WAV, MP3, FLAC' : 'JPEG, PNG'}
              </p>
              <p>
                Max size: {Math.round(maxSize / (1024 * 1024))}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}