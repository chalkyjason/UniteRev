// Stream Scanner Plugin Architecture
// Supports multiple streaming platforms for keyword-based discovery

// Base Plugin Class
class ScannerPlugin {
    constructor(name, platform, icon) {
        this.name = name;
        this.platform = platform;
        this.icon = icon;
        this.active = false;
        this.scanning = false;
        this.results = [];
    }

    async scan(keywords, minViewers = 0) {
        throw new Error('scan() must be implemented by plugin');
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
        this.scanning = false;
    }

    isLive(stream) {
        // Override in platform-specific plugins if needed
        return stream.isLive !== false;
    }

    // Fetch with retry logic and rate limit handling
    async fetchWithRetry(url, options = {}, maxRetries = 3) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch(url, options);

                // Success
                if (response.ok) {
                    return response;
                }

                // Handle rate limiting (429 Too Many Requests)
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;

                    console.warn(`Rate limited by ${this.platform}. Retrying after ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }

                // Handle server errors with exponential backoff
                if (response.status >= 500 && response.status < 600) {
                    if (attempt < maxRetries - 1) {
                        const waitTime = Math.pow(2, attempt) * 1000;
                        console.warn(`${this.platform} server error ${response.status}. Retrying after ${waitTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue;
                    }
                }

                // Other errors - return response for caller to handle
                return response;
            } catch (error) {
                // Network errors
                if (attempt < maxRetries - 1) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.warn(`${this.platform} network error. Retrying after ${waitTime}ms...`, error);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw error;
            }
        }

        throw new Error(`Max retries (${maxRetries}) exceeded for ${this.platform}`);
    }
}

// Twitch Plugin
class TwitchPlugin extends ScannerPlugin {
    constructor() {
        super('Twitch Scanner', 'twitch', '🟣');
        this.apiBase = 'https://api.twitch.tv/helix';
        this.clientId = null; // Users will need to provide their own
        this.accessToken = null;
        this.clientSecret = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;

        // Load saved credentials
        this.loadCredentials();
    }

