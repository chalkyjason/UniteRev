# Live Protest Finder

A multi-platform live stream aggregation engine with a **multi-stream viewer dashboard**. Watch multiple protest streams simultaneously from YouTube, Twitch, Rumble, and X (Twitter) in a customizable grid layout.

## 🎬 Multi-Stream Viewer

The flagship feature is a **professional-grade multi-stream dashboard** that allows you to:

- 📺 **Display multiple streams** in customizable grid layouts (1x1 to 4x4)
- 🔊 **Single audio source** - Play audio from ONE stream with visual indicator
- 🔴 **Red border highlight** around the active audio stream
- 🎯 **Stream management** - Search, filter, and organize live streams
- 📱 **Responsive design** - Works on desktop, tablet, and mobile

### Grid Layouts Available

`1x1` • `1x2` • `2x1` • `2x2` • `2x3` • `3x2` • `3x3` • `4x2` • `2x4` • `4x4`

Perfect for monitoring multiple protests, rallies, or events simultaneously!

## Architecture Overview

This system implements a **Connector-based microservices pattern** with four key components:

1. **Platform Connectors** - Handles API interactions for YouTube, Twitch, etc.
2. **Smart Polling Engine** - Optimizes API usage with dual-loop strategy (Discovery + Liveness)
3. **RESTful API** - Exposes normalized stream data to client applications
4. **Multi-Stream Viewer** - React-based dashboard for viewing multiple streams

### Key Features

#### Backend
- ✅ **YouTube Integration** with RSS backdoor (0 API cost) and batch validation
- ✅ **Twitch Integration** with Helix API and category filtering
- ✅ **Smart Quota Management** - Stays within free API limits
- ✅ **Real-time Updates** - Sub-minute latency for stream status
- ✅ **Privacy-First** - City-level geo-tagging only (no precise coordinates)
- ✅ **Trust Scoring** - Channel verification based on age, subscribers, and history

#### Frontend
- ✅ **Multi-Stream Grid** - Display 1-16 streams simultaneously
- ✅ **Smart Audio** - Single audio source with red border indicator
- ✅ **Stream Browser** - Search, filter, and select streams
- ✅ **Persistent State** - Your layout and selections are saved
- ✅ **Platform Color Coding** - Visual distinction for each platform

## Technical Stack

### Backend
- **FastAPI** - REST API framework
- **PostgreSQL 14** - Primary database
- **Redis** - Caching and queue management
- **Celery** - Background task processing
- **asyncio** - Async I/O for API calls

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Zustand** - State management
- **React Player** - Multi-platform video player
- **Axios** - HTTP client
- **Nginx** - Production web server

### Connectors
- **YouTube Data API v3** (10k quota/day)
- **Twitch Helix API** (800 req/min)
- **RSS/Atom feeds** (unlimited, free)

## Project Structure

```
UniteRev/
├── frontend/             # React Multi-Stream Viewer
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── StreamGrid.jsx       # Multi-stream display
│   │   │   ├── GridLayoutSelector.jsx  # Layout chooser
│   │   │   └── StreamSelector.jsx   # Stream picker modal
│   │   ├── store/        # Zustand state management
│   │   ├── api/          # Backend API integration
│   │   └── App.jsx       # Main application
│   ├── package.json      # Node dependencies
│   └── Dockerfile        # Frontend container
├── backend/
│   ├── api/              # FastAPI application
│   │   ├── main.py       # Entry point
│   │   └── routes/       # API endpoints
│   ├── connectors/       # Platform-specific connectors
│   │   ├── base.py       # Abstract connector class
│   │   ├── youtube.py    # YouTube connector
│   │   └── twitch.py     # Twitch connector
│   ├── models/           # Data models
│   │   ├── stream.py     # Normalized stream model
│   │   ├── channel.py    # Channel model
│   │   └── database.py   # Database manager
│   ├── workers/          # Background workers
│   │   ├── celery_app.py # Celery configuration
│   │   └── tasks.py      # Discovery & Liveness loops
│   └── requirements.txt  # Python dependencies
├── config/
│   └── database.sql      # Database schema
├── docker-compose.yml    # Container orchestration
└── README.md             # This file
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- YouTube Data API key ([Get one here](https://console.cloud.google.com/apis/credentials))
- Twitch API credentials ([Register app here](https://dev.twitch.tv/console/apps))

### Setup

1. **Clone the repository**
   ```bash
   cd UniteRev
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec postgres psql -U lpfuser -d liveprotestfinder -f /docker-entrypoint-initdb.d/init.sql
   ```

5. **Verify the services**
   ```bash
   curl http://localhost:8000/health
   ```

6. **Access the applications**
   - **Multi-Stream Viewer**: `http://localhost:3000`
   - **API Backend**: `http://localhost:8000`
   - **API Documentation**: `http://localhost:8000/docs`

### Using the Multi-Stream Viewer

1. Open `http://localhost:3000` in your browser
2. Click **"Select Streams"** to browse available live streams
3. Choose streams and add them to your grid
4. Select your preferred grid layout (2x2, 3x3, 4x4, etc.)
5. **Click any stream** to activate its audio (red border will appear)
6. Your layout and stream selections are automatically saved!

