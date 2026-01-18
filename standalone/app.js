// Multi-Stream Manager - Simple and Standalone
// No backend needed - everything saves to browser localStorage

const app = {
    // State
    gridLayout: '2x2',
    gridStreams: [],
    activeAudioIndex: null,
    savedStreams: [],
    selectedSlot: null,

    // Initialize
    init() {
        this.loadState();
        this.render();
        this.updateLayoutButtons();
        this.renderSavedStreams();
        this.setupStorageListener();
    },

    // Listen for changes from control panel
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('multistream_')) {
                this.loadState();
                this.render();
                this.updateLayoutButtons();
                this.renderSavedStreams();
            }
        });
    },

    // Save/Load State
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

        // Ensure grid array matches layout
        const [rows, cols] = this.gridLayout.split('x').map(Number);
        const total = rows * cols;
        while (this.gridStreams.length < total) {
            this.gridStreams.push(null);
        }
        if (this.gridStreams.length > total) {
            this.gridStreams = this.gridStreams.slice(0, total);
        }
    },

    // Grid Layout
    setLayout(layout) {
        this.gridLayout = layout;
        const [rows, cols] = layout.split('x').map(Number);
        const newTotal = rows * cols;

        // Resize grid array
        const newGrid = Array(newTotal).fill(null);
        for (let i = 0; i < Math.min(this.gridStreams.length, newTotal); i++) {
            newGrid[i] = this.gridStreams[i];
        }
        this.gridStreams = newGrid;

        // Reset audio if out of bounds
        if (this.activeAudioIndex >= newTotal) {
            this.activeAudioIndex = null;
        }

        this.updateLayoutButtons();
        this.render();
        this.saveState();
    },

    updateLayoutButtons() {
        document.querySelectorAll('.layout-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const [rows, cols] = this.gridLayout.split('x');
        const text = `${rows}×${cols}`;
        document.querySelectorAll('.layout-btn').forEach(btn => {
            if (btn.textContent === text) {
                btn.classList.add('active');
            }
        });
    },

    // Render Grid
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

    // Get Embed URL
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
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : '';
    },

    // Audio Control
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

    // Stream Management
    addStream() {
        const name = document.getElementById('streamName').value.trim();
        const url = document.getElementById('streamUrl').value.trim();
        const shouldSave = document.getElementById('saveStream').checked;

        if (!name || !url) {
            alert('Please enter both name and URL');
            return;
        }

        const stream = { name, url };

        // Save to saved streams if checked
        if (shouldSave) {
            this.savedStreams.push(stream);
            this.renderSavedStreams();
        }

        // Add to grid
        if (this.selectedSlot !== null) {
            this.gridStreams[this.selectedSlot] = stream;
        } else {
            // Find first empty slot
            const emptyIndex = this.gridStreams.findIndex(s => s === null);
            if (emptyIndex >= 0) {
                this.gridStreams[emptyIndex] = stream;
            }
        }

        this.closeModal();
        this.render();
        this.saveState();
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

    // Saved Streams
    renderSavedStreams() {
        const list = document.getElementById('savedStreamsList');
        if (this.savedStreams.length === 0) {
            list.innerHTML = '<p style="color: #64748B; font-size: 14px;">No saved streams yet</p>';
            return;
        }

        list.innerHTML = this.savedStreams.map((stream, index) => `
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
        `).join('');
    },

    useSavedStream(index) {
        const stream = this.savedStreams[index];

        if (this.selectedSlot !== null) {
            this.gridStreams[this.selectedSlot] = { ...stream };
        } else {
            const emptyIndex = this.gridStreams.findIndex(s => s === null);
            if (emptyIndex >= 0) {
                this.gridStreams[emptyIndex] = { ...stream };
            } else {
                alert('Grid is full! Remove a stream or change layout.');
                return;
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

    // Control Panel (Multi-monitor support)
    openControlPanel() {
        const width = 650;
        const height = 900;
        const left = window.screen.width - width - 100;
        const top = 50;

        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
        const controlWindow = window.open('control-panel.html', 'StreamControlPanel', features);

        if (controlWindow) {
            controlWindow.focus();
        } else {
            alert('Pop-up blocked! Please allow pop-ups for this app to use the Control Panel.');
        }
    },

    // Modal
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

    // Utility
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

// Handle Enter key in inputs
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
        app.addStream();
    }
    if (e.key === 'Escape') {
        app.closeModal();
    }
});