    loadCredentials() {
        const saved = localStorage.getItem('twitch_auth');
        if (saved) {
            try {
                const auth = JSON.parse(saved);
                this.clientId = auth.clientId;
                this.clientSecret = auth.clientSecret;
                this.accessToken = auth.accessToken;
                this.tokenExpiry = auth.tokenExpiry;

                // Check if token is still valid
                if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                    this.isAuthenticated = true;
                }
            } catch (error) {
                console.error('Error loading Twitch credentials:', error);
            }
        }
    }

    saveCredentials() {
        const auth = {
            clientId: this.clientId,
            clientSecret: this.clientSecret,
            accessToken: this.accessToken,
            tokenExpiry: this.tokenExpiry
        };
        localStorage.setItem('twitch_auth', JSON.stringify(auth));
    }

    async generateToken(clientId, clientSecret) {
        if (!clientId || !clientSecret) {
            throw new Error('Client ID and Client Secret are required');
        }

        this.clientId = clientId;
        this.clientSecret = clientSecret;

        try {
            // Use client credentials flow to get app access token
            const response = await fetch('https://id.twitch.tv/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: 'client_credentials'
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to generate access token');
            }

            const data = await response.json();
            this.accessToken = data.access_token;
            const expiresIn = data.expires_in || 3600;
            this.tokenExpiry = Date.now() + (expiresIn * 1000);
            this.isAuthenticated = true;

            this.saveCredentials();
            return true;
        } catch (error) {
            console.error('Twitch token generation error:', error);
            throw error;
        }
    }

    async ensureValidToken() {
        // Check if token needs refresh
        if (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000) {
            // Token expired or expiring soon
            if (this.clientId && this.clientSecret) {
                await this.generateToken(this.clientId, this.clientSecret);
            } else {
                this.isAuthenticated = false;
                return false;
            }
        }
        return this.isAuthenticated;
    }

    signOut() {
        this.accessToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;
        localStorage.removeItem('twitch_auth');
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;
        const results = [];

        try {
            // Check if we have valid authentication
            const hasValidToken = await this.ensureValidToken();

            // For demo/testing without credentials, return mock data
            if (!hasValidToken) {
                return this.getMockData(keywords, minViewers);
            }

            // Real API implementation with rate limit handling
            for (const keyword of keywords) {
                const response = await this.fetchWithRetry(
                    `${this.apiBase}/search/channels?query=${encodeURIComponent(keyword)}&live_only=true`,
                    {
                        headers: {
                            'Client-ID': this.clientId,
                            'Authorization': `Bearer ${this.accessToken}`
                        }
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const streams = data.data
                        .filter(stream => stream.is_live)
                        .map(stream => ({
                            platform: 'twitch',
                            platformIcon: '🟣',
                            username: stream.broadcaster_login,
                            displayName: stream.display_name,
                            title: stream.title || 'Untitled Stream',
                            viewers: parseInt(stream.viewer_count) || 0,
                            game: stream.game_name || 'No Game',
                            thumbnailUrl: stream.thumbnail_url,
                            url: `https://twitch.tv/${stream.broadcaster_login}`,
                            isLive: true,
                            keyword: keyword
                        }));

                    results.push(...streams.filter(s => s.viewers >= minViewers));
                } else if (response.status === 401) {
                    // Token expired or invalid, try to regenerate
                    if (this.clientId && this.clientSecret) {
                        await this.generateToken(this.clientId, this.clientSecret);
                        // Retry this scan
                        return this.scan(keywords, minViewers);
                    } else {
                        this.isAuthenticated = false;
                        console.error('Twitch authentication expired');
                    }
                }
            }
        } catch (error) {
            console.error('Twitch scan error:', error);
            // Fall back to mock data on error
            return this.getMockData(keywords, minViewers);
        } finally {
            this.scanning = false;
        }

        this.results = results;
        return results;
    }

    getMockData(keywords, minViewers) {
        const mockStreams = [];
        const games = ['Just Chatting', 'League of Legends', 'Valorant', 'Minecraft', 'GTA V', 'Chess'];

        keywords.forEach(keyword => {
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                const viewers = Math.floor(Math.random() * 5000) + 50;
                if (viewers >= minViewers) {
                    mockStreams.push({
                        platform: 'twitch',
                        platformIcon: '🟣',
                        username: `streamer_${keyword.toLowerCase()}_${i}`,
                        displayName: `${keyword}Master${i}`,
                        title: `${keyword} - ${games[Math.floor(Math.random() * games.length)]} Stream!`,
                        viewers: viewers,
                        game: games[Math.floor(Math.random() * games.length)],
                        url: `https://twitch.tv/streamer_${keyword.toLowerCase()}_${i}`,
                        isLive: Math.random() > 0.1,
                        keyword: keyword
                    });
                }
            }
        });

        this.results = mockStreams;
        return mockStreams;
    }
}

// YouTube Plugin
class YouTubePlugin extends ScannerPlugin {
    constructor() {
        super('YouTube Live Scanner', 'youtube', '🔴');
        this.apiBase = 'https://www.googleapis.com/youtube/v3';
        this.apiKey = null; // Users will need to provide their own
        this.clientId = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;

        // Load saved credentials
        this.loadCredentials();
    }