## API Endpoints

### Feed Endpoints

```http
GET /api/v1/feed/live
```
Returns currently live streams with optional filtering.

**Parameters:**
- `keywords` (optional) - Comma-separated keywords
- `platform` (optional) - Filter by platform (youtube, twitch)
- `sort` (optional) - Sort by relevance or viewers
- `limit` (default: 50) - Results per page
- `offset` (default: 0) - Pagination offset

**Example:**
```bash
curl "http://localhost:8000/api/v1/feed/live?keywords=protest,rally&limit=10"
```

```http
GET /api/v1/feed/recent
```
Returns recently ended streams.

### Channel Endpoints

```http
GET /api/v1/channels/search?q=<query>
```
Search for channels by name.

```http
GET /api/v1/channels/{channel_id}
```
Get detailed channel information.

### User Endpoints

```http
POST /api/v1/user/follow
```
Follow a channel (device-based).

**Body:**
```json
{
  "device_id": "unique-device-id",
  "channel_id": "channel-uuid"
}
```

```http
GET /api/v1/user/following/{device_id}
```
Get followed channels for a device.

### Submission Endpoint

```http
POST /api/v1/submit
```
Submit a Rumble or other platform URL for verification.

## Quota Management

### YouTube (10,000 units/day)

- **Search** (100 units) - Every 30 minutes = 4,800 units/day
- **Batch Validation** (1 unit per 50 videos) - Scales to 500 concurrent streams
- **RSS Monitoring** (0 units) - Unlimited channel monitoring

**Strategy:** The system prioritizes RSS feeds for discovery and reserves search quota for finding unknown streamers.

### Twitch (800 requests/minute)

- **Category Scan** - Every 5 minutes
- **Liveness Check** - Every 1 minute
- **Circuit Breaker** - Auto-pauses at safety threshold (50 remaining)

## Background Workers

Three Celery workers handle different responsibilities:

1. **Discovery Loop** (Slow, Expensive)
   - YouTube: Every 30 minutes
   - Twitch: Every 5 minutes
   - Finds new streams

2. **Liveness Loop** (Fast, Cheap)
   - YouTube: Every 2 minutes
   - Twitch: Every 1 minute
   - Updates viewer counts and status

3. **Maintenance Tasks**
   - Daily quota reset
   - Channel priority updates
   - Stream archival

## Database Schema

### Core Tables

- **channels** - Broadcaster identities across platforms
- **streams** - Live and archived stream metadata
- **user_follows** - Device-based channel subscriptions
- **stream_reports** - Content moderation
- **api_usage_log** - Quota tracking

See `config/database.sql` for full schema.

## Privacy & Safety

### Privacy Features
- **Geo-Privacy**: Only city-level location data exposed (never precise coordinates)
- **No Authentication**: Device-based IDs prevent user tracking
- **No Data Retention**: PII is never stored

### Safety Features
- **Auto-Hide**: Streams with >5 reports automatically hidden
- **PII Filter**: Regex blocklist prevents doxxing
- **Trust Scores**: Channel verification based on multiple signals

## Development

### Run locally without Docker

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Start PostgreSQL and Redis**
   ```bash
   docker-compose up postgres redis -d
   ```

3. **Run the API**
   ```bash
   uvicorn api.main:app --reload
   ```

4. **Run Celery workers**
   ```bash
   celery -A workers.celery_app worker --loglevel=info
   celery -A workers.celery_app beat --loglevel=info
   ```

### Testing

```bash
pytest backend/tests/
```

## Deployment

### Production Checklist

- [ ] Set strong `POSTGRES_PASSWORD` in docker-compose.yml
- [ ] Configure `CORS_ORIGINS` for your frontend domain
- [ ] Set up SSL/TLS (use nginx reverse proxy)
- [ ] Enable PostgreSQL backups
- [ ] Configure log aggregation (e.g., ELK stack)
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Request YouTube quota increase if needed

### Estimated Costs

- **Compute**: $10-20/month (DigitalOcean Droplet or AWS t3.small)
- **Database**: $0 (self-hosted) or $7/month (managed)
- **Redis**: $0 (self-hosted) or $5/month (managed)
- **APIs**: $0 (free tiers sufficient for MVP)

**Total: ~$7-32/month**

## Roadmap

### Phase 1: MVP (Complete)
- [x] YouTube integration with RSS backdoor
- [x] Twitch integration with Helix API
- [x] Smart polling engine
- [x] RESTful API
- [x] Docker deployment

### Phase 2: Enhancement
- [ ] Mobile app (React Native)
- [ ] Push notifications for followed channels
- [ ] Advanced keyword filtering
- [ ] Geographic filtering

### Phase 3: X (Twitter) Integration
- [ ] Allowlist monitoring
- [ ] Signal-based discovery

### Phase 4: Rumble Integration
- [ ] User submission system
- [ ] HTML parsing validation

## Contributing

This is a solo builder project. For suggestions or bug reports, please open an issue.

## License

MIT License - See LICENSE file for details

## Acknowledgments

Built according to the technical specification: "Multi-Platform Live Protest Discovery Engine"

---

**Security Note:** This tool is designed for transparency and situational awareness. Always respect local laws and platform Terms of Service when deploying.
