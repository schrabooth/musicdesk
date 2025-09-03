# MusicDesk

## The Open-Source Music Business Platform

MusicDesk is an open-source music business platform that empowers independent artists with professional tools for distribution, analytics, and royalty recovery - without the middleman fees.

### 🎯 Mission

Empower independent artists with transparent, affordable tools to build successful music careers without exploitative middlemen.

### ✨ Features

- **🚀 Distribution**: Release to 150+ streaming platforms
- **📊 Analytics**: Real-time streaming data and insights
- **💰 Royalty Recovery**: Find and claim unclaimed royalties
- **🎵 Artist Tools**: Complete music business management
- **🔌 Plugin System**: Extensible integrations
- **🏠 Self-Hostable**: Own your data and infrastructure

### 🏗️ Architecture

```
musicdesk/
├── apps/
│   ├── web/           # Next.js main application
│   ├── worker/        # Background job processing
│   └── docs/          # Documentation site
├── packages/
│   ├── ui/            # Shared UI components
│   ├── database/      # Prisma schemas & migrations
│   ├── integrations/  # Platform integrations (Spotify, Apple, etc.)
│   ├── utils/         # Shared utilities
│   └── config/        # Shared configuration
├── docker/            # Docker configuration
└── scripts/           # Build and deployment scripts
```

### 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js (Google, GitHub, Credentials)
- **Styling**: Tailwind CSS + Recharts
- **Real-time**: Server-Sent Events
- **Jobs**: BullMQ + Redis
- **Storage**: AWS S3
- **Deployment**: Docker + Vercel/Railway

### 🚀 Quick Start

#### Option 1: One-Command Setup (Easiest)
```bash
# Clone the repository
git clone https://github.com/schrabooth/musicdesk.git
cd musicdesk

# Run startup script (auto-detects Docker vs Manual)
chmod +x startup.sh
./startup.sh
```

#### Option 2: Docker Setup
```bash
# Install Docker Desktop
brew install --cask docker
open -a Docker

# Clone and start
git clone https://github.com/schrabooth/musicdesk.git
cd musicdesk
docker compose up --build

# Seed database (in another terminal)
docker compose exec web pnpm run db:seed
```

#### Option 3: Manual Setup
```bash
# Install dependencies
brew install postgresql@15 redis pnpm
brew services start postgresql@15 redis

# Setup project
git clone https://github.com/schrabooth/musicdesk.git
cd musicdesk
pnpm install

# Setup database
createdb musicdesk
DATABASE_URL="postgresql://$(whoami):@localhost:5432/musicdesk" pnpm run db:push
cd packages/database && DATABASE_URL="postgresql://$(whoami):@localhost:5432/musicdesk" pnpm run db:seed

# Start development
cd ../../apps/web && pnpm dev
```

### 🎯 Access the Platform

- **Web App**: http://localhost:3000
- **Admin Login**: admin@musicdesk.dev / admin123!

### 🔌 Platform Integrations

MusicDesk connects with all major music platforms:

```typescript
// Spotify OAuth integration
const spotify = IntegrationFactory.createSpotify(clientId, clientSecret)
await spotify.authenticate({ code })

// Apple Music with 2FA
const apple = new AppleMusicIntegration({ email, password })
await apple.authenticate({ email, password })

// DistroKid earnings data
const distrokid = new DistroKidIntegration({ email, password })
const royalties = await distrokid.downloadBankDetails(auth)
```

### 🎵 **Available Features**

- ✅ **Artist Management**: Create, verify, and manage artist profiles
- ✅ **Platform Connections**: Spotify OAuth, Apple Music scraping, DistroKid 2FA
- ✅ **Real-time Analytics**: Live streaming data with growth metrics
- ✅ **Release Distribution**: Upload music and distribute to 150+ platforms
- ✅ **Royalty Recovery**: Find and claim unclaimed mechanical royalties
- ✅ **File Upload**: Audio and artwork with S3 storage
- ✅ **Admin Dashboard**: User management and platform statistics
- ✅ **Background Jobs**: Async processing for platform sync

### 📚 Documentation

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api.md)
- [Plugin Development](./docs/plugins.md)
- [Self-Hosting Guide](./docs/self-hosting.md)
- [Contributing](./docs/contributing.md)

### 🤝 Contributing

We welcome contributions from developers, musicians, and music industry professionals.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 💖 Support

If MusicDesk helps your music career, consider:
- ⭐ Starring this repository
- 🐛 Reporting bugs and requesting features
- 💝 Sponsoring development
- 🗣️ Spreading the word to other artists

---

**Built with ❤️ by musicians, for musicians.**