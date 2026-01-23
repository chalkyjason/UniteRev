# Multi-Stream Manager 📺

**Watch multiple live streams at once - Works in your browser, no installation!**

![Multi-Stream Dashboard](https://img.shields.io/badge/streams-1--16-red) ![Platform](https://img.shields.io/badge/platform-Any%20Browser-blue)

---

## 🚀 **INSTANT START** (No Setup Needed!)

### The Standalone Version (Recommended)

**Just download and double-click - that's it!**

1. **Download** the `standalone` folder
2. **Double-click** `index.html`
3. **Start adding streams!**

✅ No installation
✅ No Docker
✅ No API keys
✅ No coding
✅ Works on **any computer**

👉 **[Go to standalone folder](./standalone/)** to get started!

---

## What Can You Do?

- 📺 **Watch 1-16 streams** at once (multiple grid layouts)
- 🔊 **Single audio source** - Click any stream to hear it
- 🔴 **Red border highlight** around the stream with sound
- 💾 **Save your streams** - Build a collection of URLs
- 🎯 **Perfect for OBS** - Add as browser source

**Use Cases:**
- Monitor multiple protest streams
- Keep an eye on your own stream + chat + alerts
- Watch different camera angles
- Compare multiple sources
- Research and documentation

---

## ✨ Features

### **Standalone Version** (Free & Simple!)

**Just HTML + JavaScript - Works instantly**

✅ Double-click to open (or run local server for YouTube)
✅ Add any stream URL (YouTube, Twitch, Facebook, Rumble, etc.)
✅ Save streams to your list
✅ Everything stored in browser
✅ No installation required
✅ Multi-monitor control panel
✅ **NEW: Stream Scanner** - Find live streams by keywords across platforms

**Perfect for:**
- Quick stream monitoring
- OBS users
- Anyone who wants simplicity
- Streamers managing multiple feeds
- Discovering new streams by topic or keyword
- No technical knowledge needed

📂 **Location**: `standalone/` folder
📖 **Guide**: [standalone/README.md](./standalone/README.md)

### **Premium Version** (Optional Upgrade)

Upgrade for more features and support development:

✅ Up to 16 streams (vs 4 in free)
✅ Unlimited saved streams (vs 10 in free)
✅ All grid layouts unlocked
✅ Priority support
✅ One-time payment ($9.99)

📂 **Location**: `standalone-premium/` folder
📖 **Guide**: [QUICK_START_SELLING.md](./QUICK_START_SELLING.md)

---

## 🎬 How to Use (Standalone)

### Step 1: Open the App
```
Double-click: standalone/index.html
```

### Step 2: Add a Stream
1. Click **"+ Add Stream"**
2. Enter a name: "My Stream"
3. Paste URL: `https://www.youtube.com/watch?v=...`
4. Click **"Add to Grid"**

### Step 3: Choose Grid Layout
- **2×2** = 4 streams (recommended)
- **3×3** = 9 streams
- **4×4** = 16 streams (maximum)
- Plus more: 1×1, 1×2, 2×1, 2×3, 3×2, 4×2, 2×4

### Step 4: Control Audio
- **Click any stream** to activate audio
- **Red border** appears on active stream
- Click another to switch

**Your settings auto-save in the browser!**

---

## 🔍 Stream Scanner (NEW!)

**Discover live streams by keywords and trending topics**

### What is it?
The Stream Scanner helps you find live streams across multiple platforms based on keywords you're interested in. Perfect for finding new content, monitoring topics, or discovering streamers.

### Where to Find It:
There are **TWO ways** to open the Stream Scanner:

**Option 1: From Main Viewer** (Easiest!)
1. Open `index.html` (the main stream viewer)
2. Look at the top-right corner
3. Click the **"🔍 Stream Scanner"** button
4. Scanner opens in a new window!

**Option 2: From Control Panel**
1. Open the Control Panel (click "🎮 Open Control Panel")
2. Find the Logo Header panel (top-left)
3. Click **"🔍 Open Stream Scanner"** button

**Option 3: Direct Access**
- Just open `scanner.html` directly in your browser!

### How to Use:
1. Add keywords (e.g., "protest", "gaming", "music")
2. Press **Enter** after each keyword
3. Configure scan interval and minimum viewers
4. Click **"🚀 Start Scanning"**
5. Watch live streams appear automatically!

### Supported Platforms:
- **🟣 Twitch** - Live gaming and IRL streams
- **🔴 YouTube** - YouTube Live broadcasts (OAuth or API key)
- **🟢 Kick** - Alternative streaming platform
- **⚫ TikTok** - TikTok Live streams

### Features:
✅ **Multi-keyword scanning** - Add unlimited keywords
✅ **Auto-refresh** - Configurable scan intervals (30s to 30min)
✅ **Filter by viewers** - Set minimum viewer count
✅ **Enable/disable platforms** - Choose which platforms to scan
✅ **Live status badges** - See which streams are currently live
✅ **One-click watch** - Open streams directly in new tab

### YouTube & Twitch Authentication:

**For Scanner (Finding Streams):**
- **YouTube**: Click **⚙️ Configure** on YouTube plugin
  - Option 1: Sign in with Google OAuth (recommended)
  - Option 2: Enter API Key for basic access
  - Get credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Twitch**: Click **⚙️ Configure** on Twitch plugin
  - Enter Client ID from [Twitch Developer Console](https://dev.twitch.tv/console)

**For Control Panel (Chat Monitoring):**
- **YouTube Chat**: Click "Login YouTube" button
  - Provide OAuth Client ID (same as scanner)
  - Enter live video URL to monitor
  - Real-time chat messages appear in unified feed
- **Twitch Chat**: Click "Login Twitch" button
  - Get OAuth token from [TwitchApps TMI](https://twitchapps.com/tmi/)
  - Enter channels to monitor (comma-separated)
  - Real-time chat messages appear in unified feed

**No installation required - works instantly!**

---

## Supported Platforms

Works with any embeddable video:

✅ **YouTube** - `https://youtube.com/watch?v=VIDEO_ID`
✅ **Twitch** - `https://twitch.tv/CHANNEL`
✅ **Facebook Live** - `https://facebook.com/video.php?v=...`
✅ **Any embed URL** - Just paste it!

---

## Browser Requirements

| Browser | Support |
|---------|---------|
| Chrome | ✅ Excellent |
| Edge | ✅ Excellent |
| Firefox | ✅ Good |
| Safari | ⚠️ Limited |
| Brave | ✅ Excellent |

**Recommended**: Chrome or Edge for best compatibility

---

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 2GB | 8GB |
| **Internet** | 10 Mbps | 25+ Mbps |
| **Browser** | Chrome 90+ | Latest version |
| **Screen** | 1280×720 | 1920×1080+ |

**More streams = More RAM & bandwidth**

---

## 💡 Pro Tips

### For Best Performance:
- ✅ Start with **2×2 layout** on laptops
- ✅ Use **Chrome** for best compatibility
- ✅ Close unnecessary tabs
- ✅ Strong internet connection (10 Mbps per stream)

### For OBS Users:
1. Add **Browser Source** in OBS
2. Point to: `file:///path/to/standalone/index.html`
3. Set resolution to match your scene
4. Click streams to control audio

### Saving Streams:
- Check **"Save to my stream list"** when adding
- Reuse saved streams anytime
- Click **"Use"** from your saved list
- Everything persists in browser storage

---

## ❓ Troubleshooting

### Can't open the file?
- Make sure you're double-clicking `index.html`
- Try right-click → Open With → Chrome
- Check the file downloaded completely

### Stream won't load?
- Verify the URL is correct
- Check if it's a LIVE stream (not recorded)
- Some platforms block embedding
- Try opening the URL directly first

### Audio not working?
- Click the stream to activate audio
- Only ONE stream plays audio at a time
- Check browser isn't muted
- Some streams don't have audio tracks

### Grid looks wrong?
- Click a different layout button
- Refresh the page
- Try clearing browser cache

---

## 🛡️ Privacy & Security

- ✅ **No data collection** - Everything stays on your computer
- ✅ **No accounts** - No login required
- ✅ **No tracking** - We don't know what you watch
- ✅ **No servers** - Runs entirely in your browser
- ✅ **Open source** - Inspect the code yourself

**100% Privacy-First!**

---

## 📜 License

**MIT License** - Free to use, modify, and share!

---

## 🆘 Need Help?

1. **Check the README** - Most answers are here
2. **Standalone version** - See [standalone/README.md](./standalone/README.md)
3. **YouTube Error 153** - See [standalone/TROUBLESHOOTING.md](./standalone/TROUBLESHOOTING.md)
4. **Premium version** - See [QUICK_START_SELLING.md](./QUICK_START_SELLING.md)
5. **Still stuck?** - Open a GitHub issue

---

## 🌟 Contributing

Found a bug? Have an idea? Pull requests welcome!

---

## 👥 Who Is This For?

- ✅ **Activists** - Monitor multiple protests
- ✅ **Journalists** - Compare sources
- ✅ **Streamers** - Watch your stream + chat
- ✅ **Researchers** - Document events
- ✅ **OBS Users** - Multi-view setup
- ✅ **Anyone** - Who wants to watch multiple streams!

**No coding experience needed!**

---

**Happy streaming! 📺🔴**

Start with the **[standalone version](./standalone/)** - it's the easiest!
