# Troubleshooting Build Issues

Common issues and solutions when building the AntifaTimes Stream Manager desktop app.

## 🚨 Camelcase Deprecation Warning (macOS)

### Symptoms:
```
deprecate('camelcase_' + name, sub('%s()'): following options are renamed: '%s'
...
TypeError: got multiple values for argument '%r'
```

### Cause:
Outdated electron-builder dependencies using deprecated camelcase package.

### Solution:

**Quick Fix** (Recommended):
```bash
cd desktop-app
./fix-build.sh
```

This script will:
1. Remove old dependencies
2. Clear electron caches
3. Install fresh dependencies with updated versions
4. Build the app

**Manual Fix**:
```bash
cd desktop-app

# Remove old dependencies
rm -rf node_modules
rm -f package-lock.json

# Clear electron caches (macOS)
rm -rf ~/.electron
rm -rf ~/Library/Caches/electron
rm -rf ~/Library/Caches/electron-builder

# Clear electron caches (Linux)
rm -rf ~/.cache/electron
rm -rf ~/.cache/electron-builder

# Reinstall
npm install

# Build
npm run build:mac  # or build:win, build:linux
```

---

## ❌ "Command failed: npm install" Error

### Symptoms:
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

### Solutions:

**1. Update Node.js**
```bash
# Check current version
node -v

# Should be v18+ (v20+ recommended)
# Download from: https://nodejs.org/
```

**2. Clear npm cache**
```bash
npm cache clean --force
```

**3. Delete lock file and retry**
```bash
rm -f package-lock.json
npm install
```

---

## 🔒 Code Signing Issues (macOS)

### Symptoms:
```
Error: Command failed: codesign --sign ...
identity not found
```

### Solution:

**For testing (unsigned build)**:
The current `package.json` is configured for unsigned builds. This is fine for testing.

**For distribution (signed build)**:
1. Enroll in Apple Developer Program ($99/year)
2. Create certificates in Xcode
3. Use `package.json.signed` as template
4. See BUILD_GUIDE.md → Code Signing section

---

## 🪟 SmartScreen Warning (Windows)

### Symptoms:
"Windows protected your PC" warning when installing.

### Explanation:
This is normal for unsigned apps. Users can click "More info" → "Run anyway"

### Solution for distribution:
1. Get Windows code signing certificate ($200-400/year)
2. Sign .exe with `signtool`
3. See BUILD_GUIDE.md → Code Signing section

---

## 🐧 AppImage Won't Run (Linux)

### Symptoms:
```
Permission denied
bash: ./AntifaTimes-Stream-Manager-1.0.0.AppImage: cannot execute binary file
```

### Solution:
```bash
# Make executable
chmod +x AntifaTimes-Stream-Manager-*.AppImage

# Run
./AntifaTimes-Stream-Manager-*.AppImage
```

If still fails:
```bash
# Install FUSE (required for AppImage)
sudo apt install fuse libfuse2  # Ubuntu/Debian
sudo dnf install fuse           # Fedora
sudo pacman -S fuse2            # Arch
```

---

## 💾 "Out of Memory" During Build

### Symptoms:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

