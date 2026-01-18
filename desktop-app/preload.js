const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Example: Add any needed APIs here
    // For this app, we primarily use localStorage which is available by default
    // This file exists for future extensibility and security best practices

    platform: process.platform,
    version: process.versions.electron
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
