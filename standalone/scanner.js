// Stream Scanner - Main Controller
// Manages keyword-based stream discovery across multiple platforms

class StreamScanner {
    constructor() {
        this.pluginManager = new PluginManager();
        this.keywords = [];
        this.scanInterval = 60; // seconds
        this.minViewers = 0;
        this.scanTimer = null;
        this.isScanning = false;
        this.results = [];

        this.loadSettings();
        this.setupEventListeners();
        this.renderPluginList();
        this.renderKeywordTags();
    }

    loadSettings() {
        const saved = localStorage.getItem('scanner_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.keywords = settings.keywords || [];
            this.scanInterval = settings.scanInterval || 60;
            this.minViewers = settings.minViewers || 0;

            // Update UI
            document.getElementById('scanInterval').value = this.scanInterval;
            document.getElementById('minViewers').value = this.minViewers;
        }
    }

    saveSettings() {
        const settings = {
            keywords: this.keywords,
            scanInterval: this.scanInterval,
            minViewers: this.minViewers
        };
        localStorage.setItem('scanner_settings', JSON.stringify(settings));
    }

    setupEventListeners() {
        // Keyword input - add on Enter
        const keywordInput = document.getElementById('keywordInput');
        keywordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const keyword = keywordInput.value.trim();
                if (keyword && !this.keywords.includes(keyword)) {
                    this.keywords.push(keyword);
                    this.renderKeywordTags();
                    this.saveSettings();
                    keywordInput.value = '';
                }
            }
        });

        // Scan interval change
        document.getElementById('scanInterval').addEventListener('change', (e) => {
            this.scanInterval = parseInt(e.target.value);
            this.saveSettings();

            // Restart scanning if already running
            if (this.isScanning) {
                this.stopScanning();
                this.startScanning();
            }
        });

        // Min viewers change
        document.getElementById('minViewers').addEventListener('input', (e) => {
            this.minViewers = parseInt(e.target.value) || 0;
            this.saveSettings();
        });
    }

    renderKeywordTags() {
        const container = document.getElementById('keywordTags');
        container.innerHTML = '';

        this.keywords.forEach(keyword => {
            const tag = document.createElement('div');
            tag.className = 'keyword-tag';
            tag.innerHTML = `
                ${keyword}
                <button onclick="scanner.removeKeyword('${keyword}')">×</button>
            `;
            container.appendChild(tag);
        });
    }

    removeKeyword(keyword) {
        this.keywords = this.keywords.filter(k => k !== keyword);
        this.renderKeywordTags();
        this.saveSettings();
    }

    renderPluginList() {
        const container = document.getElementById('pluginList');
        container.innerHTML = '';

        this.pluginManager.plugins.forEach(plugin => {
            const item = document.createElement('div');
            item.className = 'plugin-item';
            if (plugin.active) item.classList.add('active');
            if (plugin.scanning) item.classList.add('scanning');

            const statusClass = plugin.scanning ? 'scanning' : (plugin.active ? 'active' : 'inactive');
            const statusText = plugin.scanning ? 'Scanning...' : (plugin.active ? 'Active' : 'Inactive');

            item.innerHTML = `
                <div class="plugin-header">
                    <div class="plugin-info">
                        <div class="plugin-name">${plugin.icon} ${plugin.name}</div>
                        <div class="plugin-desc">${plugin.results.length} streams found</div>
                    </div>
                    <span class="plugin-status ${statusClass}">${statusText}</span>
                </div>
                <div class="plugin-controls">
                    <button class="btn btn-secondary" onclick="scanner.togglePlugin('${plugin.platform}')">
                        ${plugin.active ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn btn-secondary" onclick="scanner.configurePlugin('${plugin.platform}')">
                        ⚙️ Configure
                    </button>
                </div>
            `;

            container.appendChild(item);
        });
    }

    togglePlugin(platform) {
        const plugin = this.pluginManager.getPlugin(platform);
        if (plugin) {
            plugin.active = !plugin.active;
            this.renderPluginList();
        }
    }

    configurePlugin(platform) {
        const plugin = this.pluginManager.getPlugin(platform);
        if (!plugin) return;

        let configHtml = `
            <h3>Configure ${plugin.name}</h3>
            <p>API configuration coming soon...</p>
        `;

        if (platform === 'twitch') {
            configHtml = `
                <h3>Configure Twitch Scanner</h3>
                <div class="form-group">
                    <label class="form-label">Client ID</label>
                    <input type="text" class="form-input" id="twitchClientId"
                           placeholder="Your Twitch Client ID"
                           value="${plugin.clientId || ''}">
                    <div class="form-help">Get from: https://dev.twitch.tv/console</div>
                </div>
                <div class="form-group">
                    <label class="form-label">Access Token</label>
                    <input type="password" class="form-input" id="twitchAccessToken"
                           placeholder="Your Access Token"
                           value="${plugin.accessToken || ''}">
                </div>
                <button class="btn btn-primary" onclick="scanner.savePluginConfig('twitch')">
                    Save Configuration
                </button>
            `;
        } else if (platform === 'youtube') {
            configHtml = `
                <h3>Configure YouTube Scanner</h3>
                <div class="form-group">
                    <label class="form-label">API Key</label>
                    <input type="text" class="form-input" id="youtubeApiKey"
                           placeholder="Your YouTube API Key"
                           value="${plugin.apiKey || ''}">
                    <div class="form-help">Get from: https://console.cloud.google.com/</div>
                </div>
                <button class="btn btn-primary" onclick="scanner.savePluginConfig('youtube')">
                    Save Configuration
                </button>
            `;
        }

        // Show in modal or alert (basic implementation)
        const modal = confirm(`${plugin.name} configuration requires a modal dialog. API keys needed for live data. Currently using demo data.`);
    }

    savePluginConfig(platform) {
        const plugin = this.pluginManager.getPlugin(platform);
        if (!plugin) return;

        if (platform === 'twitch') {
            plugin.clientId = document.getElementById('twitchClientId')?.value;
            plugin.accessToken = document.getElementById('twitchAccessToken')?.value;
        } else if (platform === 'youtube') {
            plugin.apiKey = document.getElementById('youtubeApiKey')?.value;
        }

        // Save to localStorage
        const configs = JSON.parse(localStorage.getItem('plugin_configs') || '{}');
        configs[platform] = {
            clientId: plugin.clientId,
            accessToken: plugin.accessToken,
            apiKey: plugin.apiKey
        };
        localStorage.setItem('plugin_configs', JSON.stringify(configs));

        alert('Configuration saved!');
    }

    async startScanning() {
        if (this.keywords.length === 0) {
            alert('Please add at least one keyword to scan for.');
            return;
        }

        if (this.isScanning) {
            return;
        }

        this.isScanning = true;
        this.showScanningIndicator(true);

        // Initial scan
        await this.performScan();

        // Set up interval scanning
        this.scanTimer = setInterval(() => {
            this.performScan();
        }, this.scanInterval * 1000);

        // Update button
        const btn = document.querySelector('button[onclick*="startScanning"]');
        if (btn) {
            btn.textContent = '⏸️ Stop Scanning';
            btn.onclick = () => this.stopScanning();
        }
    }

    stopScanning() {
        this.isScanning = false;

        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
        }

        this.showScanningIndicator(false);

        // Update button
        const btn = document.querySelector('button[onclick*="stopScanning"]');
        if (btn) {
            btn.textContent = '🚀 Start Scanning';
            btn.onclick = () => this.startScanning();
        }

        // Clear scanning status from plugins
        this.pluginManager.plugins.forEach(plugin => {
            plugin.scanning = false;
        });
        this.renderPluginList();
    }

    async performScan() {
        console.log('Scanning for:', this.keywords);

        this.renderPluginList(); // Update to show scanning status

        try {
            const results = await this.pluginManager.scanAll(this.keywords, this.minViewers);
            this.results = results;
            this.renderResults(results);
            this.renderPluginList(); // Update with new counts
        } catch (error) {
            console.error('Scan error:', error);
        }
    }

    showScanningIndicator(show) {
        const indicator = document.getElementById('scanningIndicator');
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        }
    }

    renderResults(results) {
        const container = document.getElementById('resultsContainer');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div>No streams found matching your keywords</div>
                    <div style="margin-top: 8px; font-size: 14px; opacity: 0.8;">
                        Try different keywords or lower the minimum viewers
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = '<div class="results-grid"></div>';
        const grid = container.querySelector('.results-grid');

        results.forEach(stream => {
            const card = document.createElement('div');
            card.className = 'result-card';
            if (stream.isLive) card.classList.add('live');

            const formattedViewers = stream.viewers >= 1000
                ? (stream.viewers / 1000).toFixed(1) + 'K'
                : stream.viewers;

            card.innerHTML = `
                <div class="result-header">
                    <div class="result-avatar">
                        <span class="platform-badge">${stream.platformIcon}</span>
                    </div>
                    <div class="result-info">
                        <div class="result-name">${stream.displayName}</div>
                        <div class="result-meta">
                            ${stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1)}
                            ${stream.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="result-title">${stream.title}</div>
                <div class="result-stats">
                    <span>👁️ ${formattedViewers} viewers</span>
                    ${stream.game ? `<span>🎮 ${stream.game}</span>` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="scanner.openStream('${stream.url}')">
                        ▶️ Watch
                    </button>
                    <button class="btn btn-secondary" onclick="scanner.addToMonitor('${stream.username}', '${stream.platform}')">
                        ⭐ Monitor
                    </button>
                </div>
            `;

            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.openStream(stream.url);
                }
            });

            grid.appendChild(card);
        });
    }

    openStream(url) {
        window.open(url, '_blank');
    }

    addToMonitor(username, platform) {
        // Future feature: add stream to monitoring list
        alert(`Monitoring feature coming soon!\n\nWill notify you when ${username} goes live on ${platform}.`);
    }

    exportResults() {
        const data = {
            scannedAt: new Date().toISOString(),
            keywords: this.keywords,
            totalResults: this.results.length,
            streams: this.results
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stream-scan-${Date.now()}.json`;
        a.click();
    }
}

// Initialize scanner when page loads
let scanner;
document.addEventListener('DOMContentLoaded', () => {
    scanner = new StreamScanner();

    // Expose globally for onclick handlers
    window.scanner = scanner;
});
