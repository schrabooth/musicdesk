-- Initialize MusicDesk PostgreSQL Database
-- This script runs when the PostgreSQL container is first created

-- Create database if it doesn't exist (this should already be handled by POSTGRES_DB)
-- But we can create additional databases if needed

-- Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create a schema for analytics data
-- CREATE SCHEMA IF NOT EXISTS analytics;

-- Set timezone
SET timezone = 'UTC';

-- Performance tuning for development
-- These settings are optimized for development, not production
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Log slow queries (useful for development)
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries taking more than 1 second
ALTER SYSTEM SET log_statement = 'mod'; -- Log all modification statements

-- Restart required for these settings to take effect
-- But they'll be available on container restart