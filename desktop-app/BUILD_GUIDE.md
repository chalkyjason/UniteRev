# Desktop App Build & Distribution Guide

## Quick Build (Unsigned - Works for Testing)

This creates installers that work but show security warnings on first run.

### 1. Install Dependencies

```bash
cd desktop-app
npm install
```

### 2. Build for Your Platform

**macOS:**
```bash
npm run build:mac
```

**Windows:**
```bash
npm run build:win
```

**Linux:**
```bash
npm run build:linux
```

**All platforms:**
```bash
npm run build:all
```

### 3. Find Your Installers

Built installers are in `desktop-app/dist/`:
- **macOS**: `AntifaTimes-Stream-Manager-1.0.0.dmg`
- **Windows**: `AntifaTimes-Stream-Manager-Setup-1.0.0.exe`
- **Linux**: `AntifaTimes-Stream-Manager-1.0.0.AppImage`

---

## Distribution (Unsigned Apps)

### macOS - What Users Do:

1. Download the `.dmg` file
2. Double-click to mount it
3. Drag app to Applications folder
4. **Important**: First launch:
   - Right-click the app in Applications
   - Click "Open"
   - Click "Open" in the security dialog
5. After that, regular double-click works forever!

**User Instructions to Include:**
```
macOS Security Note:
This app is not signed with an Apple Developer certificate.
On first launch only:
1. Right-click the app → "Open"
2. Click "Open" in the security dialog
3. The app is safe and open source
After the first time, it opens normally!
```

### Windows - What Users Do:

1. Download the `.exe` installer
2. Double-click to run
3. If SmartScreen appears:
   - Click "More info"
   - Click "Run anyway"
4. App installs and creates desktop shortcut

**User Instructions:**
```
Windows Security Note:
Windows may show SmartScreen warning because the app isn't signed.
Click "More info" → "Run anyway"
The app is safe and open source.
```

### Linux - What Users Do:

1. Download the `.AppImage` file
2. Make it executable:
   ```bash
   chmod +x AntifaTimes-Stream-Manager-1.0.0.AppImage
   ```
3. Double-click or run:
   ```bash
   ./AntifaTimes-Stream-Manager-1.0.0.AppImage
   ```

---

## Code Signing (Removes Warnings)

If you want to eliminate security warnings, you need to sign your app.

### macOS Code Signing

**Requirements:**
- Apple Developer Account ($99/year)
- Developer ID Application certificate

**Steps:**

1. **Get Apple Developer Account:**
   - Sign up at https://developer.apple.com/
   - Enroll in Apple Developer Program ($99/year)

2. **Get Code Signing Certificate:**
   - Open Xcode → Preferences → Accounts
   - Add your Apple ID
   - Manage Certificates → Create "Developer ID Application" certificate

3. **Set Environment Variables:**
   ```bash
   export APPLE_ID="your-apple-id@email.com"
   export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
   export APPLE_TEAM_ID="your-team-id"
   ```

   To get app-specific password:
   - Go to https://appleid.apple.com/
   - Sign in → Security → App-Specific Passwords
   - Generate one for "Electron Builder"

4. **Use Signed Configuration:**
   ```bash
   cp package.json.signed package.json
   npm install electron-notarize
   ```

5. **Build with Signing:**
   ```bash
   npm run build:mac
   ```

   The app will be:
   - Code signed
   - Notarized by Apple
   - No security warnings!

### Windows Code Signing

**Requirements:**
- Code signing certificate (from Digicert, Sectigo, etc. ~$200-400/year)
- Windows only

**Steps:**

1. **Purchase certificate** from a CA (Digicert, Sectigo, etc.)

2. **Install certificate** on Windows machine

3. **Update package.json:**
   ```json
   "win": {
     "certificateFile": "path/to/certificate.pfx",
     "certificatePassword": "cert-password",
     "signingHashAlgorithms": ["sha256"],
     "sign": "./sign.js"
   }
   ```

4. **Build:**
   ```bash
   npm run build:win
   ```

---

## Recommended Distribution Methods

### For Beta Testers (Unsigned is Fine):

1. **Build installers**: `npm run build:all`
2. **Upload to GitHub Releases**:
   - Create new release on GitHub
   - Upload .dmg, .exe, .AppImage files
   - Include installation instructions (above)
3. **Share download link** with beta testers
4. **Include security notes** so they know what to expect

### For Public Release (Code Signing Recommended):

1. Get code signing certificates (macOS + Windows)
2. Build signed installers
3. Distribute via:
   - GitHub Releases (free)
   - Your own website
   - App distribution platforms

---

## Auto-Updates

The app is configured for auto-updates from GitHub Releases.

**To enable:**

1. **Build and sign your app**
2. **Create GitHub Release**:
   ```bash
   # Update version in package.json first
   # Then build
   npm run build:all
   ```

3. **Upload to GitHub Releases**:
   - Tag version (e.g., v1.0.1)
   - Upload built files
   - Publish release

4. **App checks for updates automatically**:
   - On startup (after 3 seconds)
   - Via "File → Check for Updates" menu
   - Prompts user to download and install

---

## Quick Start Summary

**For Testing/Beta (Unsigned):**
```bash
cd desktop-app
npm install
npm run build:all
# Share files from dist/ folder
```

**For Production (Signed):**
1. Get Apple Developer account ($99/year)
2. Get Windows code signing cert ($200-400/year)
3. Set up signing credentials
4. Build signed installers
5. No security warnings for users!

---

## File Sizes (Approximate)

- **macOS DMG**: ~150-200 MB
- **Windows EXE**: ~100-150 MB
- **Linux AppImage**: ~150-200 MB

These include Electron + Chromium, which is why they're larger than you might expect.

---

## Troubleshooting

### "npm install" fails downloading Electron

**Network issues - Try:**
```bash
npm cache clean --force
npm install --verbose
```

### Build fails on macOS

**Need Xcode Command Line Tools:**
```bash
xcode-select --install
```

### Build fails on Windows

**Need Windows Build Tools:**
```bash
npm install --global windows-build-tools
```

### App won't open on macOS

**Quarantine issue - Remove quarantine:**
```bash
xattr -cr "/Applications/AntifaTimes Stream Manager.app"
```

---

## Support

For issues:
- Check GitHub Issues: https://github.com/chalkyjason/UniteRev/issues
- Build errors: Include full error output
- Distribution issues: Specify which platform

