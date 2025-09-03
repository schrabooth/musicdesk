#!/bin/bash

# MusicDesk Startup Script
# Automatically detects and starts the best available setup

set -e  # Exit on any error

echo "🎵 Starting MusicDesk Platform..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a service is running
service_running() {
    if command_exists brew; then
        brew services list | grep "$1.*started" >/dev/null 2>&1
    else
        return 1
    fi
}

# Function to start manual setup
start_manual() {
    echo -e "${BLUE}📋 Manual Setup Mode${NC}"
    echo ""
    
    # Check and install dependencies
    if ! command_exists pnpm; then
        echo -e "${YELLOW}Installing pnpm...${NC}"
        brew install pnpm
    fi
    
    if ! command_exists psql; then
        echo -e "${YELLOW}Installing PostgreSQL...${NC}"
        brew install postgresql@15
    fi
    
    if ! service_running postgresql; then
        echo -e "${YELLOW}Starting PostgreSQL...${NC}"
        brew services start postgresql@15
    fi
    
    # Check if Redis is available (optional)
    if command_exists redis-cli && service_running redis; then
        echo -e "${GREEN}✅ Redis detected and running${NC}"
    elif command_exists brew; then
        echo -e "${YELLOW}Installing Redis (optional)...${NC}"
        brew install redis
        brew services start redis
    fi
    
    # Create database if it doesn't exist
    if ! psql -lqt | cut -d \| -f 1 | grep -qw musicdesk; then
        echo -e "${YELLOW}Creating musicdesk database...${NC}"
        createdb musicdesk
    fi
    
    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install
    
    # Setup database
    echo -e "${YELLOW}Setting up database schema...${NC}"
    cd packages/database
    DATABASE_URL="postgresql://$(whoami):@localhost:5432/musicdesk" pnpm prisma db push
    
    # Seed database
    echo -e "${YELLOW}Seeding database with sample data...${NC}"
    DATABASE_URL="postgresql://$(whoami):@localhost:5432/musicdesk" pnpm run db:seed
    cd ../..
    
    # Start development server
    echo -e "${GREEN}🚀 Starting MusicDesk development server...${NC}"
    echo ""
    echo -e "${BLUE}Access your platform at: ${NC}http://localhost:3000"
    echo -e "${BLUE}Admin login: ${NC}admin@musicdesk.dev / admin123!"
    echo ""
    
    cd apps/web
    pnpm dev
}

# Function to start Docker setup
start_docker() {
    echo -e "${BLUE}🐳 Docker Setup Mode${NC}"
    echo ""
    
    # Check if Docker is available
    if ! command_exists docker; then
        echo -e "${RED}❌ Docker not found. Installing...${NC}"
        brew install --cask docker
        echo -e "${YELLOW}⚠️  Please start Docker Desktop and run this script again${NC}"
        open -a Docker
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker not running. Please start Docker Desktop${NC}"
        open -a Docker
        echo -e "${YELLOW}Waiting for Docker to start...${NC}"
        sleep 10
    fi
    
    echo -e "${YELLOW}Building and starting all services...${NC}"
    docker compose up --build
}

# Main logic
echo -e "${BLUE}Choose setup method:${NC}"
echo "1. 🐳 Docker (Recommended - Full containerized setup)"
echo "2. 💻 Manual (Local PostgreSQL + Redis)"
echo "3. 🔧 Auto-detect best option"
echo ""

# Auto-detect if no input provided
if [ -t 0 ]; then
    read -p "Enter choice (1-3, default: 3): " choice
else
    choice=3
fi

case ${choice:-3} in
    1)
        start_docker
        ;;
    2)
        start_manual
        ;;
    3)
        echo -e "${YELLOW}🔍 Auto-detecting best setup...${NC}"
        if command_exists docker && docker info >/dev/null 2>&1; then
            echo -e "${GREEN}Docker detected and running, using Docker setup${NC}"
            start_docker
        else
            echo -e "${YELLOW}Docker not available, using manual setup${NC}"
            start_manual
        fi
        ;;
    *)
        echo -e "${RED}Invalid choice. Using manual setup.${NC}"
        start_manual
        ;;
esac