    loadCredentials() {
        const saved = localStorage.getItem('youtube_auth');
        if (saved) {
            try {
                const auth = JSON.parse(saved);
                this.clientId = auth.clientId;
                this.accessToken = auth.accessToken;
                this.refreshToken = auth.refreshToken;
                this.tokenExpiry = auth.tokenExpiry;
                this.apiKey = auth.apiKey;

                // Check if token is still valid
                if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                    this.isAuthenticated = true;
                }
            } catch (error) {
                console.error('Error loading YouTube credentials:', error);
            }
        }
    }

    saveCredentials() {
        const auth = {
            clientId: this.clientId,
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            tokenExpiry: this.tokenExpiry,
            apiKey: this.apiKey
        };
        localStorage.setItem('youtube_auth', JSON.stringify(auth));
    }

    async signIn(clientId, clientSecret = null) {
        this.clientId = clientId;

        // Check if running in Electron (desktop app)
        const isElectron = window.electron && window.electron.isElectron;

        // Generate random state for CSRF protection
        const state = crypto.randomUUID();
        sessionStorage.setItem('youtube_oauth_state', state);

        const scope = 'https://www.googleapis.com/auth/youtube.readonly';

        if (isElectron) {
            // Electron OAuth flow using loopback redirect
            // Google requires http://127.0.0.1 for desktop apps
            return this.signInElectron(clientId, scope, state);
        } else {
            // Web OAuth flow (original implementation)
            return this.signInWeb(clientId, scope, state);
        }
    }

    async signInElectron(clientId, scope, state) {
        // Start the OAuth callback server in the main process
        const serverInfo = await window.electron.oauth.startServer();
        const redirectUri = serverInfo.redirectUri;

        console.log('Electron OAuth: Using redirect URI:', redirectUri);

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${encodeURIComponent(state)}`;

        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const popup = window.open(
            authUrl,
            'YouTube Sign In',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        return new Promise((resolve, reject) => {
            let resolved = false;

            // Listen for OAuth callback from main process
            window.electron.oauth.onCallback((data) => {
                if (resolved) return;

                console.log('Received OAuth callback:', data);

                // The token is in the URL hash fragment
                // We need to get it from the popup's URL after redirect
                try {
                    if (popup && !popup.closed) {
                        const popupUrl = popup.location.href;
                        if (popupUrl.includes('access_token=')) {
                            this.handleOAuthResponse(popupUrl, state, resolve, reject);
                            resolved = true;
                            popup.close();
                            window.electron.oauth.stopServer();
                        }
                    }
                } catch (e) {
                    // Cross-origin error, continue
                }
            });

            // Also poll the popup URL for the token (fallback)
            const checkPopup = setInterval(() => {
                if (resolved) {
                    clearInterval(checkPopup);
                    return;
                }

                try {
                    if (!popup || popup.closed) {
                        clearInterval(checkPopup);
                        if (!resolved) {
                            window.electron.oauth.stopServer();
                            reject(new Error('Sign-in popup was closed'));
                        }
                        return;
                    }

                    const popupUrl = popup.location.href;
                    if (popupUrl.includes('access_token=')) {
                        clearInterval(checkPopup);
                        resolved = true;
                        popup.close();
                        window.electron.oauth.stopServer();
                        this.handleOAuthResponse(popupUrl, state, resolve, reject);
                    }
                } catch (error) {
                    // Cross-origin SecurityError - popup hasn't redirected back yet
                    if (error.name !== 'SecurityError') {
                        console.error('OAuth popup error:', error);
                    }
                }
            }, 500);

            // Timeout after 5 minutes
            setTimeout(() => {
                if (!resolved) {
                    clearInterval(checkPopup);
                    if (popup && !popup.closed) popup.close();
                    window.electron.oauth.stopServer();
                    reject(new Error('Sign-in timeout'));
                }
            }, 300000);
        });
    }

    async signInWeb(clientId, scope, state) {
        // Web OAuth flow - uses current page origin as redirect
        const redirectUri = window.location.origin + window.location.pathname;

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${encodeURIComponent(state)}`;

        // Open OAuth popup
        const width = 500;
        const height = 600;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;

        const popup = window.open(
            authUrl,
            'YouTube Sign In',
            `width=${width},height=${height},left=${left},top=${top}`
        );

        return new Promise((resolve, reject) => {
            const checkPopup = setInterval(() => {
                try {
                    if (!popup || popup.closed) {
                        clearInterval(checkPopup);
                        reject(new Error('Sign-in popup was closed'));
                        return;
                    }

                    const popupUrl = popup.location.href;
                    if (popupUrl.includes('access_token=')) {
                        clearInterval(checkPopup);
                        popup.close();
                        this.handleOAuthResponse(popupUrl, state, resolve, reject);
                    }
                } catch (error) {
                    if (error.name !== 'SecurityError') {
                        console.error('OAuth popup error:', error);
                        clearInterval(checkPopup);
                        if (popup && !popup.closed) popup.close();
                        reject(error);
                    }
                }
            }, 500);

            setTimeout(() => {
                clearInterval(checkPopup);
                if (popup && !popup.closed) popup.close();
                reject(new Error('Sign-in timeout'));
            }, 300000);
        });
    }

    handleOAuthResponse(url, expectedState, resolve, reject) {
        // Parse token from URL hash fragment
        const hashPart = url.split('#')[1];
        if (!hashPart) {
            reject(new Error('No token in OAuth response'));
            return;
        }

        const params = new URLSearchParams(hashPart);

        // Validate CSRF state
        const returnedState = params.get('state');
        const storedState = sessionStorage.getItem('youtube_oauth_state');
        sessionStorage.removeItem('youtube_oauth_state');

        if (returnedState !== storedState) {
            reject(new Error('Invalid OAuth state - possible CSRF attack'));
            return;
        }

        this.accessToken = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in')) || 3600;
        this.tokenExpiry = Date.now() + (expiresIn * 1000);
        this.isAuthenticated = true;

        this.saveCredentials();
        resolve(true);
    }

    async refreshAccessToken() {
        if (!this.refreshToken || !this.clientId) {
            return false;
        }

        try {
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    client_id: this.clientId,
                    refresh_token: this.refreshToken,
                    grant_type: 'refresh_token'
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.accessToken = data.access_token;
                const expiresIn = data.expires_in || 3600;
                this.tokenExpiry = Date.now() + (expiresIn * 1000);
                this.isAuthenticated = true;
                this.saveCredentials();
                return true;
            }
        } catch (error) {
            console.error('Error refreshing token:', error);
        }

        return false;
    }

    signOut() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.isAuthenticated = false;
        localStorage.removeItem('youtube_auth');
    }

    async ensureValidToken() {
        // Check if token needs refresh
        if (this.tokenExpiry && Date.now() > this.tokenExpiry - 60000) {
            // Token expired or expiring soon
            if (this.refreshToken) {
                await this.refreshAccessToken();
            } else {
                this.isAuthenticated = false;
                return false;
            }
        }
        return this.isAuthenticated;
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;
        const results = [];

        try {
            // Check if we have valid authentication
            const hasValidToken = await this.ensureValidToken();

            // For demo/testing without credentials, return mock data
            if (!hasValidToken && !this.apiKey) {
                return this.getMockData(keywords, minViewers);
            }

            // Prepare request headers
            const headers = {};
            let authParam = '';

            if (hasValidToken) {
                // Use OAuth token (preferred)
                headers['Authorization'] = `Bearer ${this.accessToken}`;
            } else if (this.apiKey) {
                // Fall back to API key
                authParam = `&key=${this.apiKey}`;
            }

            // Real API implementation with rate limit handling
            for (const keyword of keywords) {
                const searchUrl = hasValidToken
                    ? `${this.apiBase}/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(keyword)}&maxResults=25`
                    : `${this.apiBase}/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(keyword)}&maxResults=25${authParam}`;

                const response = await this.fetchWithRetry(searchUrl, { headers });

                if (response.ok) {
                    const data = await response.json();

                    if (!data.items || data.items.length === 0) continue;

                    // Batch video IDs for details request
                    const videoIds = data.items.map(video => video.id.videoId).join(',');

                    const detailsUrl = hasValidToken
                        ? `${this.apiBase}/videos?part=liveStreamingDetails,statistics,snippet&id=${videoIds}`
                        : `${this.apiBase}/videos?part=liveStreamingDetails,statistics,snippet&id=${videoIds}${authParam}`;

                    const detailsResponse = await this.fetchWithRetry(detailsUrl, { headers });

                    if (detailsResponse.ok) {
                        const details = await detailsResponse.json();

                        for (const item of details.items) {
                            const viewers = parseInt(item.liveStreamingDetails?.concurrentViewers) || 0;

                            if (viewers >= minViewers && item.snippet.liveBroadcastContent === 'live') {
                                results.push({
                                    platform: 'youtube',
                                    platformIcon: '🔴',
                                    username: item.snippet.channelTitle,
                                    displayName: item.snippet.channelTitle,
                                    title: item.snippet.title,
                                    viewers: viewers,
                                    url: `https://youtube.com/watch?v=${item.id}`,
                                    thumbnailUrl: item.snippet.thumbnails.medium?.url,
                                    isLive: true,
                                    keyword: keyword
                                });
                            }
                        }
                    }
                } else if (response.status === 401) {
                    // Token expired, try to refresh
                    if (await this.refreshAccessToken()) {
                        // Retry this keyword
                        return this.scan(keywords, minViewers);
                    } else {
                        this.isAuthenticated = false;
                        console.error('YouTube authentication expired');
                    }
                }
            }
        } catch (error) {
            console.error('YouTube scan error:', error);
            return this.getMockData(keywords, minViewers);
        } finally {
            this.scanning = false;
        }

        this.results = results;
        return results;
    }

    getMockData(keywords, minViewers) {
        const mockStreams = [];

        keywords.forEach(keyword => {
            const count = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < count; i++) {
                const viewers = Math.floor(Math.random() * 3000) + 100;
                if (viewers >= minViewers) {
                    mockStreams.push({
                        platform: 'youtube',
                        platformIcon: '🔴',
                        username: `${keyword}Channel${i}`,
                        displayName: `${keyword} Live ${i}`,
                        title: `🔴 LIVE: ${keyword} - Amazing Content!`,
                        viewers: viewers,
                        url: `https://youtube.com/watch?v=demo${i}`,
                        isLive: true,
                        keyword: keyword
                    });
                }
            }
        });

        this.results = mockStreams;
        return mockStreams;
    }
}

