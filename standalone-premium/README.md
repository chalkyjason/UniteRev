# AntifaTimes Stream Manager

Multi-platform live stream viewer with multi-monitor support, drag-and-drop reordering, and streamer management.

## Features

### Core Features
- **Multi-Stream Grid**: Watch up to 16 streams simultaneously in customizable grid layouts (1×1 to 4×4)
- **Drag-and-Drop Reordering**: Click and drag the `⋮⋮` handle to reorder streams
- **Custom Stream Sizing**: Resize individual streams from 1×1 to 4×4 grid cells
- **Multi-Monitor Support**: Control panel opens in a separate window for dual-monitor setups
- **Streamer Management**: Save and organize streamers/channels, not just individual streams
- **Platform Detection**: Automatically extracts channel info from Twitch, YouTube, and more
- **Audio Control**: Switch audio between streams without stopping playback
- **Zero Backend**: Everything runs client-side using browser localStorage

### New in This Version
🔍 **Stream Scanner**: NEW! Find live streams by keywords - PREMIUM: 500 keywords, 1000 results, faster scanning!
✨ **Drag & Drop**: Reorder streams by dragging the `⋮⋮` handle
💾 **Save Streamers**: Save streamer/channel info instead of just stream URLs
🔍 **Smart Detection**: YouTube oEmbed integration auto-detects channel names
🎯 **Platform Icons**: Visual platform indicators (💜 Twitch, ▶️ YouTube, etc.)
📌 **Save from Grid**: Click the 💾 button on any active stream to save that streamer

### Premium Benefits
⭐ **Enhanced Scanner**: 500 keywords (vs 50 free), 1000 results (vs 100 free), faster scanning (30s minimum vs 60s)
⭐ **Unlimited Streamers**: No limit on saved streamers
⭐ **All Features**: All current and future features included

## Quick Start

### Easy Launch (One-Click)

**Just double-click the launcher for your platform:**

- **macOS**: Double-click `launch.command` (best for Mac)
  - If you get a security warning, see "macOS Security" below
  - Alternative: Use `launch.sh` (right-click → Open → Open)
- **Linux**: Double-click `launch.sh` (or run `./launch.sh` in terminal)
- **Windows**: Double-click `launch.bat`

This will:
- ✅ Start the local server
- ✅ Automatically open your browser to the app
- ✅ You're ready to add streams!

### macOS Security Warning

If you see **"launch.sh Not Opened"** warning on macOS:

**Option 1: Use launch.command** (Recommended)
- Double-click `launch.command` instead
- macOS treats `.command` files as trusted

**Option 2: Right-Click Method**
- Right-click `launch.sh` → Choose "Open" → Click "Open" in the dialog
- This bypasses Gatekeeper for that file

**Option 3: Remove Quarantine** (Terminal)
```bash
cd standalone
xattr -d com.apple.quarantine launch.sh
./launch.sh
```

This is normal macOS security - the files are safe, just not signed with an Apple Developer certificate.

### Manual Start

If you prefer to start manually:

1. **Run the server** (required for proper embedding):
   ```bash
   # Linux/Mac
   ./start-server.sh

   # Windows
   start-server.bat
   ```

2. **Open your browser**:
   ```
   http://localhost:8000
   ```
   (If port 8000 is in use, the script will auto-detect the next available port)

### Using the App

1. **Add streams**:
   - Click any empty slot or the "Add Stream" button
   - Enter stream name and URL (YouTube, Twitch, Facebook, Rumble)
   - Optionally check "Save streamer to my list" to save the streamer/channel
   - Click "Add to Grid"

4. **Open Control Panel** (for multi-monitor setup):
   - Click "🎮 Open Control Panel" button
   - Move control panel to your second monitor
   - Add/remove streams and control audio from the panel

## Supported Platforms

