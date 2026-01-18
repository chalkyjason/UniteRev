// Multi-Stream Manager - Premium Version
// Includes license key validation and feature gating

const app = {
    // License Management
    licenseType: 'FREE', // FREE, PREMIUM, PRO
    licenseKey: null,

    // Feature Limits
    limits: {
        FREE: {
            maxStreams: 4,
            maxSaved: 10,
            allowedLayouts: ['1x1', '1x2', '2x1', '2x2'],
            features: {
                recording: false,
                hotkeys: false,
                themes: false,
                streamGroups: false,
                customOverlays: false,
                qualitySelector: false
            }
        },
        PREMIUM: {
            maxStreams: 16,
            maxSaved: Infinity,
            allowedLayouts: ['1x1', '1x2', '2x1', '2x2', '2x3', '3x2', '3x3', '4x2', '2x4', '4x4'],
            features: {
                recording: true,
                hotkeys: true,
                themes: true,
                streamGroups: true,
                customOverlays: true,
                qualitySelector: true
            }
        },
        PRO: {
            maxStreams: 25,
            maxSaved: Infinity,
            allowedLayouts: ['1x1', '1x2', '2x1', '2x2', '2x3', '3x2', '3x3', '4x2', '2x4', '4x4', '5x5'],
            features: {
                recording: true,
                hotkeys: true,
                themes: true,
                streamGroups: true,
                customOverlays: true,
                qualitySelector: true,
                apiAccess: true,
                cloudSync: true,
                multiInstance: true
            }
        }
    },

    // State (same as before)
    gridLayout: '2x2',
    gridStreams: [],
    activeAudioIndex: null,
    savedStreams: [],
    selectedSlot: null,

    // Initialize
    init() {
        this.loadLicense();
        this.loadState();
        this.render();
        this.updateLayoutButtons();
        this.renderSavedStreams();
        this.updateLicenseUI();
    },

    // License Management
    loadLicense() {
        const stored = localStorage.getItem('multistream_license');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (this.validateLicense(data.key)) {
                    this.licenseType = data.type;
                    this.licenseKey = data.key;
                }
            } catch (e) {
                console.error('License load error:', e);
            }
        }
    },

    saveLicense(type, key) {
        this.licenseType = type;
        this.licenseKey = key;
        localStorage.setItem('multistream_license', JSON.stringify({ type, key }));
        this.updateLicenseUI();
        this.render();
    },

    validateLicense(key) {
        if (!key) return false;

        // Simple validation: Check format and checksum
        // Format: MULTI-XXXXX-XXXXX-XXXXX
        const parts = key.split('-');
        if (parts.length !== 4 || parts[0] !== 'MULTI') {
            return false;
        }

        // In production, validate against server or use encryption
        // For now, check against known test keys
        const validKeys = {
            'MULTI-PREM1-UM12-3456': 'PREMIUM',
            'MULTI-PRO12-3456-7890': 'PRO',
            // Add more keys or implement server validation
        };

        return validKeys[key] || false;
    },

    activateLicense() {
        const key = prompt('Enter your license key:');
        if (!key) return;

        const licenseType = this.validateLicense(key);
        if (licenseType) {
            this.saveLicense(licenseType, key);
            alert(`✅ ${licenseType} license activated successfully!`);
            location.reload();
        } else {
            alert('❌ Invalid license key. Please check and try again.');
        }
    },

    updateLicenseUI() {
        const badge = document.getElementById('licenseBadge');
        if (badge) {
            if (this.licenseType === 'FREE') {
                badge.innerHTML = `
                    <span style="color: #94A3B8;">FREE</span>
                    <button onclick="app.showUpgradeModal()" class="btn-upgrade">Upgrade</button>
                `;
            } else {
                badge.innerHTML = `
                    <span style="color: #10B981; font-weight: 600;">✓ ${this.licenseType}</span>
                `;
            }
        }
    },

    // Feature Gating
    canUseFeature(feature) {
        const limits = this.limits[this.licenseType];
        return limits.features[feature] === true;
    },

    canAddStream() {
        const limit = this.limits[this.licenseType].maxStreams;
        const current = this.gridStreams.filter(s => s !== null).length;

        if (current >= limit) {
            this.showUpgradeModal('stream_limit');
            return false;
        }
        return true;
    },

    canSaveStream() {
        const limit = this.limits[this.licenseType].maxSaved;

        if (this.savedStreams.length >= limit) {
            this.showUpgradeModal('saved_limit');
            return false;
        }
        return true;
    },

    canUseLayout(layout) {
        const allowed = this.limits[this.licenseType].allowedLayouts;

        if (!allowed.includes(layout)) {
            this.showUpgradeModal('layout_limit');
            return false;
        }
        return true;
    },

    showUpgradeModal(reason) {
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            modal.classList.add('active');

            // Update message based on reason
            const messages = {
                stream_limit: `You've reached the limit of ${this.limits[this.licenseType].maxStreams} streams for the FREE version.`,
                saved_limit: `You've reached the limit of ${this.limits[this.licenseType].maxSaved} saved streams for the FREE version.`,
                layout_limit: 'This grid layout is only available in the PREMIUM version.',
                feature_limit: 'This feature is only available in the PREMIUM version.'
            };

            const msg = document.getElementById('upgradeMessage');
            if (msg) {
                msg.textContent = messages[reason] || messages.feature_limit;
            }
        }
    },

    closeUpgradeModal() {
        const modal = document.getElementById('upgradeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Grid Layout (with feature gating)
    setLayout(layout) {
        if (!this.canUseLayout(layout)) {
            return;
        }

        this.gridLayout = layout;
        const [rows, cols] = layout.split('x').map(Number);
        const newTotal = rows * cols;

        // Resize grid array
        const newGrid = Array(newTotal).fill(null);
        for (let i = 0; i < Math.min(this.gridStreams.length, newTotal); i++) {
            newGrid[i] = this.gridStreams[i];
        }
        this.gridStreams = newGrid;

        if (this.activeAudioIndex >= newTotal) {
            this.activeAudioIndex = null;
        }

        this.updateLayoutButtons();
        this.render();
        this.saveState();
    },

    // Add Stream (with feature gating)
    addStream() {
        const name = document.getElementById('streamName').value.trim();
        const url = document.getElementById('streamUrl').value.trim();
        const shouldSave = document.getElementById('saveStream').checked;

        if (!name || !url) {
            alert('Please enter both name and URL');
            return;
        }

        // Check if can add to grid
        if (!this.canAddStream()) {
            return;
        }

        const stream = { name, url };

        // Save to saved streams if checked
        if (shouldSave) {
            if (!this.canSaveStream()) {
                return;
            }
            this.savedStreams.push(stream);
            this.renderSavedStreams();
        }

        // Add to grid
        if (this.selectedSlot !== null) {
            this.gridStreams[this.selectedSlot] = stream;
        } else {
            const emptyIndex = this.gridStreams.findIndex(s => s === null);
            if (emptyIndex >= 0) {
                this.gridStreams[emptyIndex] = stream;
            }
        }

        this.closeModal();
        this.render();
        this.saveState();
    },

    // Rest of the methods (same as standalone version)
    saveState() {
        localStorage.setItem('multistream_layout', this.gridLayout);
        localStorage.setItem('multistream_grid', JSON.stringify(this.gridStreams));
        localStorage.setItem('multistream_audio', this.activeAudioIndex);
        localStorage.setItem('multistream_saved', JSON.stringify(this.savedStreams));
    },

    loadState() {
        this.gridLayout = localStorage.getItem('multistream_layout') || '2x2';
        this.gridStreams = JSON.parse(localStorage.getItem('multistream_grid') || '[]');
        this.activeAudioIndex = parseInt(localStorage.getItem('multistream_audio') || '-1');
        this.savedStreams = JSON.parse(localStorage.getItem('multistream_saved') || '[]');

        const [rows, cols] = this.gridLayout.split('x').map(Number);
        const total = rows * cols;
        while (this.gridStreams.length < total) {
            this.gridStreams.push(null);
        }
        if (this.gridStreams.length > total) {
            this.gridStreams = this.gridStreams.slice(0, total);
        }
    },

    updateLayoutButtons() {
        const allowed = this.limits[this.licenseType].allowedLayouts;

        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
            const layout = btn.getAttribute('data-layout');

            if (!allowed.includes(layout)) {
                btn.classList.add('locked');
                btn.innerHTML += ' 🔒';
            } else {
                btn.classList.remove('locked');
                btn.innerHTML = btn.innerHTML.replace(' 🔒', '');
            }
        });

        const currentBtn = document.querySelector(`[data-layout="${this.gridLayout}"]`);
        if (currentBtn) {
            currentBtn.classList.add('active');
        }
    },

    render() {
        const [rows, cols] = this.gridLayout.split('x').map(Number);
        const grid = document.getElementById('streamGrid');

        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        grid.innerHTML = '';

        for (let i = 0; i < this.gridStreams.length; i++) {
            const stream = this.gridStreams[i];
            const cell = document.createElement('div');
            cell.className = 'stream-cell';

            if (stream) {
                cell.classList.add('has-stream');
                if (i === this.activeAudioIndex) {
                    cell.classList.add('active-audio');
                }

                const embedUrl = this.getEmbedUrl(stream.url);

                cell.innerHTML = `
                    <iframe
                        class="stream-frame"
                        src="${embedUrl}${i === this.activeAudioIndex ? '' : '&mute=1'}"
                        referrerpolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                    <div class="stream-overlay">
                        <div class="stream-header">
                            <div class="stream-title">${this.escapeHtml(stream.name)}</div>
                            <button class="btn-remove" onclick="app.removeStream(${i}); event.stopPropagation();">✕</button>
                        </div>
                        <div class="stream-footer">
                            <div class="audio-indicator">
                                <span class="audio-icon ${i === this.activeAudioIndex ? 'active' : ''}">
                                    ${i === this.activeAudioIndex ? '🔊' : '🔇'}
                                </span>
                                <span>${i === this.activeAudioIndex ? 'Audio ON' : 'Click for audio'}</span>
                            </div>
                        </div>
                    </div>
                `;

                cell.onclick = () => this.toggleAudio(i);
            } else {
                cell.classList.add('empty-cell');
                cell.innerHTML = `
                    <div class="empty-icon">📺</div>
                    <div>Slot ${i + 1}</div>
                    <div style="font-size: 12px; margin-top: 4px;">Click to add stream</div>
                `;
                cell.onclick = () => this.openModalForSlot(i);
            }

            grid.appendChild(cell);
        }

        this.updateAudioStatus();
    },

    getEmbedUrl(url) {
        // YouTube - Use nocookie domain to avoid embedding restrictions
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const videoId = this.extractYouTubeId(url);
            // Minimal parameters to avoid api.invalidparam errors
            // Note: Some videos may have embedding disabled by uploader
            return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=1`;
        }

        // Twitch - Handle both file:// and http(s):// protocols
        if (url.includes('twitch.tv')) {
            const channel = url.split('twitch.tv/')[1]?.split('/')[0];
            // For file:// protocol, use localhost as parent
            const parent = window.location.hostname || 'localhost';
            return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true`;
        }

        // Facebook Live
        if (url.includes('facebook.com')) {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=true&show_text=false`;
        }

        // Rumble
        if (url.includes('rumble.com')) {
            const videoId = url.split('/').pop()?.split('.html')[0];
            return `https://rumble.com/embed/${videoId}/?pub=4`;
        }

        // Direct iframe src
        if (url.includes('iframe') || url.includes('embed')) {
            return url;
        }

        // Default: try as-is
        return url;
    },

    extractYouTubeId(url) {
        // Handle youtube.com/live/VIDEO_ID format
        if (url.includes('/live/')) {
            const liveMatch = url.match(/\/live\/([a-zA-Z0-9_-]{11})/);
            if (liveMatch) return liveMatch[1];
        }

        // Handle other YouTube URL formats
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : '';
    },

    toggleAudio(index) {
        if (this.activeAudioIndex === index) {
            this.activeAudioIndex = null;
        } else {
            this.activeAudioIndex = index;
        }
        this.render();
        this.saveState();
    },

    updateAudioStatus() {
        const status = document.getElementById('audioStatus');
        if (this.activeAudioIndex !== null && this.activeAudioIndex >= 0) {
            const stream = this.gridStreams[this.activeAudioIndex];
            if (stream) {
                status.innerHTML = `
                    <span class="audio-pulse"></span>
                    <span>Audio: ${this.escapeHtml(stream.name)}</span>
                `;
            }
        } else {
            status.innerHTML = '<span>No audio selected</span>';
        }
    },

    removeStream(index) {
        this.gridStreams[index] = null;
        if (this.activeAudioIndex === index) {
            this.activeAudioIndex = null;
        }
        this.render();
        this.saveState();
    },

    clearAll() {
        if (confirm('Remove all streams from the grid?')) {
            this.gridStreams = this.gridStreams.map(() => null);
            this.activeAudioIndex = null;
            this.render();
            this.saveState();
        }
    },

    renderSavedStreams() {
        const list = document.getElementById('savedStreamsList');
        const limit = this.limits[this.licenseType].maxSaved;

        if (this.savedStreams.length === 0) {
            list.innerHTML = '<p style="color: #64748B; font-size: 14px;">No saved streams yet</p>';
            return;
        }

        const limitText = limit === Infinity ? 'Unlimited' : `${this.savedStreams.length}/${limit}`;

        list.innerHTML = `
            <p style="color: #64748B; font-size: 12px; margin-bottom: 12px;">
                Saved: ${limitText}
            </p>
            ${this.savedStreams.map((stream, index) => `
                <div class="saved-stream-item">
                    <div style="flex: 1; min-width: 0;">
                        <div class="saved-stream-name">${this.escapeHtml(stream.name)}</div>
                        <div class="saved-stream-url">${this.escapeHtml(stream.url)}</div>
                    </div>
                    <div class="saved-stream-actions">
                        <button class="btn-small btn-use" onclick="app.useSavedStream(${index})">Use</button>
                        <button class="btn-small btn-delete" onclick="app.deleteSavedStream(${index})">Delete</button>
                    </div>
                </div>
            `).join('')}
        `;
    },

    useSavedStream(index) {
        const stream = this.savedStreams[index];

        if (!this.canAddStream()) {
            return;
        }

        if (this.selectedSlot !== null) {
            this.gridStreams[this.selectedSlot] = { ...stream };
        } else {
            const emptyIndex = this.gridStreams.findIndex(s => s === null);
            if (emptyIndex >= 0) {
                this.gridStreams[emptyIndex] = { ...stream };
            }
        }

        this.closeModal();
        this.render();
        this.saveState();
    },

    deleteSavedStream(index) {
        if (confirm(`Delete "${this.savedStreams[index].name}" from saved streams?`)) {
            this.savedStreams.splice(index, 1);
            this.renderSavedStreams();
            this.saveState();
        }
    },

    openModal() {
        this.selectedSlot = null;
        document.getElementById('streamName').value = '';
        document.getElementById('streamUrl').value = '';
        document.getElementById('saveStream').checked = false;
        document.getElementById('modal').classList.add('active');
    },

    openModalForSlot(slot) {
        this.selectedSlot = slot;
        this.openModal();
    },

    closeModal() {
        document.getElementById('modal').classList.remove('active');
        this.selectedSlot = null;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle Enter key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
        app.addStream();
    }
    if (e.key === 'Escape') {
        app.closeModal();
        app.closeUpgradeModal();
    }
});
