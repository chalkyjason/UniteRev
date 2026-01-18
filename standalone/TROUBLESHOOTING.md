# Troubleshooting YouTube Embedding Issues

## ❌ YouTube Error 153: "Video player configuration error"

### Why This Happens

YouTube's Error 153 occurs when you open the HTML file directly using the `file://` protocol. YouTube requires a valid HTTP referrer header, which `file://` doesn't provide.

### ✅ THE FIX: Run a Local Web Server

Instead of double-clicking the HTML file, run it through a local web server:

---

## 🚀 Quick Start (Recommended Method)

### **Mac / Linux:**
```bash
# 1. Open Terminal
# 2. Navigate to the standalone folder
cd /path/to/UniteRev/standalone

# 3. Run the server script
chmod +x start-server.sh
./start-server.sh

# 4. Open browser to: http://localhost:8000/index.html
```

### **Windows:**
```cmd
# 1. Open Command Prompt or PowerShell
# 2. Navigate to the standalone folder
cd C:\path\to\UniteRev\standalone

# 3. Run the server script
start-server.bat

# 4. Open browser to: http://localhost:8000/index.html
```

---

## 🔧 Alternative Methods

### Using Python (if scripts don't work)

**Python 3:**
```bash
python3 -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000/index.html`

### Using Node.js

```bash
# Install http-server globally (one time)
npm install -g http-server

# Run server
http-server -p 8000

# Open: http://localhost:8000/index.html
```

### Using PHP

```bash
php -S localhost:8000
```

Then open: `http://localhost:8000/index.html`

---

## 🎯 Why This Works

| Method | Referrer Header | YouTube Embedding |
|--------|----------------|-------------------|
| `file://` (double-click) | ❌ None | ❌ Error 153 |
| `http://localhost:8000` | ✅ Valid HTTP | ✅ Works! |

When you run on `localhost`, your browser sends proper HTTP headers that YouTube expects, fixing Error 153.

---

## 🚫 Other YouTube Errors

### "Video unavailable" / "Embedding disabled"

**Cause:** The video uploader has disabled embedding.

**Fix:** Unfortunately, you can't embed these videos. The uploader must enable embedding in YouTube Studio:
- YouTube Studio → Content → Video → Show More → "Allow embedding"

### Some videos work, others don't

This is normal. Each video's uploader decides whether to allow embedding. Live streams from news channels usually allow embedding, while personal videos often don't.

---

## 📝 For OBS Users

When using as an OBS Browser Source:

1. **Don't use `file://` URLs** - OBS will have the same Error 153
2. **Run the local server** using the scripts above
3. **Add Browser Source** in OBS with URL: `http://localhost:8000/index.html`
4. Set Width: `1920`, Height: `1080` (or your canvas size)
5. ✅ Check "Shutdown source when not visible" to save CPU
6. ✅ Check "Refresh browser when scene becomes active"

---

## 🆘 Still Having Issues?

### Check if Python is installed:
```bash
python --version
# or
python3 --version
```

If not installed:
- **Mac:** Install from [python.org](https://www.python.org/downloads/) or use Homebrew: `brew install python3`
- **Windows:** Download from [python.org](https://www.python.org/downloads/)
- **Linux:** `sudo apt-get install python3` (Ubuntu/Debian)

### Test with a known embeddable video:

Try these URLs which should always work:
- BBC News Live: `https://www.youtube.com/watch?v=9Auq9mYxFEE`
- ABC News Live: `https://www.youtube.com/watch?v=w_Ma8oQLmSM`

If these don't work, you're not running on localhost properly.

---

## 💡 Understanding the Error

The full error details you might see:
```json
{
  "errorCode": "api.invalidparam",
  "errorMessage": "An error occurred. Please try again later.",
  "errorDetail": "invalidVideodata.1"
}
```

This is YouTube's way of saying "I don't trust where this embed is coming from." Running on `localhost` with proper HTTP headers fixes this trust issue.

---

## ✨ Pro Tip

Create a bookmark in your browser:
- **URL:** `http://localhost:8000/index.html`
- **Name:** "Multi-Stream Manager"

Then you can:
1. Run `./start-server.sh` (or `.bat` on Windows)
2. Click your bookmark
3. Start streaming!

---

**Questions?** Check the main README.md or create an issue on GitHub.