| Platform | URL Format | Example |
|----------|-----------|---------|
| **YouTube** | `youtube.com/watch?v=ID`<br>`youtube.com/live/ID`<br>`youtube.com/@channel` | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| **Twitch** | `twitch.tv/channel` | `https://twitch.tv/hasanabi` |
| **X (Twitter)** | `x.com/user/status/ID`<br>`twitter.com/user/status/ID` | `https://x.com/user/status/123456` |
| **TikTok** | `tiktok.com/@user/video/ID`<br>`tiktok.com/@user/live` | `https://www.tiktok.com/@user/video/123456`<br>`https://www.tiktok.com/@user/live` |
| **Facebook Live** | `facebook.com/username/videos/ID` | `https://www.facebook.com/user/videos/123456` |
| **Rumble** | `rumble.com/video-id` | `https://rumble.com/v12345-video-title.html` |

## How to Use

### Adding Streams

1. **Quick Add**: Click an empty grid slot → Enter name and URL → Add
2. **From Control Panel**: Use the "Add Stream" form in the control panel
3. **From Saved Streamers**: Click "Use" on any saved streamer

### Managing Streamers

**What's a "Streamer" vs "Stream"?**
- **Stream**: A single video/live URL (e.g., specific YouTube video)
- **Streamer**: The channel/account itself (e.g., YouTube channel, Twitch user)

**Saving Streamers**:
- Check "Save streamer to my list" when adding a stream
- Or click the 💾 button on any active stream tile
- YouTube videos automatically resolve to the channel name using oEmbed

**Using Saved Streamers**:
- Open the "Add Stream" modal
- Scroll to "💾 My Saved Streamers"
- Click "Use" to add the streamer's profile/channel URL to the grid

**Platform Info**:
- Saved streamers show platform emoji and handle
- Example: `💜 hasanabi` (twitch · hasanabi)

### Reordering Streams (Drag & Drop)

1. Hover over any stream tile
2. Click and hold the `⋮⋮` drag handle (top-left corner)
3. Drag the stream to a new position
4. Release to drop

**Tips**:
- Only the drag handle (`⋮⋮`) is draggable - clicking elsewhere won't drag
- Empty slots cannot be dragged
- Reordering preserves custom sizes and audio selection

### Resizing Streams

Each stream has size buttons in the top-right corner:
- **1×1**: Standard single cell
- **2×1, 1×2**: Two cells wide or tall
- **2×2**: Four-cell square
- **3×1, 1×3, 3×2, 2×3**: Larger configurations
- **3×3, 4×4**: Massive tiles

**Tip**: Use large sizes for your main stream and smaller ones for context streams.

### Audio Control

**From Main Viewer**:
- Click any stream tile to toggle its audio
- Only one stream can have audio at a time
- Active audio stream has a red pulsing border
- Current audio source shown in bottom-left corner

**From Control Panel**:
- Scroll to "🔊 Audio Control" section
- Click any active stream to switch audio
- Active stream highlighted in green

**Important**: Audio switching does **not** reload the video - playback continues uninterrupted.

### Grid Layouts

Available layouts (from Control Panel):
- 1×1, 1×2, 2×1 (1-2 streams)
- 2×2 (4 streams)
- 2×3, 3×2 (6 streams)
- 3×3 (9 streams)
- 4×2, 2×4 (8 streams)
- 4×4 (16 streams)

Changing layouts preserves as many streams as possible. Streams beyond the new grid size are removed.

### Multi-Monitor Setup

1. Click "🎮 Open Control Panel"
2. Drag the control panel window to your second monitor
3. Keep the main viewer fullscreen on your primary monitor
4. Manage streams, audio, and layout from the control panel

**Synchronization**: Changes in the control panel instantly update the main viewer via localStorage events.

## Stream Scanner (PREMIUM ENHANCED!)

Discover live streams by keywords and trending topics across multiple platforms - with PREMIUM enhancements!

### Premium Advantages
⭐ **500 keywords** (vs 50 in free version)
⭐ **1,000 results** (vs 100 in free version)
⭐ **Faster scanning** (30-second minimum vs 60-second)
⭐ **All platforms unlocked**

### How to Use

1. **Open Scanner**:
   - Open the Control Panel
   - Click the **"🔍 Open Stream Scanner"** button in the Logo Header panel
   - Scanner opens in a new popup window

2. **Add Keywords** (up to 500!):
   - Type a keyword (e.g., "protest", "gaming", "cooking")
   - Press **Enter** to add it
   - Add multiple keywords to search for different topics
   - Click **×** on any tag to remove it