// Kick Plugin
class KickPlugin extends ScannerPlugin {
    constructor() {
        super('Kick Scanner', 'kick', '🟢');
        this.apiBase = 'https://kick.com/api/v2';
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;

        try {
            // Kick doesn't have official API yet, using mock data
            return this.getMockData(keywords, minViewers);
        } finally {
            this.scanning = false;
        }
    }

    getMockData(keywords, minViewers) {
        const mockStreams = [];

        keywords.forEach(keyword => {
            const count = Math.floor(Math.random() * 2);
            for (let i = 0; i < count; i++) {
                const viewers = Math.floor(Math.random() * 1000) + 20;
                if (viewers >= minViewers) {
                    mockStreams.push({
                        platform: 'kick',
                        platformIcon: '🟢',
                        username: `${keyword}_kick_${i}`,
                        displayName: `${keyword}Streamer${i}`,
                        title: `${keyword} Stream on Kick!`,
                        viewers: viewers,
                        url: `https://kick.com/${keyword}_kick_${i}`,
                        isLive: true,
                        keyword: keyword
                    });
                }
            }
        });

        this.results = mockStreams;
        return mockStreams;
    }
}

// TikTok Live Plugin
class TikTokPlugin extends ScannerPlugin {
    constructor() {
        super('TikTok Live Scanner', 'tiktok', '⚫');
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;

        try {
            // TikTok Live API is restricted, using mock data
            return this.getMockData(keywords, minViewers);
        } finally {
            this.scanning = false;
        }
    }

