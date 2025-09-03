import puppeteer, { Browser, Page } from 'puppeteer'
import { PlatformIntegration, AuthResult, Artist, Analytics, AnalyticsOptions, PlatformCredentials } from '../types'

export interface AppleCredentials extends PlatformCredentials {
  email: string
  password: string
  twilioSid?: string
  twilioToken?: string
  phoneNumber?: string
}

export class AppleMusicIntegration implements PlatformIntegration {
  name = 'apple-music'
  type = 'scraping' as const

  private browser?: Browser
  private credentials: AppleCredentials
  private sessionCookies?: string

  constructor(credentials: AppleCredentials) {
    this.credentials = credentials
  }

  /**
   * Authenticate with Apple Music for Artists using Puppeteer
   */
  async authenticate(credentials: AppleCredentials): Promise<AuthResult> {
    let page: Page | undefined
    
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
          ]
        })
      }

      page = await this.browser.newPage()
      
      // Set realistic viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 })
      await page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      )

      // Navigate to Apple Music for Artists
      await page.goto('https://artists.apple.com', { waitUntil: 'networkidle0' })

      // Click sign in button
      await page.waitForSelector('button[data-testid="sign-in-button"]', { timeout: 10000 })
      await page.click('button[data-testid="sign-in-button"]')

      // Wait for Apple ID iframe to load
      await page.waitForSelector('iframe[name="aid-auth-widget-iFrame"]', { timeout: 15000 })
      
      const iframe = await page.frames().find(frame => frame.name() === 'aid-auth-widget-iFrame')
      if (!iframe) {
        throw new Error('Apple ID iframe not found')
      }

      // Enter credentials in iframe
      await iframe.waitForSelector('#account_name_text_field')
      await iframe.type('#account_name_text_field', credentials.email, { delay: 100 })
      
      await iframe.click('.si-continue-button')
      await iframe.waitForSelector('#password_text_field', { visible: true })
      await iframe.type('#password_text_field', credentials.password, { delay: 100 })
      
      await iframe.click('.si-continue-button')

      // Handle 2FA if required
      try {
        await iframe.waitForSelector('.phone-number-verification', { timeout: 5000 })
        
        // 2FA required - check if we have SMS capabilities
        if (credentials.twilioSid && credentials.twilioToken) {
          const code = await this.retrieveSMSCode(credentials.phoneNumber!)
          if (code) {
            await iframe.type('.trust-code-input', code, { delay: 100 })
            await iframe.click('.trust-continue-button')
          } else {
            return {
              success: false,
              requires2FA: true,
              error: 'Please enter the 2FA code sent to your device',
            }
          }
        } else {
          return {
            success: false,
            requires2FA: true,
            error: 'Two-factor authentication required. Please provide Twilio credentials.',
          }
        }
      } catch (e) {
        // No 2FA required or already handled
      }

      // Wait for successful authentication
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
      
      // Extract session cookies
      const cookies = await page.cookies()
      this.sessionCookies = cookies
        .map(cookie => `${cookie.name}=${cookie.value}`)
        .join('; ')

      await page.close()

      return {
        success: true,
        cookies: this.sessionCookies,
      }
    } catch (error: any) {
      if (page) await page.close()
      return {
        success: false,
        error: error.message || 'Apple Music authentication failed',
      }
    }
  }

  /**
   * Retrieve SMS code using Twilio (simplified implementation)
   */
  private async retrieveSMSCode(phoneNumber: string): Promise<string | null> {
    // This would integrate with Twilio to retrieve the latest SMS
    // For now, return null to indicate manual code entry needed
    return null
  }

  /**
   * Get artists from Apple Music for Artists roster
   */
  async getArtists(auth: AuthResult): Promise<Artist[]> {
    if (!auth.cookies || !this.browser) {
      throw new Error('No valid authentication or browser instance')
    }

    const page = await this.browser.newPage()
    
    try {
      // Set cookies from authentication
      const cookieArray = auth.cookies.split('; ').map(cookie => {
        const [name, value] = cookie.split('=')
        return {
          name,
          value,
          domain: '.apple.com',
        }
      })
      
      await page.setCookie(...cookieArray)
      
      // Navigate to roster page
      await page.goto('https://artists.apple.com/api/artists', {
        waitUntil: 'networkidle0'
      })

      // Extract JSON response
      const content = await page.content()
      const jsonMatch = content.match(/<pre[^>]*>([^<]+)<\/pre>/)
      
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[1])
        
        return (data.managedArtists || []).map((artist: any) => ({
          id: this.extractAmiIdentity(artist.artistId),
          name: artist.artistName,
          image: artist.artwork?.url,
          verified: true, // Artists in roster are verified
          externalUrls: {
            appleMusic: `https://music.apple.com/artist/${artist.artistId}`,
          },
        }))
      }

      return []
    } catch (error) {
      console.error('Error fetching Apple Music artists:', error)
      return []
    } finally {
      await page.close()
    }
  }

  /**
   * Get specific artist by AMI identity
   */
  async getArtist(amiIdentity: string, auth: AuthResult): Promise<Artist | null> {
    const artists = await this.getArtists(auth)
    return artists.find(artist => artist.id === amiIdentity) || null
  }

  /**
   * Get analytics data for an artist
   */
  async getAnalytics(
    artistId: string,
    auth: AuthResult,
    options?: AnalyticsOptions
  ): Promise<Analytics[]> {
    if (!auth.cookies || !this.browser) {
      throw new Error('No valid authentication or browser instance')
    }

    const page = await this.browser.newPage()
    
    try {
      // Set authentication cookies
      const cookieArray = auth.cookies.split('; ').map(cookie => {
        const [name, value] = cookie.split('=')
        return { name, value, domain: '.apple.com' }
      })
      
      await page.setCookie(...cookieArray)

      // Prepare analytics request
      const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const endDate = options?.endDate || new Date().toISOString().split('T')[0]
      
      const requestBody = {
        targets: [{
          targetId: `ami:identity:${artistId}`,
          targetType: 'artist',
          feature: 'plays',
          artistId: `ami:identity:${artistId}`,
        }],
        period: 'ltd',
        granularity: 'd',
        from: startDate,
        to: endDate,
      }

      // Make API request
      const response = await page.evaluate(async (url, body) => {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        return res.json()
      }, 'https://artists.apple.com/api/measure/stats/time_series', requestBody)

      // Transform response to Analytics format
      const analytics: Analytics[] = []
      
      if (response.results && response.results[0]) {
        const result = response.results[0]
        
        for (const dataPoint of result.data || []) {
          analytics.push({
            date: dataPoint.date,
            streams: dataPoint.value || 0,
            territory: result.territory,
          })
        }
      }

      return analytics
    } catch (error) {
      console.error('Error fetching Apple Music analytics:', error)
      return []
    } finally {
      await page.close()
    }
  }

  /**
   * Extract AMI identity from full artistId
   */
  private extractAmiIdentity(artistId: string): string {
    if (artistId.startsWith('ami:identity:')) {
      return artistId.replace('ami:identity:', '')
    }
    return artistId
  }

  /**
   * Clean up browser resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = undefined
    }
  }
}