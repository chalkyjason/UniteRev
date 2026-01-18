# Multi-Stream Manager 📺

**The simplest way to watch multiple streams at once - No installation required!**

Perfect for OBS users, streamers, or anyone who wants to monitor multiple streams simultaneously.

---

## ⚡ Quick Start

> **⚠️ IMPORTANT for YouTube Streams:** Run the local server to avoid Error 153!

### **RECOMMENDED: Run Local Server** (Works with YouTube)

**Mac/Linux:**
```bash
cd standalone
./start-server.sh
```
Then open: `http://localhost:8000/index.html`

**Windows:**
```cmd
cd standalone
start-server.bat
```
Then open: `http://localhost:8000/index.html`

**Why?** YouTube requires proper HTTP headers. The local server provides them, fixing "Error 153" issues.

---

### Alternative: Double-Click (Twitch/Facebook only)

⚠️ **YouTube will NOT work** with this method due to Error 153

1. Double-click `index.html`
2. Works for Twitch, Facebook, Rumble
3. YouTube videos will show "Error 153: Video player configuration error"

**For YouTube, use the local server method above!**

---

## 🎬 How to Use

### Add Your First Stream:

1. **Click "+ Add Stream"** (blue button top right)
2. **Enter a name**: "My Stream" or "Protest Feed"
3. **Paste the URL**: YouTube, Twitch, Facebook Live, etc.
4. **Click "Add to Grid"**

**Boom! Your stream appears in the grid** 🎉

### Supported Stream URLs:

✅ **YouTube**:
  - Regular: `https://www.youtube.com/watch?v=VIDEO_ID`
  - Live: `https://www.youtube.com/live/VIDEO_ID`
  - Short: `https://youtu.be/VIDEO_ID`

✅ **Twitch**: `https://www.twitch.tv/CHANNEL_NAME`

✅ **Facebook Live**: `https://www.facebook.com/video.php?v=...`

✅ **Rumble**: `https://rumble.com/VIDEO_NAME.html`

✅ **Any embed URL**: Just paste it!

**Note:** Some videos may have embedding disabled by the uploader. This is normal and cannot be bypassed.

### Grid Layouts:

Choose from **10 different layouts**:
- **1×1** - Single stream (fullscreen)
- **2×2** - 4 streams (quad view) - **Default**
- **3×3** - 9 streams
- **4×4** - 16 streams (maximum)
- Plus: 1×2, 2×1, 2×3, 3×2, 4×2, 2×4

Click the layout buttons at the top to change instantly!

### Audio Control:

🔊 **Click any stream** to activate its audio
- A **RED BORDER** appears around the active stream
- Only ONE stream plays audio at a time
- Click another stream to switch audio
- Click the same stream to mute

### Save Streams for Later:

1. When adding a stream, check **"Save to my stream list"**
2. Your stream appears in "My Saved Streams"
3. Click **"Use"** to add it to the grid anytime
4. Click **"Delete"** to remove from saved list

**Your saved streams persist forever** (stored in browser)

---

## 💡 Use Cases

### For Streamers (OBS Users):
- Monitor your own stream + chat + alerts
- Keep an eye on competitor streams
- Display multiple camera angles
- Watch for stream issues in real-time

### For Activists:
- Monitor multiple protest streams simultaneously
- Switch audio between different locations
- Save frequently-watched channels
- Quick access to breaking events

### For Researchers:
- Compare multiple live sources
- Document multiple angles of an event
- Cross-reference streams
- Archive links for later analysis

### For Content Creators:
- Watch inspiration while you work
- Monitor multiple topics/niches
- Keep streams on a second monitor
- Quick comparison tool

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `Enter` | Add stream (when in form) |

---

## 💾 Data Storage

**Everything saves automatically to your browser:**
- ✅ Grid layout preference (2x2, 3x3, etc.)
- ✅ All streams in your grid
- ✅ Which stream has audio
- ✅ Your saved stream list

**Refresh the page** - everything stays exactly as you left it!

**Clear your data**: Click "Clear All" or clear your browser's localStorage

---

## 🎯 Pro Tips

### For Best Performance:
- ✅ Use **Chrome** or **Edge** (best compatibility)
- ✅ Close other tabs (saves CPU)
- ✅ Start with **2×2** on laptops, **4×4** on desktop
- ✅ Good internet: 10 Mbps per stream

### For OBS:
1. Add a **Browser Source**
2. Set URL to: `file:///path/to/index.html`
3. Set size to match your scene
4. Audio is controlled by clicking streams

### For Multi-Monitor:
- Open multiple instances
- Different layout per monitor
- Drag window to fullscreen on second display

---