    getMockData(keywords, minViewers) {
        const mockStreams = [];

        keywords.forEach(keyword => {
            const count = Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                const viewers = Math.floor(Math.random() * 2000) + 50;
                if (viewers >= minViewers) {
                    mockStreams.push({
                        platform: 'tiktok',
                        platformIcon: '⚫',
                        username: `@${keyword.toLowerCase()}${i}`,
                        displayName: `@${keyword.toLowerCase()}${i}`,
                        title: `🎵 ${keyword} - Live Now!`,
                        viewers: viewers,
                        url: `https://tiktok.com/@${keyword.toLowerCase()}${i}/live`,
                        isLive: Math.random() > 0.2,
                        keyword: keyword
                    });
                }
            }
        });

        this.results = mockStreams;
        return mockStreams;
    }
}

// Plugin Manager
class PluginManager {
    constructor() {
        this.plugins = [
            new TwitchPlugin(),
            new YouTubePlugin(),
            new KickPlugin(),
            new TikTokPlugin()
        ];

        // Activate all plugins by default
        this.plugins.forEach(plugin => plugin.activate());
    }

    getPlugin(platform) {
        return this.plugins.find(p => p.platform === platform);
    }

    getActivePlugins() {
        return this.plugins.filter(p => p.active);
    }

    async scanAll(keywords, minViewers = 0) {
        const activePlugins = this.getActivePlugins();
        const allResults = [];

        // Scan all active plugins in parallel
        const scanPromises = activePlugins.map(plugin =>
            plugin.scan(keywords, minViewers).catch(err => {
                console.error(`${plugin.name} scan failed:`, err);
                return [];
            })
        );

        const results = await Promise.all(scanPromises);

        // Flatten results
        results.forEach(platformResults => {
            allResults.push(...platformResults);
        });

        // Sort by viewer count (descending)
        allResults.sort((a, b) => b.viewers - a.viewers);

        return allResults;
    }

    togglePlugin(platform, active) {
        const plugin = this.getPlugin(platform);
        if (plugin) {
            if (active) {
                plugin.activate();
            } else {
                plugin.deactivate();
            }
        }
    }
}

// Export for use in scanner.js
window.PluginManager = PluginManager;
