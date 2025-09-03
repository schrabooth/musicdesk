import { Queue, Worker, Job } from 'bullmq'
import Redis from 'ioredis'

// Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Job types
export interface AnalyticsSyncJob {
  artistId: string
  platform: 'SPOTIFY' | 'APPLE_MUSIC' | 'DISTROKID'
  dateRange?: {
    start: string
    end: string
  }
}

export interface DistributionJob {
  releaseId: string
  distributionId: string
  provider: string
  stores: string[]
}

export interface FileProcessingJob {
  fileUrl: string
  fileName: string
  type: 'audio' | 'artwork'
  releaseId?: string
  trackId?: string
}

export interface EmailJob {
  to: string
  template: string
  data: Record<string, any>
}

// Create queues
export const analyticsQueue = new Queue('analytics', { connection: redis })
export const distributionQueue = new Queue('distribution', { connection: redis })
export const fileProcessingQueue = new Queue('file-processing', { connection: redis })
export const emailQueue = new Queue('email', { connection: redis })

// Queue utilities
export class QueueManager {
  // Analytics sync jobs
  static async syncArtistAnalytics(data: AnalyticsSyncJob) {
    return analyticsQueue.add('sync-analytics', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 10,
      removeOnFail: 5,
    })
  }

  // Distribution jobs
  static async submitDistribution(data: DistributionJob) {
    return distributionQueue.add('submit-distribution', data, {
      attempts: 3,
      delay: 1000, // 1 second delay
      removeOnComplete: 20,
      removeOnFail: 10,
    })
  }

  // File processing jobs
  static async processFile(data: FileProcessingJob) {
    return fileProcessingQueue.add('process-file', data, {
      attempts: 2,
      removeOnComplete: 5,
      removeOnFail: 5,
    })
  }

  // Email jobs
  static async sendEmail(data: EmailJob) {
    return emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 10,
      removeOnFail: 10,
    })
  }

  // Get queue stats
  static async getQueueStats() {
    const [analyticsStats, distributionStats, fileStats, emailStats] = await Promise.all([
      analyticsQueue.getJobCounts(),
      distributionQueue.getJobCounts(),
      fileProcessingQueue.getJobCounts(),
      emailQueue.getJobCounts(),
    ])

    return {
      analytics: analyticsStats,
      distribution: distributionStats,
      fileProcessing: fileStats,
      email: emailStats,
    }
  }

  // Cleanup completed jobs
  static async cleanup() {
    await Promise.all([
      analyticsQueue.clean(24 * 60 * 60 * 1000, 10), // Clean jobs older than 24 hours
      distributionQueue.clean(24 * 60 * 60 * 1000, 10),
      fileProcessingQueue.clean(24 * 60 * 60 * 1000, 10),
      emailQueue.clean(24 * 60 * 60 * 1000, 10),
    ])
  }
}

// Worker processors (would be in separate worker process)
export class Workers {
  static startAnalyticsWorker() {
    return new Worker('analytics', async (job: Job<AnalyticsSyncJob>) => {
      const { artistId, platform, dateRange } = job.data
      
      console.log(`Processing analytics sync for artist ${artistId} on ${platform}`)
      
      // In production, this would call the actual platform APIs
      // For now, simulate the work
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`Analytics sync completed for ${artistId}`)
      return { success: true, artistId, platform, processedAt: new Date().toISOString() }
    }, { connection: redis })
  }

  static startDistributionWorker() {
    return new Worker('distribution', async (job: Job<DistributionJob>) => {
      const { releaseId, distributionId, provider, stores } = job.data
      
      console.log(`Processing distribution for release ${releaseId} via ${provider}`)
      
      // Simulate distribution processing
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      console.log(`Distribution completed for ${releaseId}`)
      return { success: true, releaseId, distributionId, processedAt: new Date().toISOString() }
    }, { connection: redis })
  }

  static startFileProcessingWorker() {
    return new Worker('file-processing', async (job: Job<FileProcessingJob>) => {
      const { fileUrl, fileName, type } = job.data
      
      console.log(`Processing ${type} file: ${fileName}`)
      
      // In production, this would:
      // - Validate file format and quality
      // - Generate waveforms for audio files
      // - Create thumbnails for artwork
      // - Extract metadata
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log(`File processing completed: ${fileName}`)
      return { success: true, fileName, type, processedAt: new Date().toISOString() }
    }, { connection: redis })
  }

  static startEmailWorker() {
    return new Worker('email', async (job: Job<EmailJob>) => {
      const { to, template, data } = job.data
      
      console.log(`Sending email to ${to} using template ${template}`)
      
      // In production, integrate with SendGrid, Resend, or similar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log(`Email sent to ${to}`)
      return { success: true, to, template, sentAt: new Date().toISOString() }
    }, { connection: redis })
  }

  // Start all workers
  static startAllWorkers() {
    return [
      this.startAnalyticsWorker(),
      this.startDistributionWorker(), 
      this.startFileProcessingWorker(),
      this.startEmailWorker(),
    ]
  }
}