import puppeteer, { Browser, Page } from 'puppeteer'
import { PlatformIntegration, AuthResult, Artist, RoyaltyData, PlatformCredentials } from '../types'

export interface DistroKidCredentials extends PlatformCredentials {
  email: string
  password: string
  twilioSid?: string
  twilioToken?: string
  twilioPhone?: string
  imapEmail?: string
  imapPassword?: string
}

export interface DistroKidSession {
  browser: Browser
  page: Page
  timeoutId: NodeJS.Timeout
  email: string
  password: string
}

// In-memory session storage for 2FA flows
export const activeSessions = new Map<string, DistroKidSession>()

export class DistroKidIntegration implements PlatformIntegration {
  name = 'distrokid'
  type = 'scraping' as const

  private credentials: DistroKidCredentials
  private browser?: Browser

  constructor(credentials: DistroKidCredentials) {
    this.credentials = credentials
  }

  /**
   * Authenticate with DistroKid using complex 2FA flow
   */
  async authenticate(credentials: DistroKidCredentials): Promise<AuthResult> {
    let page: Page | undefined

    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--window-size=1920,1080'
          ]
        })
      }

      page = await this.browser.newPage()
      
      // Set realistic browser context
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Navigate to DistroKid login
      await page.goto('https://distrokid.com/signin', { waitUntil: 'networkidle0' })

      // Handle potential CAPTCHA
      const captchaSelector = '.g-recaptcha'
      const hasCaptcha = await page.$(captchaSelector) !== null

      if (hasCaptcha) {
        // In production, integrate with 2captcha service
        console.warn('CAPTCHA detected - manual intervention required')
      }

      // Enter login credentials
      await page.waitForSelector('input[name="email"]')
      await page.type('input[name="email"]', credentials.email, { delay: 100 })
      await page.type('input[name="password"]', credentials.password, { delay: 100 })

      // Submit login form
      await page.click('button[type="submit"]')

      // Wait for either dashboard or 2FA prompt
      try {
        await page.waitForSelector('#TwoFactorInputBox', { timeout: 5000 })
        
        // 2FA required - handle different methods
        const sessionId = this.generateSessionId()
        
        // Store browser session for 2FA completion
        const session: DistroKidSession = {
          browser: this.browser,
          page,
          email: credentials.email,
          password: credentials.password,
          timeoutId: setTimeout(() => {
            this.cleanupSession(sessionId)
          }, 5 * 60 * 1000) // 5 minute timeout
        }

        activeSessions.set(sessionId, session)

        // Try automatic 2FA if credentials provided
        if (this.isAutomaticAccountType(credentials.email)) {
          const code = await this.retrieveEmailVerificationCode(credentials)
          if (code) {
            return await this.submit2FACode(sessionId, code)
          }
        }

        return {
          success: false,
          requires2FA: true,
          sessionId,
          error: 'Two-factor authentication required. Please provide the 6-digit code.',
        }
      } catch (e) {
        // No 2FA required - continue with login
        await page.waitForNavigation({ waitUntil: 'networkidle0' })
      }

      // Extract session cookies
      const cookies = await page.cookies()
      const cookieString = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ')

      // Get DistroKid user ID
      const distrokidId = await this.extractDistroKidId(page)

      return {
        success: true,
        cookies: cookieString,
        accessToken: distrokidId?.toString(),
      }
    } catch (error: any) {
      if (page) await page.close()
      return {
        success: false,
        error: error.message || 'DistroKid authentication failed',
      }
    }
  }

  /**
   * Submit 2FA code for pending authentication
   */
  async submit2FACode(sessionId: string, code: string): Promise<AuthResult> {
    const session = activeSessions.get(sessionId)
    if (!session) {
      return {
        success: false,
        error: 'Session expired or invalid',
      }
    }

    try {
      const { page } = session

      // Enter 2FA code
      await page.waitForSelector('#TwoFactorInputBox')
      await page.type('#TwoFactorInputBox', code, { delay: 100 })
      
      // Submit code
      await page.click('button[type="submit"]')
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })

      // Extract successful session data
      const cookies = await page.cookies()
      const cookieString = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ')

      const distrokidId = await this.extractDistroKidId(page)

      // Clean up session
      this.cleanupSession(sessionId)

      return {
        success: true,
        cookies: cookieString,
        accessToken: distrokidId?.toString(),
      }
    } catch (error: any) {
      this.cleanupSession(sessionId)
      return {
        success: false,
        error: error.message || '2FA verification failed',
      }
    }
  }

  /**
   * Download and process DistroKid bank details
   */
  async downloadBankDetails(auth: AuthResult): Promise<RoyaltyData[]> {
    if (!auth.cookies || !this.browser) {
      throw new Error('No valid authentication or browser instance')
    }

    const page = await this.browser.newPage()
    
    try {
      // Set authentication cookies
      const cookieArray = auth.cookies.split('; ').map(cookie => {
        const [name, value] = cookie.split('=')
        return { name, value, domain: '.distrokid.com' }
      })
      
      await page.setCookie(...cookieArray)

      // Navigate to bank details page
      await page.goto('https://distrokid.com/bank/details', {
        waitUntil: 'networkidle0'
      })

      // Click download TSV button
      const downloadPromise = page.waitForEvent('download')
      await page.click('button[data-action="download-tsv"]')
      const download = await downloadPromise

      // Save and process the file
      const filePath = `/tmp/distrokid_${Date.now()}.tsv`
      await download.saveAs(filePath)

      // Process TSV file
      const royalties = await this.processBankDetailsFile(filePath)

      return royalties
    } catch (error) {
      console.error('Error downloading DistroKid bank details:', error)
      return []
    } finally {
      await page.close()
    }
  }

  /**
   * Process TSV bank details file
   */
  private async processBankDetailsFile(filePath: string): Promise<RoyaltyData[]> {
    const fs = await import('fs/promises')
    const content = await fs.readFile(filePath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim())
    
    // Skip header line
    const dataLines = lines.slice(1)
    
    return dataLines.map(line => {
      const columns = line.split('\t')
      
      return {
        title: columns[4] || '', // Track title
        artist: columns[3] || '', // Artist name
        amount: parseFloat(columns[11]) || 0, // Earnings USD
        currency: 'USD',
        period: columns[1] || '', // Sale month
        source: columns[2] || '', // Store
        isrc: columns[5] || '', // ISRC
        territory: columns[9] || '', // Country of sale
        status: 'claimed' as const, // DistroKid royalties are claimed
      }
    })
  }

  /**
   * Check if email is for automatic handling (MusicDesk managed accounts)
   */
  private isAutomaticAccountType(email: string): boolean {
    return email.includes('@musicdesk.dev') || email.includes('@musicdesk.com')
  }

  /**
   * Retrieve verification code from email (for managed accounts)
   */
  private async retrieveEmailVerificationCode(credentials: DistroKidCredentials): Promise<string | null> {
    if (!credentials.imapEmail || !credentials.imapPassword) {
      return null
    }

    try {
      // This would integrate with IMAP to fetch latest email
      // For now, return null to indicate manual entry needed
      return null
    } catch (error) {
      console.error('Error retrieving email verification code:', error)
      return null
    }
  }

  /**
   * Extract DistroKid user ID from dashboard page
   */
  private async extractDistroKidId(page: Page): Promise<number | null> {
    try {
      // Look for user ID in various locations
      const idFromAPI = await page.evaluate(() => {
        // Check for user data in window object
        return (window as any).distrokidUser?.id || null
      })

      if (idFromAPI) return idFromAPI

      // Fallback: extract from URL or DOM elements
      const url = page.url()
      const idMatch = url.match(/user[\/=](\d+)/)
      return idMatch ? parseInt(idMatch[1]) : null
    } catch (error) {
      console.error('Error extracting DistroKid ID:', error)
      return null
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `dk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up browser session
   */
  private cleanupSession(sessionId: string): void {
    const session = activeSessions.get(sessionId)
    if (session) {
      clearTimeout(session.timeoutId)
      session.page.close().catch(console.error)
      activeSessions.delete(sessionId)
    }
  }

  // Required interface methods (simplified implementations)
  async getArtists(auth: AuthResult): Promise<Artist[]> {
    // DistroKid doesn't have "artists" in the same way - return empty array
    return []
  }

  async getArtist(id: string, auth: AuthResult): Promise<Artist | null> {
    return null
  }

  async getAnalytics(): Promise<any[]> {
    // Analytics would come from processed bank details
    return []
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    // Clean up all active sessions
    for (const [sessionId] of activeSessions) {
      this.cleanupSession(sessionId)
    }

    if (this.browser) {
      await this.browser.close()
      this.browser = undefined
    }
  }
}