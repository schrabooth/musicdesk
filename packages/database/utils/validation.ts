import { z } from 'zod'

// Artist validation schemas
export const createArtistSchema = z.object({
  name: z.string().min(1, 'Artist name is required').max(100),
  bio: z.string().max(1000).optional(),
  genres: z.array(z.string()).max(10),
  socialLinks: z.record(z.string().url()).optional(),
})

// Track validation schemas  
export const createTrackSchema = z.object({
  title: z.string().min(1, 'Track title is required').max(200),
  isrc: z.string().regex(/^[A-Z]{2}[A-Z0-9]{3}[0-9]{2}[0-9]{5}$/).optional(),
  duration: z.number().positive().optional(),
  explicit: z.boolean().default(false),
  genres: z.array(z.string()).max(5),
})

// Release validation schemas
export const createReleaseSchema = z.object({
  title: z.string().min(1, 'Release title is required').max(200),
  releaseType: z.enum(['SINGLE', 'EP', 'ALBUM', 'COMPILATION']),
  releaseDate: z.date().optional(),
  upc: z.string().regex(/^[0-9]{12,13}$/).optional(),
  label: z.string().max(100).optional(),
  copyright: z.string().max(200).optional(),
  genre: z.string().max(50).optional(),
})

// User validation schemas
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
})

// Organization validation schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
})

// Royalty validation schemas
export const createRoyaltySchema = z.object({
  source: z.string().min(1).max(100),
  type: z.enum(['MECHANICAL', 'PERFORMANCE', 'SYNCHRONIZATION', 'MASTER', 'NEIGHBORING_RIGHTS', 'DIGITAL_PERFORMANCE']),
  amount: z.number().positive(),
  currency: z.string().length(3),
  period: z.date(),
  territory: z.string().max(3).optional(),
})