### Solution:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Then build
npm run build
```

Or add to package.json scripts:
```json
"build:mac": "NODE_OPTIONS='--max-old-space-size=4096' electron-builder --mac"
```

---

## 🔄 Auto-Update Not Working

### Checklist:

**1. Check .yml files uploaded to GitHub Release**
- ✅ `latest-mac.yml` (for Mac)
- ✅ `latest-linux.yml` (for Linux)
- ✅ `latest.yml` (for Windows)

These files are CRITICAL for auto-update!

**2. Check repository URL in package.json**
```json
"repository": {
  "type": "git",
  "url": "https://github.com/chalkyjason/UniteRev.git"
}
```

**3. Check publish config in package.json**
```json
"publish": {
  "provider": "github",
  "owner": "chalkyjason",
  "repo": "UniteRev"
}
```

**4. Check version numbers**
- New version MUST be higher than installed version
- Use semantic versioning: 1.0.0 → 1.0.1 → 1.1.0 → 2.0.0

**5. Check release is published (not draft)**
- Go to: https://github.com/chalkyjason/UniteRev/releases
- Ensure release is marked "Latest release"

**6. Debug in app**
- Open DevTools: View → Toggle Developer Tools
- Check console for update errors
- Look for: "Checking for updates..." message

---

## 🔍 Build Artifacts Missing

### Symptoms:
`dist/` folder is empty or missing expected files.

### Expected files after build:

**macOS**:
- `AntifaTimes-Stream-Manager-1.0.0.dmg`
- `AntifaTimes-Stream-Manager-1.0.0-mac.zip`
- `latest-mac.yml`

**Windows**:
- `AntifaTimes-Stream-Manager-Setup-1.0.0.exe`
- `latest.yml`

**Linux**:
- `AntifaTimes-Stream-Manager-1.0.0.AppImage`
- `AntifaTimes-Stream-Manager_1.0.0_amd64.deb`
- `latest-linux.yml`

### Solution:

**Check build errors**:
```bash
npm run build:mac 2>&1 | tee build.log
# Check build.log for errors
```

**Check disk space**:
```bash
df -h  # Need ~500MB-1GB free
```

**Check file permissions**:
```bash
ls -la dist/
# Files should be readable (not 000 permissions)
```

---

## 📱 Icon Not Showing

### Symptoms:
App shows default Electron icon instead of custom icon.

### Solution:

**1. Check icon file exists**:
```bash
ls -la icon.svg icon.icns icon.ico icon.png
```

**2. Use proper icon formats**:
- **macOS**: `.icns` (512x512, 256x256, 128x128, etc.)
- **Windows**: `.ico` (256x256, 128x128, 64x64, 32x32, 16x16)
- **Linux**: `.png` (512x512 recommended)
- **Universal**: `.svg` works but not ideal

**3. Generate proper icons**:
```bash
# Install icon generator
npm install -g electron-icon-maker

# Generate from PNG
electron-icon-maker --input=icon-1024.png --output=./
```

**4. Update package.json**:
```json
"mac": {
  "icon": "icon.icns"
},
"win": {
  "icon": "icon.ico"
},
"linux": {
  "icon": "icon.png"
}
```

---

## 🌐 Network Issues During Build

### Symptoms:
```
RequestError: read ECONNRESET
npm ERR! network Socket timeout
```

### Solutions:

**1. Retry build** (network may be temporarily down)

**2. Use different network**:
```bash
# Try mobile hotspot or different WiFi
```

**3. Clear Electron download cache**:
```bash
# macOS/Linux
rm -rf ~/.electron
rm -rf ~/.cache/electron

# Windows
rmdir /s /q %LOCALAPPDATA%\electron
```

**4. Manual Electron download**:
```bash
# Set Electron mirror (China example)
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install
```

**5. Use offline mode** (if you have node_modules):
```bash
npm run build --offline
```

---

## 🔧 General Debugging Tips

### Enable verbose logging:
```bash
# See detailed build output
DEBUG=electron-builder npm run build

# Or even more verbose
DEBUG=* npm run build
```

### Check Electron version compatibility:
```bash
# Should be on Node.js v16+ for Electron 28+
# Should be on Node.js v18+ for Electron 30+
node -v
```

### Clean everything and start fresh:
```bash
cd desktop-app
./fix-build.sh  # Cleans and rebuilds everything
```

### Check system requirements:

**macOS**:
- macOS 10.13+ (High Sierra or newer)
- Xcode Command Line Tools: `xcode-select --install`

**Windows**:
- Windows 7 or newer
- Visual Studio Build Tools (optional, for native modules)

**Linux**:
- Most modern distros work
- May need: `libgtk-3-0`, `libnotify4`, `libnss3`, `libxss1`

---

## 📚 Additional Resources

- **Electron Builder Docs**: https://www.electron.build/
- **Electron Docs**: https://www.electronjs.org/docs
- **GitHub Issues**: https://github.com/electron-userland/electron-builder/issues
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/electron-builder

---

## 🆘 Still Having Issues?

If none of the above solutions work:

1. **Check GitHub Issues**: https://github.com/chalkyjason/UniteRev/issues
2. **Create detailed issue** with:
   - Full error message
   - Operating system and version
   - Node.js version (`node -v`)
   - npm version (`npm -v`)
   - Build log output
   - Steps to reproduce

3. **Try the fix script**: `./fix-build.sh`
4. **Update everything**:
   ```bash
   # Update Node.js to latest LTS
   # Update npm
   npm install -g npm@latest

   # Clear all caches
   npm cache clean --force

   # Reinstall
   cd desktop-app
   rm -rf node_modules package-lock.json
   npm install
   ```