## 🔧 Troubleshooting

### Stream won't load?
- Check the URL is correct
- Try opening the URL directly first
- Some streams block embedding - nothing we can do
- Make sure it's a LIVE stream, not a VOD

### Audio not working?
- Click the stream to activate audio
- Only ONE stream plays audio at a time
- Check your browser isn't muted
- Some streams don't have audio tracks

### Page won't open?
- Make sure you're opening `index.html`
- Try a different browser (Chrome works best)
- Check the file downloaded completely

### Grid looks wrong?
- Click a different layout button
- Refresh the page
- Clear your browser cache

---

## 🌐 Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Excellent |
| Edge | ✅ Excellent |
| Firefox | ✅ Good |
| Safari | ⚠️ Limited (some streams may not work) |
| Brave | ✅ Excellent |

---

## 📱 Mobile Support

**Works on tablets and phones!**
- Layout auto-adjusts
- Touch to select audio
- Pinch to zoom (if needed)
- Best on iPad or Android tablets

---

## 🚀 Advanced Usage

### Custom Embed URLs:

You can paste ANY embed URL:
```
https://player.twitch.tv/?channel=CHANNEL&parent=localhost
https://www.youtube.com/embed/VIDEO_ID?autoplay=1
```

### Multiple Instances:

Open `index.html` multiple times for:
- Different stream sets
- Different layouts
- Separate windows

### Export/Import Streams:

Your data is in browser localStorage:
- **Export**: Open DevTools → Application → localStorage → Copy
- **Import**: Paste into another browser's localStorage

---

## ⚙️ System Requirements

| Component | Requirement |
|-----------|-------------|
| **Browser** | Chrome 90+, Edge 90+, Firefox 88+ |
| **RAM** | 2GB minimum, 8GB recommended |
| **Internet** | 10 Mbps per stream |
| **Disk** | None! Runs entirely in browser |

**More streams = More RAM & bandwidth needed**

---

## 🆚 vs. Other Solutions

### This App:
✅ No installation
✅ No login/account
✅ No API keys
✅ Works offline (once opened)
✅ 100% free
✅ No ads
✅ Privacy-first (nothing sent to servers)

### Other Tools:
❌ Require account creation
❌ Monthly subscription
❌ Limited free tier
❌ Ads and tracking
❌ Complex setup

---

## 🛡️ Privacy & Security

- ✅ **No servers** - everything runs in your browser
- ✅ **No tracking** - we don't know what you watch
- ✅ **No accounts** - no email, no login
- ✅ **No ads** - completely clean
- ✅ **Open source** - you can read the code

**Your data never leaves your computer!**

---

## 📂 Files Included

```
standalone/
├── index.html    # The main app (open this!)
├── app.js        # JavaScript logic
└── README.md     # This file
```

**Total size: < 50KB**

---

## 🔄 Updates

To get updates:
1. Download the new version
2. Replace the old files
3. Refresh your browser
4. Your saved streams will still be there!

---

## 🔧 Troubleshooting

### YouTube Error 153: "Video player configuration error"

**Cause:** Opening HTML file directly (`file://` protocol) doesn't send proper HTTP headers.

**Fix:** Use the local server scripts:
- Mac/Linux: Run `./start-server.sh`
- Windows: Run `start-server.bat`
- Then open: `http://localhost:8000/index.html`

### "Video unavailable" or "Embedding disabled"

**Cause:** The video uploader has disabled embedding.

**Fix:** This cannot be bypassed. Try a different video or ask the uploader to enable embedding.

### Some streams work, others don't

This is normal! Each video owner decides whether to allow embedding. News channels and official live streams usually work great.

**📖 For detailed troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## ❓ FAQ

**Q: Do I need internet?**
A: Yes, to load the streams. But the app itself works offline once loaded.

**Q: How many streams can I watch?**
A: Up to 16 (4×4 grid). Your computer/internet may limit this.

**Q: Can I save different layouts?**
A: Open multiple copies of `index.html` - each saves independently.

**Q: Does this work with OBS?**
A: Yes! Add as a Browser Source in OBS.

**Q: Is this really free?**
A: Yes! No hidden costs, no subscriptions, no catches.

**Q: Can I modify the code?**
A: Absolutely! It's just HTML and JavaScript. Customize away!

---

## 🌟 Feedback

Found a bug? Have an idea? Want to share how you use it?

Open an issue on GitHub or send a pull request!

---

## 📜 License

**MIT License** - Free to use, modify, and share!

---

## 🎉 That's It!

**You're ready to go!**

1. Open `index.html`
2. Click "+ Add Stream"
3. Paste a URL
4. Watch!

**Happy streaming! 📺🔴**
