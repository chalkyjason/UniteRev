# Quick Start Guide 🚀

**Get up and running in 10 minutes!**

---

## What You Need

1. A computer (Mac, Windows, or Linux)
2. Internet connection
3. 10 minutes of your time

---

## Step-by-Step Setup

### 1️⃣ Install Docker Desktop (5 minutes)

**Mac Users:**
- Download: https://desktop.docker.com/mac/main/amd64/Docker.dmg
- Double-click the file
- Drag Docker to Applications
- Open Docker Desktop
- Wait for the whale icon 🐳 to appear

**Windows Users:**
- Download: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
- Double-click the file
- Click "Install"
- Restart your computer
- Open Docker Desktop
- Look for the whale icon 🐳 in your system tray

**How to know it worked:**
- Docker Desktop shows "Docker Desktop is running"
- The whale icon is visible

---

### 2️⃣ Get Your API Keys (5 minutes - FREE!)

#### YouTube API Key:
1. Go to https://console.cloud.google.com/
2. Click "Create Project"
3. Name it "Stream Viewer"
4. Click "APIs & Services" → "Enable APIs"
5. Search "YouTube Data API v3"
6. Click "Enable"
7. Click "Credentials" → "Create Credentials" → "API Key"
8. **COPY THE KEY** and save it somewhere

#### Twitch API Key:
1. Go to https://dev.twitch.tv/console/apps
2. Click "Register Your Application"
3. Name: "Stream Viewer"
4. OAuth Redirect URL: `http://localhost`
5. Category: "Website Integration"
6. Click "Create"
7. Click "Manage"
8. **COPY the Client ID and Client Secret** and save them

---

### 3️⃣ Download & Run (3 minutes)

**Mac/Linux:**
```bash
# 1. Download the project
# Click the green "Code" button on GitHub → Download ZIP
# Unzip it

# 2. Open Terminal (Cmd+Space, type "Terminal")

# 3. Go to the folder
cd ~/Downloads/UniteRev-main

# 4. Run the setup
chmod +x setup.sh
./setup.sh

# 5. Paste your API keys when asked
```

**Windows:**
```powershell
# 1. Download the project
# Click the green "Code" button on GitHub → Download ZIP
# Right-click → Extract All

# 2. Open PowerShell (Windows key, type "PowerShell")

# 3. Go to the folder
cd ~\Downloads\UniteRev-main

# 4. Run the setup
.\setup.bat

# 5. Paste your API keys when asked
```

**The script will:**
- Ask for your API keys (paste them in)
- Download and start everything automatically
- Open your browser to http://localhost:3000

**That's it! You're done! 🎉**

---

## Using the Viewer

### First Steps:

1. **Click "Select Streams"** (big blue button)
   - Browse all live protest streams
   - Check boxes to add streams

2. **Pick a Layout** (at the top)
   - Start with 2×2 (4 streams)
   - Try 3×3 (9 streams) or 4×4 (16 streams)

3. **Click a Stream** to hear its audio
   - Red border appears around the active stream
   - Click another to switch audio

4. **Search & Filter**
   - Search box for specific topics
   - Filter by platform (YouTube, Twitch)
   - Sort by viewers or newest

### Your settings automatically save!

---

## Daily Use

**Starting the app:**
```bash
# Just run the setup script again!
./setup.sh    # Mac/Linux
.\setup.bat   # Windows
```

**Stopping the app:**
```bash
docker-compose down
```

Or just close Docker Desktop

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Wait 30 seconds, refresh browser |
| No streams | Check API keys in `backend/.env` |
| Docker not running | Open Docker Desktop (whale icon 🐳) |
| Videos won't play | Try Chrome browser |

**Still stuck?**
1. Restart everything: `docker-compose down` then `docker-compose up -d`
2. Check Docker Desktop is running
3. Open a GitHub issue with a screenshot

---

## Tips

✅ **Start with 2×2 layout** - easier to see everything
✅ **Use Chrome** - best compatibility
✅ **Good internet** - 25+ Mbps for multiple streams
✅ **Big screen** - 4×4 needs a large monitor

---

## Need More Help?

📖 **Full README** - All the details
🐛 **Issues Tab** - Report problems
💬 **Discussions** - Ask questions

---

**That's all you need to know! Happy streaming! 📺🔴**
