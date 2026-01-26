const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const http = require('http');

let mainWindow;
let oauthServer = null;
let oauthServerPort = null;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// Get the correct base path for the app (works in both dev and packaged)
function getAppBasePath() {
    // In packaged app, app.getAppPath() returns the path to the asar or app directory
    // In development, it returns the project directory
    return app.getAppPath();
}

function createWindow() {
    const basePath = getAppBasePath();

    // Try to find the icon (prefer png, fallback to svg)
    let iconPath = path.join(basePath, 'icon.png');
    if (!fs.existsSync(iconPath)) {
        iconPath = path.join(basePath, 'icon.svg');
        if (!fs.existsSync(iconPath)) {
            iconPath = undefined; // Let Electron use default
        }
    }

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'AntifaTimes Stream Manager',
        webPreferences: {
            preload: path.join(basePath, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webviewTag: true // Enable webview tags for embedded browsing
        },
        icon: iconPath
    });

    // Load the app using app.getAppPath() for reliable path resolution
    const indexPath = path.join(basePath, 'app', 'index.html');
    console.log('Loading index from:', indexPath);
    console.log('App base path:', basePath);
    console.log('File exists:', fs.existsSync(indexPath));

    mainWindow.loadFile(indexPath).catch(err => {
        console.error('Failed to load index.html:', err);
        console.error('Attempted path:', indexPath);

        // Show an error page instead of failing silently
        mainWindow.loadURL(`data:text/html,
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error Loading Application</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                           background: #1e293b; color: white; padding: 40px; }
                    h1 { color: #ef4444; }
                    pre { background: #0f172a; padding: 20px; border-radius: 8px; overflow: auto; }
                    .path { color: #60a5fa; }
                </style>
            </head>
            <body>
                <h1>Failed to Load Application</h1>
                <p>The application could not find its main HTML file.</p>
                <p><strong>Expected path:</strong> <span class="path">${indexPath}</span></p>
                <p><strong>App base path:</strong> <span class="path">${basePath}</span></p>
                <p><strong>Error:</strong></p>
                <pre>${err.message}</pre>
                <p>Please report this issue at: <a href="https://github.com/chalkyjason/UniteRev/issues" style="color: #60a5fa;">GitHub Issues</a></p>
            </body>
            </html>
        `);
    });

    // Open DevTools for debugging in development
    mainWindow.webContents.openDevTools();

    // Set up permission handlers for webviews
    const session = mainWindow.webContents.session;
    session.setPermissionRequestHandler((webContents, permission, callback) => {
        // Allow all clipboard and media permissions
        const allowedPermissions = [
            'clipboard-read',
            'clipboard-write',
            'clipboard-sanitized-write',
            'media',
            'mediaKeySystem',
            'geolocation',
            'notifications',
            'fullscreen',
            'pointerLock'
        ];

        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            callback(false);
        }
    });

    // Create application menu
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Check for Updates',
                    click: () => {
                        checkForUpdates();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        mainWindow.reload();
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'CmdOrCtrl+Shift+I',
                    click: () => {
                        mainWindow.webContents.toggleDevTools();
                    }
                },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        const { dialog } = require('electron');
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About AntifaTimes Stream Manager',
                            message: 'AntifaTimes Stream Manager',
                            detail: `Version: ${app.getVersion()}\n\nMulti-stream viewer for protests and activism.\n\nCopyright © 2024 AntifaTimes`,
                            buttons: ['OK']
                        });
                    }
                },
                {
                    label: 'GitHub Repository',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://github.com/chalkyjason/UniteRev');
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Auto-update functions
function checkForUpdates() {
    const { dialog } = require('electron');

    autoUpdater.checkForUpdates();

    autoUpdater.on('update-available', (info) => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: `A new version (${info.version}) is available!`,
            detail: 'Would you like to download it now?',
            buttons: ['Download', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.downloadUpdate();

                dialog.showMessageBox(mainWindow, {
                    type: 'info',
                    title: 'Downloading Update',
                    message: 'Update is being downloaded in the background.',
                    detail: 'You will be notified when it\'s ready to install.',
                    buttons: ['OK']
                });
            }
        });
    });

    autoUpdater.on('update-not-available', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'No Updates',
            message: 'You are running the latest version!',
            buttons: ['OK']
        });
    });

    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Ready',
            message: 'Update has been downloaded.',
            detail: 'The application will restart to install the update.',
            buttons: ['Restart Now', 'Later']
        }).then((result) => {
            if (result.response === 0) {
                autoUpdater.quitAndInstall();
            }
        });
    });

    autoUpdater.on('error', (err) => {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Update Error',
            message: 'Error checking for updates',
            detail: err.toString(),
            buttons: ['OK']
        });
    });
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();

    // Check for updates on startup (silently)
    if (!app.isPackaged) {
        console.log('Running in development mode - skipping auto-update check');
    } else {
        setTimeout(() => {
            autoUpdater.checkForUpdates().catch(err => {
                console.log('Auto-update check failed:', err);
            });
        }, 3000); // Wait 3 seconds after startup
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// OAuth callback server for Google authentication
// Google requires http://127.0.0.1 or http://localhost for desktop apps
ipcMain.handle('oauth-start-server', async () => {
    return new Promise((resolve, reject) => {
        if (oauthServer) {
            // Server already running
            resolve({ port: oauthServerPort, redirectUri: `http://127.0.0.1:${oauthServerPort}/callback` });
            return;
        }

        oauthServer = http.createServer((req, res) => {
            const url = new URL(req.url, `http://127.0.0.1`);

            if (url.pathname === '/callback') {
                // Send success page to browser
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Authentication Successful</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                                color: white;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .container {
                                text-align: center;
                                padding: 40px;
                                background: rgba(255,255,255,0.1);
                                border-radius: 16px;
                                backdrop-filter: blur(10px);
                            }
                            h1 { color: #22c55e; margin-bottom: 16px; }
                            p { color: #94a3b8; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>✓ Authentication Successful</h1>
                            <p>You can close this window and return to the application.</p>
                            <script>
                                // Send the hash fragment to the parent
                                if (window.opener) {
                                    window.opener.postMessage({
                                        type: 'oauth-callback',
                                        hash: window.location.hash
                                    }, '*');
                                }
                                // Auto-close after a short delay
                                setTimeout(() => window.close(), 2000);
                            </script>
                        </div>
                    </body>
                    </html>
                `);

                // Notify renderer about the callback
                if (mainWindow) {
                    mainWindow.webContents.send('oauth-callback', {
                        url: req.url,
                        hash: url.hash
                    });
                }
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        // Find an available port
        oauthServer.listen(0, '127.0.0.1', () => {
            oauthServerPort = oauthServer.address().port;
            console.log(`OAuth callback server started on port ${oauthServerPort}`);
            resolve({ port: oauthServerPort, redirectUri: `http://127.0.0.1:${oauthServerPort}/callback` });
        });

        oauthServer.on('error', (err) => {
            console.error('OAuth server error:', err);
            reject(err);
        });
    });
});

ipcMain.handle('oauth-stop-server', async () => {
    if (oauthServer) {
        oauthServer.close();
        oauthServer = null;
        oauthServerPort = null;
        console.log('OAuth callback server stopped');
    }
    return true;
});

ipcMain.handle('oauth-get-redirect-uri', async () => {
    if (oauthServerPort) {
        return `http://127.0.0.1:${oauthServerPort}/callback`;
    }
    return null;
});

// Log version info
console.log('AntifaTimes Stream Manager v' + app.getVersion());
console.log('Electron v' + process.versions.electron);
