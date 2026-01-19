const { app, BrowserWindow, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        title: 'AntifaTimes Stream Manager',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webviewTag: true // Enable webview tags for embedded browsing
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // Load the app
    mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));

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

// Log version info
console.log('AntifaTimes Stream Manager v' + app.getVersion());
console.log('Electron v' + process.versions.electron);