3. **Configure Settings**:
   - **Scan Interval**: How often to refresh (30s to 30min) - Premium can scan every 30s!
   - **Min. Viewers**: Only show streams with at least X viewers
   - Enable/disable specific platforms

4. **Start Scanning**:
   - Click **"🚀 Start Scanning"**
   - Results appear automatically
   - Streams update based on your interval
   - Click **⏸️ Stop Scanning** to pause

### Supported Platforms

| Platform | Icon | Description | Authentication |
|----------|------|-------------|----------------|
| **Twitch** | 🟣 | Gaming & IRL streams | Demo data (API key optional) |
| **YouTube** | 🔴 | YouTube Live | OAuth or API key recommended |
| **Kick** | 🟢 | Alternative streaming | Demo data only |
| **TikTok** | ⚫ | TikTok Live | Demo data only |

### YouTube Authentication

For real YouTube data (instead of demo):

**Option 1: OAuth Sign-In (Recommended)**
1. Get a Google OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. In Stream Scanner, click **⚙️ Configure** on YouTube plugin
3. Enter your Client ID and click **🔐 Sign In with Google**
4. Higher rate limits and real-time data!

**Option 2: API Key (Basic)**
1. Get a YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click **⚙️ Configure** on YouTube plugin
3. Enter your API key and click **Save API Key**

### Features

✅ **Multi-keyword search** - Up to 500 keywords (PREMIUM)
✅ **Auto-refresh** - Scan every 30 seconds (PREMIUM)
✅ **More results** - Up to 1,000 results (PREMIUM)
✅ **Live filtering** - Minimum viewer counts
✅ **Platform toggle** - Enable only the platforms you want
✅ **One-click watch** - Open streams directly
✅ **Authentication support** - Sign in to platforms for real data
✅ **Zero installation** - Pure client-side JavaScript
✅ **Modular plugins** - Easy to add/remove platforms

### Data Storage

Scanner settings are stored in localStorage:

| Key | Description |
|-----|-------------|
| `scanner_settings` | Keywords, intervals, min viewers |
| `youtube_auth` | YouTube OAuth credentials (if signed in) |
| `plugin_configs` | API keys and configuration per platform |

**Privacy**: All data stays on your computer. No external servers.

## Troubleshooting

### YouTube Error 153 / "This video can't be played"

YouTube requires proper HTTP referrer headers. **Solution**:
1. Run the local server (`start-server.sh` or `start-server.bat`)
2. Access via `http://localhost:PORT`, **not** `file://`
3. Some videos have embedding disabled by the uploader - nothing we can do

### Twitch "This embed is misconfigured"

Fixed automatically. The app handles all localhost variations (IPv6, IPv4) correctly.

### Port Already in Use

The start scripts auto-detect available ports. If port 8000 is in use, they'll try 8001, 8002, etc.

### Stream Not Loading

- Check if the URL is correct
- Verify the stream is actually live
- Try a different browser
- Check browser console for errors

### Saved Streamers Not Showing

- Old "Saved Streams" auto-migrate to "Saved Streamers" on first load
- If using multiple browsers/devices, streamers are stored per-browser (localStorage)

### Audio Not Switching

- Make sure you're clicking the stream tile, not just the overlay buttons
- Or use the Control Panel's "Audio Control" section
- Check browser console for errors

### Drag & Drop Not Working

- Make sure you're dragging from the `⋮⋮` handle (top-left of each stream)
- Empty slots cannot be dragged
- If SortableJS fails to load, check your internet connection

## Data Storage

All data is stored in browser localStorage:

| Key | Description |
|-----|-------------|
| `multistream_layout` | Current grid layout (e.g., "2x2") |
| `multistream_grid` | Array of active streams with positions and sizes |
| `multistream_streamers` | Array of saved streamer/channel objects |
| `multistream_audio` | Index of active audio stream |

**Data Format - Saved Streamer**:
```json
{
  "id": "twitch:hasanabi",
  "platform": "twitch",
  "handle": "hasanabi",
  "displayName": "HasanAbi",
  "profileUrl": "https://twitch.tv/hasanabi",
  "createdAt": 1234567890123
}
```

