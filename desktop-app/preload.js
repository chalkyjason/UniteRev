const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
    // Platform info
    platform: process.platform,
    version: process.versions.electron,
    isElectron: true,

    // OAuth support for Google/YouTube authentication
    // Google requires http://127.0.0.1 redirect URI for desktop apps
    oauth: {
        // Start the OAuth callback server and get the redirect URI
        startServer: () => ipcRenderer.invoke('oauth-start-server'),
        // Stop the OAuth callback server
        stopServer: () => ipcRenderer.invoke('oauth-stop-server'),
        // Get the current redirect URI (if server is running)
        getRedirectUri: () => ipcRenderer.invoke('oauth-get-redirect-uri'),
        // Listen for OAuth callbacks
        onCallback: (callback) => {
            ipcRenderer.on('oauth-callback', (event, data) => callback(data));
        }
    }
});

// Log that preload script has loaded
console.log('Preload script loaded successfully');
