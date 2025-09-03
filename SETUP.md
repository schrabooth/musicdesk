# MusicDesk Setup Guide

## Quick Setup with Docker (Recommended)

### 1. Install Docker Desktop (using Homebrew)
```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop from Applications or:
open -a Docker

# Verify installation
docker --version
docker compose version
```

### 2. Clone and Setup Project
```bash
git clone https://github.com/schrabooth/musicdesk.git
cd musicdesk

# Copy environment variables
cp .env.example .env.local

# Start all services with Docker
docker compose up --build
```

That's it! 🎉 The application will be available at:
- **Web App**: http://localhost:3000
- **Database**: localhost:5432 
- **Redis**: localhost:6379

### 3. Add Platform Credentials (Optional)
Edit `.env.local` to add your platform API keys:

```bash
# Spotify (for OAuth integration)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Apple Music (for scraping integration)
APPLE_ARTISTS_EMAIL=your_apple_email
APPLE_ARTISTS_PASSWORD=your_apple_password

# DistroKid (for earnings data)
DISTROKID_ROSTER_EMAIL=your_distrokid_email
DISTROKID_ROSTER_PASSWORD=your_distrokid_password
```

---

## Manual Setup (Without Docker)

### Prerequisites
```bash
# Install Node.js 20+ and pnpm
brew install node pnpm

# Install PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Install Redis  
brew install redis
brew services start redis

# Create database
createdb musicdesk
```

### Setup Steps
```bash
# 1. Install dependencies
pnpm install

# 2. Setup database
cd packages/database
DATABASE_URL="postgresql://$(whoami):@localhost:5432/musicdesk" pnpm prisma db push
cd ../..

# 3. Build packages
cd packages/integrations && pnpm build && cd ../..

# 4. Start development server
cd apps/web && pnpm dev
```

---

## Available API Endpoints

### Artist Management
- `GET /api/artists` - List all artists
- `POST /api/artists` - Create artist
- `GET /api/artists/[id]` - Get artist details
- `PUT /api/artists/[id]` - Update artist
- `DELETE /api/artists/[id]` - Delete artist

### Analytics
- `GET /api/artists/[id]/analytics` - Get artist analytics
- `GET /api/analytics/stream?artistId=...` - Real-time updates (SSE)

### Platform Integrations

#### Spotify
- `GET /api/platforms/spotify/auth?artistId=...` - Get OAuth URL
- `GET /api/platforms/spotify/callback` - OAuth callback
- `GET /api/platforms/spotify/search?q=...` - Search artists

#### Apple Music
- `POST /api/platforms/apple/auth` - Authenticate with Apple

#### DistroKid  
- `POST /api/platforms/distrokid/auth` - Authenticate
- `POST /api/platforms/distrokid/earnings` - Download earnings

---

## Architecture Overview

### Monorepo Structure
```
musicdesk/
├── apps/
│   └── web/                 # Next.js application
│       └── src/app/api/     # API routes
├── packages/
│   ├── database/            # Prisma schema & client
│   ├── integrations/        # Platform API clients
│   ├── ui/                  # Shared components
│   └── utils/              # Shared utilities
└── docker/                 # Docker configuration
```

### How Packages Work
The Next.js API routes import from shared packages:

```typescript
// In apps/web/src/app/api/artists/route.ts
import { prisma, createOrUpdateArtist } from '@musicdesk/database'
import { SpotifyIntegration } from '@musicdesk/integrations'

export async function GET() {
  // Use shared database client
  const artists = await prisma.artist.findMany()
  
  // Use shared integration
  const spotify = new SpotifyIntegration(clientId, clientSecret)
  return NextResponse.json({ artists })
}
```

### Benefits
- **Shared Database Client**: Same Prisma instance across all APIs
- **Reusable Integrations**: Spotify/Apple/DistroKid clients used everywhere
- **Type Safety**: TypeScript types shared across packages
- **Atomic Changes**: Update schema + API in single commit

---

## Development Workflow

### Adding New API Endpoints
1. Create route in `apps/web/src/app/api/`
2. Import shared utilities from packages
3. Use TypeScript for full type safety

### Adding New Platform Integration
1. Create new client in `packages/integrations/src/`
2. Implement `PlatformIntegration` interface
3. Add to factory in `packages/integrations/src/index.ts`
4. Create API routes in `apps/web/src/app/api/platforms/`

### Database Changes
1. Update `packages/database/prisma/schema.prisma`
2. Run `pnpm prisma db push` or create migration
3. Generate new client with `pnpm prisma generate`
4. Types automatically available in all apps

---

## Troubleshooting

### Docker Issues
```bash
# Reset Docker environment
docker compose down -v
docker system prune -a
docker compose up --build

# View logs
docker compose logs web
docker compose logs postgres
```

### Package Import Issues
```bash
# Rebuild integrations package
cd packages/integrations && pnpm build

# Reinstall dependencies
pnpm install
```

### Database Issues  
```bash
# Reset database
cd packages/database
pnpm prisma db push --force-reset
```