**Migration**: Old `multistream_saved` (stream URLs) automatically converts to `multistream_streamers` (streamer objects).

## Keyboard Shortcuts

- **Enter**: Submit stream form (when focused on input)
- **Escape**: Close modal
- **Ctrl/Cmd+R**: Reload viewer (from Control Panel's View menu)

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (limited due to iframe autoplay policies)

## Technical Details

### Platform Detection Logic

**Twitch**:
- Direct extraction from URL: `twitch.tv/CHANNEL`
- Saves as `twitch:CHANNEL`

**YouTube**:
- Video URLs (`/watch?v=`, `/live/`): Uses oEmbed API to resolve channel
- Channel URLs (`/@handle`, `/channel/ID`): Direct extraction
- Saves as `youtube:@handle` or `youtube:CHANNEL_ID`

**X (Twitter)**:
- Direct extraction from URL: `x.com/USERNAME/status/ID` or `twitter.com/USERNAME/status/ID`
- Extracts username from tweet URL
- Saves as `x:@USERNAME`
- Embeds using Twitter's iframe embed player with dark theme

**TikTok**:
- For videos: Extracts video ID from `/video/ID` format
- For lives: Extracts username from `/@username/live` format
- Uses TikTok oEmbed API to resolve user info
- Saves as `tiktok:@USERNAME`
- Videos embed using `tiktok.com/embed/v2/{videoId}`
- **Note**: TikTok Live streams have limited iframe support and may require opening in browser

**Others**:
- Falls back to basic URL parsing
- Saves as `unknown:timestamp`

### YouTube oEmbed

When you add a YouTube video URL with "Save streamer" checked:
1. Fetches `https://www.youtube.com/oembed?format=json&url=VIDEO_URL`
2. Extracts `author_name` (channel name) and `author_url` (channel URL)
3. Parses channel handle from `author_url`
4. Saves complete streamer metadata

**No API key required** - YouTube's oEmbed is public.

### SortableJS Integration

- **Library**: SortableJS v1.15.3 (CDN)
- **Handle**: `.drag-handle` (the `⋮⋮` element)
- **Draggable**: `.stream-cell:not(.empty-cell)`
- **Events**: Reorders `gridStreams` array on drag end, updates localStorage

## Architecture

- **Zero dependencies** (except SortableJS via CDN)
- **No build step** - pure HTML/CSS/JS
- **No backend** - localStorage for persistence
- **Cross-window sync** - `storage` events for Control Panel ↔ Viewer communication

## Files

- `index.html` - Main viewer interface
- `control-panel.html` - Multi-monitor control panel
- `app.js` - Core application logic
- `logo.svg` - AntifaTimes branding
- `start-server.sh` - Linux/Mac server script
- `start-server.bat` - Windows server script

## Advanced Tips

### Exporting/Importing Saved Streamers

**Export**:
```javascript
// In browser console:
console.log(localStorage.getItem('multistream_streamers'));
```
Copy the JSON output.

**Import**:
```javascript
// Paste your JSON data:
localStorage.setItem('multistream_streamers', '[...]');
location.reload();
```

### Clearing All Data

```javascript
localStorage.clear();
location.reload();
```

### Custom Layouts Beyond 4×4

Modify `app.js` → `loadState()` to support larger grids, but performance may degrade with too many simultaneous streams.

## Development

### Local Development

No build process needed - just edit the HTML/CSS/JS files directly.

### Testing

1. Start server: `./start-server.sh`
2. Open `http://localhost:8000`
3. Test multi-monitor: Open control panel, move to second window
4. Test drag & drop: Add 4+ streams, drag to reorder
5. Test streamers: Add YouTube video, click save streamer button

## License

MIT - See main repository LICENSE file

## Support

- Issues: https://github.com/chalkyjason/UniteRev/issues
- Pull Requests: Welcome!

## Credits

- **SortableJS**: https://github.com/SortableJS/Sortable
- **YouTube oEmbed**: https://developers.google.com/youtube/v3/docs/oembed
