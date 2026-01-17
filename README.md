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

## Two Versions Available

### 1️⃣ **Standalone Version** (Easiest - START HERE!)

**Just HTML + JavaScript - Works instantly**

✅ Double-click to open
✅ Add any stream URL (YouTube, Twitch, Facebook, etc.)
✅ Save streams to your list
✅ Everything stored in browser
✅ No installation required

**Perfect for:**
- Quick stream monitoring
- OBS users
- Anyone who wants simplicity
- No technical knowledge needed

📂 **Location**: `standalone/` folder
📖 **Guide**: [standalone/README.md](./standalone/README.md)

---

### 2️⃣ **Full System** (Advanced Features)

**Automated stream discovery with backend**

✅ Auto-discovers protest streams on YouTube & Twitch
✅ Search and filter by keywords
✅ Platform integration (APIs)
✅ Database of streams
✅ Docker deployment

**Perfect for:**
- Automated monitoring
- Large-scale aggregation
- Developers who want the full system

📖 **Guide**: See [Full System Setup](#full-system-setup-advanced) below

---

## Quick Comparison

| Feature | Standalone | Full System |
|---------|------------|-------------|
| **Setup Time** | 10 seconds | 20 minutes |
| **Installation** | None | Docker required |
| **Add Streams** | Manual URLs | Auto-discovery + Manual |
| **Best For** | Individuals, OBS | Organizations, Automation |
| **Cost** | FREE | FREE |
| **Technical Level** | Anyone | Basic computer skills |

**95% of users should use the Standalone version!**

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

## Full System Setup (Advanced)

*Only needed if you want automated stream discovery*

<details>
<summary><b>Click to expand full setup instructions</b></summary>

### Prerequisites
- Docker Desktop
- YouTube Data API key
- Twitch API credentials

### Setup Steps

1. **Install Docker Desktop**
   - Mac: [Download](https://desktop.docker.com/mac/main/amd64/Docker.dmg)
   - Windows: [Download](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)

2. **Get API Keys**
   - YouTube: https://console.cloud.google.com/apis/credentials
   - Twitch: https://dev.twitch.tv/console/apps

3. **Run Setup Script**
   ```bash
   # Mac/Linux
   chmod +x setup.sh
   ./setup.sh

   # Windows
   .\setup.bat
   ```

4. **Access the App**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Features
- Auto-discovers YouTube & Twitch protest streams
- Search by keywords and location
- Platform filtering
- Trust scoring
- Stream archival

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

</details>

---

## 🆘 Need Help?

1. **Check the README** - Most answers are here
2. **Standalone issues** - See [standalone/README.md](./standalone/README.md)
3. **Full system issues** - See [QUICK_START.md](./QUICK_START.md)
4. **Still stuck?** - Open a GitHub issue

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
