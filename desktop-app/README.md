# AntifaTimes Stream Manager - Desktop App

Desktop application version with auto-update functionality.

## Features

- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Auto-Updates**: Automatically checks for updates from GitHub releases
- **Offline Capable**: Works without internet (except for streaming content)
- **Native Desktop Experience**: No browser required

## Development Setup

### Prerequisites

- Node.js 16+ and npm
- Python 3 (required by some build dependencies)

### Installation

```bash
cd desktop-app
npm install
```

### Running in Development

```bash
npm start
```

This will launch the app in development mode with DevTools available.

## Building Installers

### Build for All Platforms

```bash
npm run build:all
```

This creates installers for Windows, macOS, and Linux in the `dist/` folder.

### Build for Specific Platforms

```bash
# Windows only
npm run build:win

# macOS only
npm run build:mac

# Linux only
npm run build:linux
```

### Build Output

The installers will be created in `desktop-app/dist/`:

- **Windows**: `.exe` installer (NSIS)
- **macOS**: `.dmg` disk image and `.zip` archive
- **Linux**: `.AppImage` and `.deb` package

## Auto-Update Configuration

The app is configured to check for updates from GitHub releases.

### Setting Up Auto-Updates

1. **Create a GitHub Release**:
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Upload the built installers from `dist/` folder
   - Publish the release

2. **Versioning**:
   - Update the version in `package.json` before building
   - Use semantic versioning (e.g., 1.0.0, 1.1.0, 2.0.0)
   - The app checks the version against GitHub releases

3. **Update Process**:
   - App checks for updates on startup (after 3 seconds)
   - User can manually check via **File → Check for Updates**
   - If update found, user is prompted to download
   - After download, user can restart to install

### Publishing Updates

```bash
# Build and publish to GitHub releases
npm run release
```

**Important**: Before running this command:
1. Set up a GitHub personal access token with `repo` permissions
2. Set the token as environment variable: `export GH_TOKEN=your_token_here`
3. Ensure you've bumped the version in `package.json`

## Project Structure

```
desktop-app/
├── main.js              # Electron main process (app window & updates)
├── preload.js           # Security bridge between main/renderer
├── package.json         # Dependencies and build config
├── icon.svg            # App icon (converted to platform formats)
├── app/                # Web app files (from standalone/)
│   ├── index.html      # Main viewer window
│   ├── control-panel.html
│   ├── app.js
│   ├── logo.svg
│   └── ...
└── dist/               # Build output (created after npm run build)
```

## Configuration

### App Settings

Edit `package.json` to configure:

- **App Name**: `productName` field
- **App ID**: `build.appId` (reverse domain notation)
- **Icons**: `build.mac.icon`, `build.win.icon`, `build.linux.icon`
- **GitHub Repo**: `build.publish.owner` and `build.publish.repo`

### Build Options

The app uses `electron-builder` with these configurations:

- **Windows**: NSIS installer, one-click install, creates desktop shortcut
- **macOS**: DMG and ZIP, categorized as Utility
- **Linux**: AppImage (portable) and DEB package

## Menu Features

- **File Menu**:
  - Check for Updates
  - Exit (Ctrl/Cmd+Q)

- **View Menu**:
  - Reload (Ctrl/Cmd+R)
  - Toggle Developer Tools (Ctrl/Cmd+Shift+I)
  - Zoom controls
  - Fullscreen

- **Help Menu**:
  - About dialog
  - GitHub repository link

## Security

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Preload Script**: Safely exposes only needed APIs

## Troubleshooting

### Install Errors

If `npm install` fails downloading Electron:

```bash
# Clear npm cache
npm cache clean --force

# Try again
npm install
```

### Build Errors

If building fails:

1. Make sure you have Python installed (required by native modules)
2. On Windows, install Windows Build Tools:
   ```bash
   npm install --global windows-build-tools
   ```
3. On macOS, install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

### Icon Issues

If icons aren't showing:

- The app uses SVG which is converted automatically
- For better results, provide PNG icons:
  - `icon.png` - 512x512 or larger
  - Builder will generate platform-specific formats

## Distribution

### Windows

Users download the `.exe` file and run it. The app installs to their user directory and creates a desktop shortcut.

### macOS

Users download the `.dmg` file, open it, and drag the app to Applications folder.

### Linux

Users download the `.AppImage` file, make it executable, and run it:

```bash
chmod +x AntifaTimes-Stream-Manager-1.0.0.AppImage
./AntifaTimes-Stream-Manager-1.0.0.AppImage
```

Or install the `.deb` package:

```bash
sudo dpkg -i antifatimes-stream-manager_1.0.0_amd64.deb
```

## Development vs Production

- **Development** (`npm start`):
  - No auto-update checks
  - DevTools available
  - Hot reload possible

- **Production** (built installers):
  - Auto-update enabled
  - Optimized and packaged
  - Code signing (if configured)

## License

MIT License - See main repository for details
