import puppeteer, { Browser, Page } from 'puppeteer'

export interface SpotifyForArtistsCredentials {
  email: string
  password: string
  artistId: string // Spotify artist ID
}

export interface SpotifyInviteResult {
  success: boolean
  error?: string
  requires2FA?: boolean
  sessionId?: string
  nextSteps?: string[]
}

export class SpotifyForArtistsService {
  private browser?: Browser
  private credentials: SpotifyForArtistsCredentials
  
  constructor(credentials: SpotifyForArtistsCredentials) {
    this.credentials = credentials
  }

  /**
   * Send team invitation to email through Spotify for Artists
   */
  async sendArtistInvitation(inviteEmail: string): Promise<SpotifyInviteResult> {
    let page: Page | undefined

    try {
      // Launch browser
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })

      page = await this.browser.newPage()
      await page.setViewport({ width: 1818, height: 1055 })

      // Navigate to artist team invitation page
      const continueUrl = encodeURIComponent(
        `https://artists.spotify.com/c/team/artist/${this.credentials.artistId}/invite`
      )
      const loginUrl = `https://accounts.spotify.com/en/login?continue=${continueUrl}`

      console.log('Navigating to Spotify for Artists login...')
      await page.goto(loginUrl, { waitUntil: 'networkidle0' })

      // Login to Spotify for Artists
      console.log('Logging in to Spotify for Artists...')
      await this.login(page)

      // Check for 2FA
      await page.waitForTimeout(3000)
      
      const requires2FA = await this.check2FA(page)
      if (requires2FA) {
        return {
          success: false,
          requires2FA: true,
          sessionId: `spotify_${Date.now()}`,
          error: 'Two-factor authentication required',
        }
      }

      // Send invitation
      console.log('Sending team invitation...')
      const inviteResult = await this.sendTeamInvitation(page, inviteEmail)

      await page.close()
      await this.browser.close()

      return inviteResult

    } catch (error: any) {
      if (page) await page.close()
      if (this.browser) await this.browser.close()
      
      return {
        success: false,
        error: error.message || 'Failed to send Spotify invitation',
      }
    }
  }

  /**
   * Login to Spotify for Artists
   */
  private async login(page: Page): Promise<void> {
    try {
      // Wait for login form
      await page.waitForSelector('#login-username', { timeout: 10000 })
      
      // Fill credentials
      await page.type('#login-username', this.credentials.email, { delay: 100 })
      await page.type('#login-password', this.credentials.password, { delay: 100 })
      
      // Submit login
      await page.click('#login-button')
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 })
      
    } catch (error) {
      throw new Error('Login failed: ' + (error as Error).message)
    }
  }

  /**
   * Check for 2FA requirement
   */
  private async check2FA(page: Page): Promise<boolean> {
    try {
      // Look for 2FA indicators
      const smsCode = await page.$('input[name="challenge"]') !== null
      const appCode = await page.$('input[data-testid="app-code"]') !== null
      const emailCode = await page.$('input[data-testid="email-code"]') !== null
      
      return smsCode || appCode || emailCode
    } catch (error) {
      return false
    }
  }

  /**
   * Send team invitation
   */
  private async sendTeamInvitation(page: Page, inviteEmail: string): Promise<SpotifyInviteResult> {
    try {
      // Should be on team invitation page now
      await page.waitForSelector('input[name="email"]', { timeout: 10000 })
      
      // Fill invitation email
      await page.type('input[name="email"]', inviteEmail, { delay: 100 })
      
      // Select role (usually 'viewer' for analytics access)
      const roleSelector = 'select[name="role"], input[value="viewer"]'
      const roleElement = await page.$(roleSelector)
      if (roleElement) {
        await page.select('select[name="role"]', 'viewer')
      }
      
      // Send invitation
      const submitButton = await page.$('button[type="submit"], button[data-testid="send-invite"]')
      if (submitButton) {
        await submitButton.click()
      }
      
      // Wait for confirmation
      await page.waitForTimeout(3000)
      
      // Check for success indicators
      const successSelector = '[data-testid="success"], .success, [class*="success"]'
      const successElement = await page.$(successSelector)
      
      if (successElement) {
        return {
          success: true,
          nextSteps: [
            `Invitation sent to ${inviteEmail}`,
            'Check your email for the Spotify for Artists team invitation',
            'Accept the invitation to verify artist ownership',
            'Verification will be completed automatically once accepted',
          ],
        }
      } else {
        // Check for error messages
        const errorElement = await page.$('[data-testid="error"], .error, [class*="error"]')
        const errorText = errorElement ? await page.evaluate(el => el.textContent, errorElement) : 'Unknown error'
        
        return {
          success: false,
          error: `Failed to send invitation: ${errorText}`,
        }
      }
      
    } catch (error) {
      return {
        success: false,
        error: 'Failed to send team invitation: ' + (error as Error).message,
      }
    }
  }

  /**
   * Cleanup browser resources
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = undefined
    }
  }
}