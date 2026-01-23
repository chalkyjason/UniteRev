// Stream Scanner - Main Controller
// Manages keyword-based stream discovery across multiple platforms

// HTML escape function to prevent XSS attacks
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

                // Validate keyword
                if (!keyword) {
                    return;
                }

                // Length validation
                if (keyword.length > 100) {
                    alert('Keyword too long (maximum 100 characters)');
                    return;
                }

                if (keyword.length < 2) {
                    alert('Keyword too short (minimum 2 characters)');
                    return;
                }

                // Character validation - allow alphanumeric, spaces, hyphens, underscores, and common punctuation
                if (!/^[a-zA-Z0-9\s\-_#&',.!?]+$/.test(keyword)) {
                    alert('Invalid characters in keyword. Use only letters, numbers, spaces, and basic punctuation.');
                    return;
                }

                // Check for duplicates
                if (this.keywords.includes(keyword)) {
                    alert('This keyword is already in your list');
                    return;
                }

                // Check keyword limit from config
                const maxKeywords = window.ScannerConfig ? window.ScannerConfig.MAX_KEYWORDS : 50;
                if (this.keywords.length >= maxKeywords) {
                    alert(`Maximum ${maxKeywords} keywords allowed. Remove some before adding more.`);
                    return;
                }

                this.keywords.push(keyword);
                this.renderKeywordTags();
                this.saveSettings();
                keywordInput.value = '';
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

        // Min viewers change with validation
        document.getElementById('minViewers').addEventListener('input', (e) => {
            let value = parseInt(e.target.value) || 0;

            // Validate range
            if (value < 0) {
                value = 0;
                e.target.value = 0;
            } else if (value > 1000000) {
                value = 1000000;
                e.target.value = 1000000;
            }

            this.minViewers = value;
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
            let statusText = plugin.scanning ? 'Scanning...' : (plugin.active ? 'Active' : 'Inactive');

            // Show auth status for YouTube and Twitch
            let authIndicator = '';
            if (plugin.platform === 'youtube') {
                if (plugin.isAuthenticated) {
                    authIndicator = '<div style="font-size: 11px; color: #10B981; margin-top: 4px;">✓ Signed in to YouTube</div>';
                } else {
                    authIndicator = '<div style="font-size: 11px; color: #F59E0B; margin-top: 4px;">⚠ Not signed in (using demo data)</div>';
                }
            } else if (plugin.platform === 'twitch') {
                if (plugin.isAuthenticated) {
                    authIndicator = '<div style="font-size: 11px; color: #10B981; margin-top: 4px;">✓ Token generated</div>';
                } else {
                    authIndicator = '<div style="font-size: 11px; color: #F59E0B; margin-top: 4px;">⚠ No token (using demo data)</div>';
                }
            }

            item.innerHTML = `
                <div class="plugin-header">
                    <div class="plugin-info">
                        <div class="plugin-name">${plugin.icon} ${plugin.name}</div>
                        <div class="plugin-desc">${plugin.results.length} streams found</div>
                        ${authIndicator}
                    </div>
                    <span class="plugin-status ${statusClass}">${statusText}</span>
                </div>
                <div class="plugin-controls">
                    <button class="btn btn-secondary" onclick="scanner.togglePlugin('${plugin.platform}')">
                        ${plugin.active ? 'Disable' : 'Enable'}
                    </button>
                    <button class="btn btn-secondary" onclick="scanner.configurePlugin('${plugin.platform}')">
                        ${(plugin.platform === 'youtube' || plugin.platform === 'twitch') && plugin.isAuthenticated ? '✓ Configured' : '⚙️ Configure'}
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

        if (platform === 'youtube') {
            this.showYouTubeConfig(plugin);
        } else if (platform === 'twitch') {
            this.showTwitchConfig(plugin);
        } else {
            alert(`Configuration for ${plugin.name} coming soon!`);
        }
    }

    showYouTubeConfig(plugin) {
        const modal = this.createModal();

        if (plugin.isAuthenticated) {
            // Already signed in - show account info and sign out option
            modal.querySelector('.modal-content').innerHTML = `
                <div class="modal-header">
                    <h3>🔴 YouTube Configuration</h3>
                    <button class="modal-close" onclick="scanner.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #D1FAE5; border: 2px solid #10B981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: #065F46; font-weight: 600; margin-bottom: 8px;">✓ Signed In to YouTube</div>
                        <div style="color: #047857; font-size: 14px;">You're using authenticated YouTube API access with higher rate limits.</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Additional API Key (Optional)</label>
                        <input type="text" class="form-input" id="youtubeApiKey"
                               placeholder="Backup API Key"
                               value="${plugin.apiKey || ''}">
                        <div class="form-help">Optional: Add an API key as backup. Get from: <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="scanner.youtubeSignOut()" style="flex: 1;">
                            Sign Out
                        </button>
                        <button class="btn btn-primary" onclick="scanner.saveYouTubeConfig()" style="flex: 1;">
                            Save
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Not signed in - show sign-in options
            modal.querySelector('.modal-content').innerHTML = `
                <div class="modal-header">
                    <h3>🔴 YouTube Configuration</h3>
                    <button class="modal-close" onclick="scanner.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: #92400E; font-weight: 600; margin-bottom: 8px;">⚠ Not Authenticated</div>
                        <div style="color: #B45309; font-size: 14px;">Sign in with Google for real YouTube data and higher rate limits.</div>
                    </div>

                    <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="font-weight: 600; margin-bottom: 12px;">Option 1: OAuth Sign-In (Recommended)</div>
                        <div style="font-size: 14px; color: #64748B; margin-bottom: 12px;">
                            Sign in with your Google account for seamless access to YouTube Live streams.
                        </div>
                        <div class="form-group">
                            <label class="form-label">Google OAuth Client ID</label>
                            <input type="text" class="form-input" id="youtubeClientId"
                                   placeholder="Your Client ID from Google Cloud Console"
                                   value="${plugin.clientId || ''}">
                            <div class="form-help">
                                <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Get Client ID from Google Cloud Console</a>
                                <br>Enable YouTube Data API v3 and create OAuth 2.0 Client ID
                            </div>
                        </div>
                        <button class="btn btn-success" onclick="scanner.youtubeSignIn(event)" style="width: 100%;">
                            🔐 Sign In with Google
                        </button>
                    </div>

                    <div style="background: #F8FAFC; border-radius: 8px; padding: 16px;">
                        <div style="font-weight: 600; margin-bottom: 12px;">Option 2: API Key (Basic)</div>
                        <div style="font-size: 14px; color: #64748B; margin-bottom: 12px;">
                            Use a simple API key for basic access (lower rate limits).
                        </div>
                        <div class="form-group">
                            <label class="form-label">YouTube API Key</label>
                            <input type="text" class="form-input" id="youtubeApiKey"
                                   placeholder="Your YouTube Data API v3 Key"
                                   value="${plugin.apiKey || ''}">
                            <div class="form-help">
                                <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Get API Key from Google Cloud Console</a>
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="scanner.saveYouTubeConfig()" style="width: 100%;">
                            Save API Key
                        </button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    showTwitchConfig(plugin) {
        const modal = this.createModal();

        if (plugin.isAuthenticated) {
            // Already authenticated - show status and sign out option
            modal.querySelector('.modal-content').innerHTML = `
                <div class="modal-header">
                    <h3>🟣 Twitch Configuration</h3>
                    <button class="modal-close" onclick="scanner.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #D1FAE5; border: 2px solid #10B981; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: #065F46; font-weight: 600; margin-bottom: 8px;">✓ Token Generated</div>
                        <div style="color: #047857; font-size: 14px;">You're using authenticated Twitch API access.</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-input" id="twitchClientId"
                               placeholder="Your Twitch Client ID"
                               value="${plugin.clientId || ''}" disabled>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 24px;">
                        <button class="btn btn-secondary" onclick="scanner.twitchSignOut()" style="flex: 1;">
                            Clear Token
                        </button>
                        <button class="btn btn-success" onclick="scanner.twitchGenerateToken()" style="flex: 1;">
                            🔄 Regenerate Token
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Not authenticated - show configuration form
            modal.querySelector('.modal-content').innerHTML = `
                <div class="modal-header">
                    <h3>🟣 Twitch Configuration</h3>
                    <button class="modal-close" onclick="scanner.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: #92400E; font-weight: 600; margin-bottom: 8px;">⚠ No Token</div>
                        <div style="color: #B45309; font-size: 14px;">Generate an access token to scan Twitch streams.</div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-input" id="twitchClientId"
                               placeholder="Your Twitch Client ID"
                               value="${plugin.clientId || ''}">
                        <div class="form-help">Get from: <a href="https://dev.twitch.tv/console" target="_blank">Twitch Developer Console</a></div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client Secret</label>
                        <input type="password" class="form-input" id="twitchClientSecret"
                               placeholder="Your Client Secret"
                               value="">
                        <div class="form-help">Used to generate access tokens (not stored permanently)</div>
                    </div>
                    <button class="btn btn-primary" onclick="scanner.twitchGenerateToken()" style="width: 100%;">
                        🔐 Generate Access Token
                    </button>
                </div>
            `;
        }

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
    }

    createModal() {
        const overlay = document.createElement('div');
        overlay.className = 'config-modal';
        overlay.id = 'configModal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        overlay.appendChild(modalContent);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeModal();
            }
        });

        return overlay;
    }

    closeModal() {
        const modal = document.getElementById('configModal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }

    async youtubeSignIn(event) {
        const clientId = document.getElementById('youtubeClientId')?.value.trim();
        if (!clientId) {
            alert('Please enter your Google OAuth Client ID first.');
            return;
        }

        const plugin = this.pluginManager.getPlugin('youtube');
        if (!plugin) return;

        try {
            const btn = event?.target;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Opening sign-in...';
            }

            await plugin.signIn(clientId);

            this.closeModal();
            this.renderPluginList();
            alert('Successfully signed in to YouTube!');
        } catch (error) {
            alert('Sign-in failed: ' + error.message);
            const btn = event?.target;
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔐 Sign In with Google';
            }
        }
    }

    youtubeSignOut() {
        if (!confirm('Are you sure you want to sign out of YouTube?')) {
            return;
        }

        const plugin = this.pluginManager.getPlugin('youtube');
        if (plugin) {
            plugin.signOut();
            this.closeModal();
            this.renderPluginList();
        }
    }

    saveYouTubeConfig() {
        const plugin = this.pluginManager.getPlugin('youtube');
        if (!plugin) return;

        const apiKey = document.getElementById('youtubeApiKey')?.value.trim();
        if (apiKey) {
            plugin.apiKey = apiKey;
            plugin.saveCredentials();
        }

        this.closeModal();
        alert('YouTube configuration saved!');
    }

    async twitchGenerateToken() {
        const plugin = this.pluginManager.getPlugin('twitch');
        if (!plugin) return;

        const clientId = document.getElementById('twitchClientId')?.value.trim();
        const clientSecret = document.getElementById('twitchClientSecret')?.value.trim();

        if (!clientId || !clientSecret) {
            alert('Please enter both Client ID and Client Secret.');
            return;
        }

        try {
            const btn = event?.target;
            if (btn) {
                btn.disabled = true;
                btn.textContent = '⏳ Generating token...';
            }

            await plugin.generateToken(clientId, clientSecret);

            this.closeModal();
            this.renderPluginList();
            alert('Successfully generated Twitch access token!');
        } catch (error) {
            alert('Token generation failed: ' + error.message);
            const btn = event?.target;
            if (btn) {
                btn.disabled = false;
                btn.textContent = '🔐 Generate Access Token';
            }
        }
    }

    twitchSignOut() {
        if (!confirm('Are you sure you want to clear the Twitch token?')) {
            return;
        }

        const plugin = this.pluginManager.getPlugin('twitch');
        if (plugin) {
            plugin.signOut();
            this.closeModal();
            this.renderPluginList();
        }
    }

    saveTwitchConfig() {
        const plugin = this.pluginManager.getPlugin('twitch');
        if (!plugin) return;

        plugin.clientId = document.getElementById('twitchClientId')?.value.trim();
        const clientSecret = document.getElementById('twitchClientSecret')?.value.trim();

        // Save to localStorage
        const configs = JSON.parse(localStorage.getItem('plugin_configs') || '{}');
        configs.twitch = {
            clientId: plugin.clientId,
            clientSecret: clientSecret
        };
        localStorage.setItem('plugin_configs', JSON.stringify(configs));

        this.closeModal();
        alert('Twitch configuration saved!');
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
                        <span class="platform-badge">${escapeHtml(stream.platformIcon)}</span>
                    </div>
                    <div class="result-info">
                        <div class="result-name">${escapeHtml(stream.displayName)}</div>
                        <div class="result-meta">
                            ${escapeHtml(stream.platform.charAt(0).toUpperCase() + stream.platform.slice(1))}
                            ${stream.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                        </div>
                    </div>
                </div>
                <div class="result-title">${escapeHtml(stream.title)}</div>
                <div class="result-stats">
                    <span>👁️ ${formattedViewers} viewers</span>
                    ${stream.game ? `<span>🎮 ${escapeHtml(stream.game)}</span>` : ''}
                </div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="scanner.openStream('${escapeHtml(stream.url)}')">
                        ▶️ Watch
                    </button>
                    <button class="btn btn-secondary" onclick="scanner.addToMonitor('${escapeHtml(stream.username)}', '${escapeHtml(stream.platform)}')">
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
