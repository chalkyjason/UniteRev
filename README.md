# Live Protest Viewer 📺

**Watch multiple live protest streams at once - Simple setup, no coding needed!**

![Multi-Stream Dashboard](https://img.shields.io/badge/streams-1--16-red) ![Platform](https://img.shields.io/badge/platform-Mac%20%7C%20Windows%20%7C%20Linux-blue)

## What Does This Do?

This app lets you **watch multiple live protest streams** on one screen at the same time. You can:

- 📺 Watch 4, 9, or even 16 streams at once (you choose the layout)
- 🔊 Listen to ONE stream at a time (click to switch)
- 🔴 See a **red border** around the stream with sound
- 🔍 Search and filter streams from YouTube, Twitch, and more
- 💾 Your setup saves automatically

**Perfect for monitoring multiple events, protests, or rallies happening at the same time!**

---

## ⚡ Quick Setup (3 Steps)

### Step 1: Install Docker Desktop

Docker is like a "virtual computer" that runs the app. It's free and easy to install.

**Download for your computer:**
- **Mac**: [Download Docker for Mac](https://desktop.docker.com/mac/main/amd64/Docker.dmg)
- **Windows**: [Download Docker for Windows](https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe)

**Installation:**
1. Double-click the downloaded file
2. Follow the installer (just click "Next" and "Install")
3. Restart your computer when it asks
4. Open Docker Desktop - you should see a whale icon 🐳

**How to know it worked:** Open Docker Desktop and it should say "Docker Desktop is running"

---

### Step 2: Get API Keys (Free)

The app needs permission to find streams on YouTube and Twitch. Don't worry - it's free!

#### YouTube API Key (5 minutes)

1. Go to: https://console.cloud.google.com/
2. Click **"Create Project"** (top left)
3. Name it anything (like "Stream Viewer")
4. Click **"APIs & Services"** → **"Enable APIs"**
5. Search for **"YouTube Data API v3"**
6. Click **"Enable"**
7. Click **"Credentials"** (left sidebar)
8. Click **"Create Credentials"** → **"API Key"**
9. **Copy the key** (looks like: `AIzaSyD4x...`)

#### Twitch API Key (5 minutes)

1. Go to: https://dev.twitch.tv/console/apps
2. Click **"Register Your Application"**
3. Fill in:
   - **Name**: "Stream Viewer" (or anything)
   - **OAuth Redirect URL**: `http://localhost`
   - **Category**: "Website Integration"
4. Click **"Create"**
5. Click **"Manage"** on your new app
6. Copy the **Client ID** and **Client Secret**

**Keep these keys safe - you'll need them in Step 3!**

---

### Step 3: Run the Setup Script

#### For Mac/Linux:

1. **Download this project:**
   - Click the green **"Code"** button at the top of this page
   - Click **"Download ZIP"**
   - Unzip the file (double-click it)

2. **Open Terminal:**
   - Press `Cmd + Space`, type "Terminal", press Enter

3. **Go to the folder:**
   ```bash
   cd ~/Downloads/UniteRev-main
   ```

4. **Run the setup:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

#### For Windows:

1. **Download this project:**
   - Click the green **"Code"** button at the top of this page
   - Click **"Download ZIP"**
   - Right-click the ZIP → **"Extract All"**

2. **Open PowerShell:**
   - Press `Windows Key`, type "PowerShell", press Enter

3. **Go to the folder:**
   ```powershell
   cd ~\Downloads\UniteRev-main
   ```

4. **Run the setup:**
   ```powershell
   .\setup.bat
   ```

The setup script will:
- ✅ Ask for your API keys (paste them in)
- ✅ Check if Docker is running
- ✅ Start the app automatically
- ✅ Open your browser to the viewer

**That's it! You're done! 🎉**

---

## 🎬 How to Use the Viewer

The app will open at: **http://localhost:3000**

### First Time Setup:

1. **Select Streams**
   - Click the blue **"Select Streams"** button
   - You'll see all live protest streams available
   - Click the checkboxes to add streams to your grid

2. **Choose Your Layout**
   - At the top, click a layout button:
     - **2×2** = 4 streams (recommended to start)
     - **3×3** = 9 streams
     - **4×4** = 16 streams
   - Try different layouts to see what you like!

3. **Control Audio**
   - **Click any stream** to hear its audio
   - A **red border** appears around the stream with sound
   - Click another stream to switch audio
   - Only one stream plays audio at a time

4. **Search & Filter**
   - Use the search box to find specific locations or topics
   - Filter by platform (YouTube, Twitch, etc.)
   - Sort by most viewers or newest

### Your settings save automatically!
Close the browser and come back - your streams and layout will still be there.

---

## 🔧 Daily Use

### Starting the App:

**Easy way:** Just run the setup script again!
- Mac/Linux: `./setup.sh`
- Windows: `.\setup.bat`

**Manual way:**
```bash
docker-compose up -d
```
Then open: http://localhost:3000

### Stopping the App:

```bash
docker-compose down
```

Or just close Docker Desktop (the whale icon 🐳)

---

## ❓ Troubleshooting

### "Docker is not running"
- Open Docker Desktop
- Wait for the whale icon to stop animating
- Try again

### "Can't connect to localhost:3000"
1. Wait 30 seconds (the app takes a moment to start)
2. Make sure Docker Desktop is running
3. Try refreshing your browser

### "No streams showing up"
1. Check your API keys in `backend/.env`
2. Make sure they're pasted correctly (no extra spaces)
3. Restart: `docker-compose restart`

### Videos won't play
1. Try a different browser (Chrome works best)
2. Check your internet connection
3. Some streams may have region restrictions

### General problems
1. **Restart everything:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```
2. **Check if Docker is running** (look for the whale icon 🐳)
3. **Still stuck?** Open an issue on GitHub with a screenshot

---

## 📖 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Click stream | Toggle audio |
| Esc | Close dialogs |

More shortcuts coming soon!

---

## 🎯 Tips for Best Experience

### For 4 Streams (2×2):
✅ Clear view of each stream
✅ Easy to follow action
✅ Good for focused monitoring

### For 9 Streams (3×3):
✅ See more at once
✅ Still readable on big screens
✅ Good for comprehensive coverage

### For 16 Streams (4×4):
⚠️ Needs large monitor
⚠️ Hard to read titles
✅ Maximum coverage

**Recommendation:** Start with 2×2 or 3×3, especially on laptops!

---

## 🛡️ Privacy & Safety

- ✅ No personal data collected
- ✅ No account required
- ✅ Runs locally on your computer
- ✅ Your API keys stay on your machine
- ✅ Open source - you can see all the code

---

## 💰 Cost

- **App**: FREE ✅
- **YouTube API**: FREE (10,000 requests/day) ✅
- **Twitch API**: FREE (unlimited) ✅

You won't be charged for anything!

---

## 🔄 Updating the App

When there's a new version:

1. Download the new ZIP file
2. Extract it
3. Run the setup script again
4. That's it!

Your settings and API keys will be saved.

---

## 🆘 Need Help?

1. **Check this README first** (you're reading it!)
2. **Look at Issues tab** - someone may have had the same problem
3. **Open a new Issue** with:
   - What you tried to do
   - What happened instead
   - Your operating system (Mac/Windows/Linux)
   - A screenshot if possible

---

## 👥 Who Is This For?

- ✅ Activists monitoring multiple protests
- ✅ Journalists covering live events
- ✅ Researchers studying civil movements
- ✅ Anyone who wants to watch multiple streams at once

**No coding experience needed!** If you can download files and copy/paste, you can use this.

---

## ⚙️ System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4GB | 8GB+ |
| **Disk Space** | 5GB free | 10GB+ free |
| **Internet** | 10 Mbps | 25+ Mbps |
| **Browser** | Chrome 90+ | Chrome/Edge latest |
| **Screen** | 1280×720 | 1920×1080+ |

**More streams = more internet bandwidth needed!**

---

## 🎓 What You're Actually Running

*For curious users:*

This app has three parts:
1. **Database** (PostgreSQL) - Stores stream info
2. **Backend** (Python) - Finds and tracks streams
3. **Frontend** (React) - The website you see

Docker runs all three parts automatically. You don't need to understand any of this - it just works!

---

## 📜 License

MIT License - Free to use, modify, and share!

---

## 🌟 Made This Better?

If you made the setup even simpler or found a better way to explain something, please share! Open a Pull Request or Issue.

**Happy streaming! 📺🔴**
