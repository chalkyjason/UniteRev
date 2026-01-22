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
}

// Twitch Plugin
class TwitchPlugin extends ScannerPlugin {
    constructor() {
        super('Twitch Scanner', 'twitch', '🟣');
        this.apiBase = 'https://api.twitch.tv/helix';
        this.clientId = null; // Users will need to provide their own
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;
        const results = [];

        try {
            // For demo/testing without API key, return mock data
            if (!this.clientId) {
                return this.getMockData(keywords, minViewers);
            }

            // Real API implementation would go here
            for (const keyword of keywords) {
                const response = await fetch(
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
    }

    async scan(keywords, minViewers = 0) {
        this.scanning = true;
        const results = [];

        try {
            // For demo/testing without API key, return mock data
            if (!this.apiKey) {
                return this.getMockData(keywords, minViewers);
            }

            // Real API implementation
            for (const keyword of keywords) {
                const response = await fetch(
                    `${this.apiBase}/search?part=snippet&eventType=live&type=video&q=${encodeURIComponent(keyword)}&key=${this.apiKey}`
                );

                if (response.ok) {
                    const data = await response.json();

                    for (const video of data.items) {
                        const videoId = video.id.videoId;
                        const detailsResponse = await fetch(
                            `${this.apiBase}/videos?part=liveStreamingDetails,statistics&id=${videoId}&key=${this.apiKey}`
                        );

                        if (detailsResponse.ok) {
                            const details = await detailsResponse.json();
                            const item = details.items[0];
                            const viewers = parseInt(item.liveStreamingDetails?.concurrentViewers) || 0;

                            if (viewers >= minViewers) {
                                results.push({
                                    platform: 'youtube',
                                    platformIcon: '🔴',
                                    username: video.snippet.channelTitle,
                                    displayName: video.snippet.channelTitle,
                                    title: video.snippet.title,
                                    viewers: viewers,
                                    url: `https://youtube.com/watch?v=${videoId}`,
                                    thumbnailUrl: video.snippet.thumbnails.medium.url,
                                    isLive: true,
                                    keyword: keyword
                                });
                            }
                        }
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
