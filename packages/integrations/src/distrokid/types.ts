// DistroKid-specific types

export interface DistroKidCredentials {
  email: string
  password: string
  twilioSid?: string
  twilioToken?: string
  twilioPhone?: string
  imapEmail?: string
  imapPassword?: string
}

export interface DistroKidBankDetail {
  reportingDate: string
  saleMonth: string
  store: string
  artist: string
  title: string
  isrc: string
  upc: string
  quantity: number
  teamPercentage: number
  songOrAlbum: 'Song' | 'Album'
  countryOfSale: string
  songwriterRoyaltiesWithheld: number
  earningsUSD: number
}

export interface DistroKidAccount {
  email: string
  distrokidId: number
  lastSync: Date
  totalEarnings: number
  trackCount: number
  status: 'active' | 'inactive' | 'error'
}

export interface DistroKidAPIResponse {
  success: boolean
  data?: any
  error?: string
  requires2FA?: boolean
  sessionId?: string
}

export interface DistroKidArtistData {
  name: string
  releases: Array<{
    title: string
    upc: string
    releaseDate: string
    tracks: Array<{
      title: string
      isrc: string
      earnings: number
    }>
  }>
  totalEarnings: number
  totalStreams: number
}

// TSV file column mapping
export const DISTROKID_TSV_COLUMNS = {
  REPORTING_DATE: 0,
  SALE_MONTH: 1,
  STORE: 2,
  ARTIST: 3,
  TITLE: 4,
  ISRC: 5,
  UPC: 6,
  QUANTITY: 7,
  TEAM_PERCENTAGE: 8,
  SONG_OR_ALBUM: 9,
  COUNTRY_OF_SALE: 10,
  SONGWRITER_ROYALTIES_WITHHELD: 11,
  EARNINGS_USD: 12,
} as const

export interface ProcessedDistroKidData {
  rawEntries: DistroKidBankDetail[]
  summary: {
    totalEarnings: number
    totalStreams: number
    uniqueTracks: number
    dateRange: {
      start: string
      end: string
    }
    topStores: Array<{
      store: string
      earnings: number
      percentage: number
    }>
    topTracks: Array<{
      title: string
      artist: string
      earnings: number
      streams: number
    }>
  }
}