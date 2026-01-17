-- Live Protest Finder Database Schema
-- PostgreSQL 14+

-- Drop tables if they exist (for development)
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS streams CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TYPE IF EXISTS platform_type;
DROP TYPE IF EXISTS stream_status;

-- Custom Types
CREATE TYPE platform_type AS ENUM ('youtube', 'twitch', 'rumble', 'x');
CREATE TYPE stream_status AS ENUM ('LIVE', 'ENDED', 'UPCOMING', 'REMOVED');

-- Channels Table
-- Stores the identity of broadcasters across platforms
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform platform_type NOT NULL,
    platform_channel_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    trust_score DECIMAL(3, 2) DEFAULT 0.50 CHECK (trust_score >= 0.00 AND trust_score <= 1.00),
    subscriber_count INTEGER DEFAULT 0,
    account_created_at TIMESTAMP WITH TIME ZONE,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    last_live_at TIMESTAMP WITH TIME ZONE,
    polling_priority VARCHAR(20) DEFAULT 'medium' CHECK (polling_priority IN ('high', 'medium', 'low', 'dead')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(platform, platform_channel_id)
);

CREATE INDEX idx_channels_platform ON channels(platform);
CREATE INDEX idx_channels_trust_score ON channels(trust_score DESC);
CREATE INDEX idx_channels_polling ON channels(polling_priority, last_scraped_at);

-- Streams Table
-- The central entity representing a live or archived broadcast
CREATE TABLE streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    platform_stream_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    embed_url TEXT,
    status stream_status DEFAULT 'LIVE',
    viewer_count INTEGER DEFAULT 0,
    peak_viewer_count INTEGER DEFAULT 0,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    keywords JSONB DEFAULT '[]'::jsonb,
    matched_keywords TEXT[],
    geo_city VARCHAR(100),
    geo_region VARCHAR(100),
    geo_country VARCHAR(100),
    geo_coordinates POINT, -- Stored but NEVER exposed to API
    language VARCHAR(10),
    report_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id, platform_stream_id)
);

-- Compound index for the "Live Now" feed (most critical query)
CREATE INDEX idx_streams_live_rank ON streams(status, viewer_count DESC) WHERE status = 'LIVE' AND is_hidden = FALSE;

-- Index for the "Recently Live" feed
CREATE INDEX idx_streams_recent ON streams(status, end_time DESC) WHERE status = 'ENDED' AND is_hidden = FALSE;

-- GIN Index for full-text search on titles
CREATE INDEX idx_streams_title_search ON streams USING GIN(to_tsvector('english', title));

-- Index for keyword matching
CREATE INDEX idx_streams_keywords ON streams USING GIN(keywords);

-- Index for geographic queries
CREATE INDEX idx_streams_geo ON streams(geo_city, geo_country) WHERE status = 'LIVE';

-- Index for moderation
CREATE INDEX idx_streams_reports ON streams(report_count) WHERE report_count > 0;

-- User Follows Table
-- Supports the MVP feature for pinning channels (device-based, no auth)
CREATE TABLE user_follows (
    user_device_id VARCHAR(255) NOT NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    notification_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_device_id, channel_id)
);

CREATE INDEX idx_user_follows_device ON user_follows(user_device_id);
CREATE INDEX idx_user_follows_channel ON user_follows(channel_id);

-- Stream Reports Table (for moderation)
CREATE TABLE stream_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
    reporter_device_id VARCHAR(255),
    reason VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(stream_id, reporter_device_id)
);

CREATE INDEX idx_stream_reports_stream ON stream_reports(stream_id);

-- API Usage Tracking (for quota management)
CREATE TABLE api_usage_log (
    id BIGSERIAL PRIMARY KEY,
    platform platform_type NOT NULL,
    endpoint VARCHAR(100),
    quota_units_consumed INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_api_usage_platform_date ON api_usage_log(platform, created_at);

-- Seed Channels Table (curated high-trust channels for RSS monitoring)
CREATE TABLE seed_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
    added_by VARCHAR(100) DEFAULT 'system',
    category VARCHAR(50), -- 'journalist', 'news_org', 'activist', 'verified'
    priority INTEGER DEFAULT 1, -- Higher = check more frequently
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(channel_id)
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View for Active Streams (convenience)
CREATE VIEW active_streams AS
SELECT
    s.*,
    c.platform,
    c.display_name as channel_name,
    c.avatar_url as channel_avatar,
    c.trust_score
FROM streams s
JOIN channels c ON s.channel_id = c.id
WHERE s.status = 'LIVE' AND s.is_hidden = FALSE
ORDER BY s.viewer_count DESC;

-- View for Recent Streams
CREATE VIEW recent_streams AS
SELECT
    s.*,
    c.platform,
    c.display_name as channel_name,
    c.avatar_url as channel_avatar,
    c.trust_score
FROM streams s
JOIN channels c ON s.channel_id = c.id
WHERE s.status = 'ENDED' AND s.is_hidden = FALSE
ORDER BY s.end_time DESC;

-- Daily Quota Reset Function (to be called by cron)
CREATE OR REPLACE FUNCTION reset_daily_quota_counters()
RETURNS void AS $$
BEGIN
    -- This is a placeholder for any daily cleanup
    -- The actual quota tracking is done in Redis for performance
    DELETE FROM api_usage_log WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE channels IS 'Broadcaster identities across all platforms';
COMMENT ON TABLE streams IS 'Live and archived stream metadata';
COMMENT ON TABLE user_follows IS 'Device-based channel subscriptions (no auth required)';
COMMENT ON TABLE api_usage_log IS 'Tracks API consumption for quota management';
COMMENT ON COLUMN channels.trust_score IS 'Calculated trust metric (0.0-1.0) based on account age, subscribers, and history';
COMMENT ON COLUMN streams.geo_coordinates IS 'NEVER expose this to API - for internal moderation only';
