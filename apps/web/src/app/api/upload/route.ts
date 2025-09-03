import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

/**
 * POST /api/upload
 * Upload audio files and artwork to S3
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'audio' | 'artwork'
    const artistId = formData.get('artistId') as string
    const releaseId = formData.get('releaseId') as string

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    if (!type || !['audio', 'artwork'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Must be "audio" or "artwork"',
        },
        { status: 400 }
      )
    }

    // Validate file type and size
    if (type === 'audio') {
      const allowedAudioTypes = ['audio/wav', 'audio/mp3', 'audio/flac', 'audio/mpeg']
      if (!allowedAudioTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid audio file type. Supported: WAV, MP3, FLAC',
          },
          { status: 400 }
        )
      }

      // Max 100MB for audio files
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: 'Audio file too large. Maximum size: 100MB',
          },
          { status: 400 }
        )
      }
    } else if (type === 'artwork') {
      const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png']
      if (!allowedImageTypes.includes(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid image file type. Supported: JPEG, PNG',
          },
          { status: 400 }
        )
      }

      // Max 10MB for artwork
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            error: 'Image file too large. Maximum size: 10MB',
          },
          { status: 400 }
        )
      }
    }

    // Generate unique file name
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${artistId}/${type}/${timestamp}.${fileExtension}`
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to S3
    const bucketName = process.env.AWS_S3_BUCKET || 'musicdesk-storage'
    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        type,
        artistId: artistId || '',
        releaseId: releaseId || '',
      },
    })

    await s3Client.send(uploadCommand)

    // Generate public URL
    const publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        url: publicUrl,
        type,
        uploadedAt: new Date().toISOString(),
      },
      message: 'File uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    
    // Handle specific AWS errors
    if (error instanceof Error && error.name === 'CredentialsError') {
      return NextResponse.json(
        {
          success: false,
          error: 'AWS credentials not configured',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'File upload failed',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/upload
 * Get signed URL for direct S3 upload (alternative method)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileType = searchParams.get('fileType')
    const fileName = searchParams.get('fileName')
    const artistId = searchParams.get('artistId')
    const type = searchParams.get('type')

    if (!fileType || !fileName || !artistId || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters',
        },
        { status: 400 }
      )
    }

    // Generate unique file name
    const timestamp = Date.now()
    const fileExtension = fileName.split('.').pop()
    const uniqueFileName = `${artistId}/${type}/${timestamp}.${fileExtension}`

    // In production, generate presigned URL for direct client upload
    // For now, return upload endpoint
    return NextResponse.json({
      success: true,
      data: {
        uploadUrl: '/api/upload',
        fileName: uniqueFileName,
        fields: {
          artistId,
          type,
        },
      },
    })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate upload URL',
      },
      { status: 500 }
    )
  }
}