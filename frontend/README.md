# Live Protest Viewer - Frontend

Multi-stream viewer dashboard that allows you to watch multiple live protest streams simultaneously in a customizable grid layout.

## Features

### 🎬 Multi-Stream Grid View
- Display multiple live streams in a single view
- Customizable grid layouts: 1x1, 1x2, 2x1, 2x2, 2x3, 3x2, 3x3, 4x2, 2x4, 4x4
- Responsive design that adapts to any screen size

### 🔊 Smart Audio Control
- Play audio from only ONE stream at a time
- Click any stream to activate its audio
- **Red border highlight** around the active audio stream
- Animated corner indicators for visual feedback

### 🎯 Stream Management
- Browse all available live streams
- Search by title, channel name, or keywords
- Filter by platform (YouTube, Twitch, Rumble, X)
- Sort by viewers, recency, or channel name
- Add/remove streams to your grid

### 🎨 User Interface
- Dark theme optimized for viewing
- Platform-specific color coding
- Live viewer counts
- Stream metadata (title, channel, duration)
- Quick actions (external link, audio toggle, remove)

## Quick Start

### Installation

```bash
cd frontend
npm install
```

### Configuration

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your API endpoint:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm run preview
```

## Usage Guide

### 1. Select Grid Layout

Choose your preferred layout from the header:
- **1x1** - Single stream (full screen)
- **2x2** - Four streams (quad view)
- **3x3** - Nine streams (grid view)
- **4x4** - Sixteen streams (maximum density)
- And more...

### 2. Add Streams

Click **"Select Streams"** to open the stream picker:
1. Browse available live streams
2. Use search to find specific content
3. Filter by platform
4. Click checkboxes to add/remove streams
5. Click "Done" when finished

### 3. Control Audio

- **Click any stream** to activate its audio
- The active stream will have a **red border**
- Only one stream plays audio at a time
- Click again to mute

### 4. Stream Actions

Each stream has quick actions:
- **🔊/🔇** - Toggle audio
- **🔗** - Open in new tab
- **✕** - Remove from grid

## Technical Details

### Built With

- **React 18** - UI framework
- **Vite** - Build tool
- **Zustand** - State management
- **React Player** - Video playback
- **Axios** - HTTP client
- **Lucide React** - Icons

### Key Components

- `StreamGrid` - Main grid display with video players
- `GridLayoutSelector` - Layout chooser
- `StreamSelector` - Stream browser/picker modal
- `useStreamStore` - Global state management

### State Persistence

Your grid configuration is saved to localStorage:
- Selected streams
- Grid layout preference
- Active audio selection

## Audio Management

The app uses a smart audio system:

1. **Single Source**: Only one stream plays audio
2. **Visual Indicator**: Red border on active stream
3. **Auto-Mute**: All other streams are automatically muted
4. **Persistent**: Audio selection survives page refresh

### Technical Implementation

```javascript
// YouTube API
player.mute() / player.unMute()

// HTML5 Video
player.muted = true / false

// Twitch
Uses iframe controls
```

## Grid Layouts

| Layout | Streams | Best For |
|--------|---------|----------|
| 1×1    | 1       | Focus on one stream |
| 2×2    | 4       | Standard quad view |
| 3×3    | 9       | Comprehensive coverage |
| 4×4    | 16      | Maximum monitoring |
| 2×3    | 6       | Widescreen view |

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Performance

- Lazy loading for video players
- Efficient re-rendering with React
- Optimized for 4-16 concurrent streams
- Hardware acceleration for video

## Keyboard Shortcuts

*Coming soon*

- `1-9` - Select grid slot
- `Space` - Toggle audio
- `F` - Fullscreen
- `Esc` - Close modal

## Troubleshooting

### Videos not loading

1. Check backend API is running
2. Verify CORS configuration
3. Check browser console for errors
4. Ensure stream URLs are valid

### Audio not working

1. Click the stream to activate audio
2. Check browser audio permissions
3. Verify stream has audio track
4. Try refreshing the stream

### Performance issues

1. Reduce grid size (use 2x2 instead of 4x4)
2. Close other browser tabs
3. Update graphics drivers
4. Reduce video quality in stream settings

## Development

### Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── StreamGrid.jsx
│   │   ├── GridLayoutSelector.jsx
│   │   └── StreamSelector.jsx
│   ├── store/          # Zustand state
│   ├── api/            # API integration
│   └── App.jsx         # Main app
├── public/             # Static assets
└── index.html          # Entry point
```

### Adding Features

1. Create component in `src/components/`
2. Add styles in component `.css` file
3. Connect to store if needed
4. Import in `App.jsx`

## License

MIT

## Support

For issues and feature requests, please open a GitHub issue.
