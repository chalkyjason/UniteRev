// Multi-Stream Manager - Simple and Standalone
// No backend needed - everything saves to browser localStorage

const app = {
    // State
    gridLayout: '2x2',
    gridStreams: [],
    activeAudioIndex: null,
    savedStreamers: [], // Changed from savedStreams to savedStreamers
    selectedSlot: null,
    sortableInstance: null,

    // Recording state
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    recordingStartTime: null,
    recordingTimerInterval: null,

    // Audio Mixer state
    audioMixerOpen: false,
    audioContext: null,
    audioChannels: {}, // Map of stream index to audio nodes
    masterGainNode: null,
    masterVolume: 1.0,
    analyserNodes: {}, // For audio metering
    meterUpdateInterval: null,

    // Scene Manager state
    sceneManagerOpen: false,
    scenes: [],
    activeSceneId: null,
    sceneTransitioning: false,

    // Overlay System state
    overlayManagerOpen: false,
    overlays: [],
    selectedOverlayId: null,
    draggingOverlay: null,

    // Transition System state
    transitionType: 'fade',
    transitionDuration: 300,

    // Initialize
    init() {
        try {
            this.loadState();
            this.render();
            this.updateLayoutButtons();
            this.renderSavedStreamers();
            this.setupStorageListener();
            this.initSortable();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize app. Please refresh the page.');
        }
    },

    // Initialize drag-and-drop
    initSortable(retryCount = 0) {
        const grid = document.getElementById('streamGrid');
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }

        // Wait for Sortable library to load with retry limit
        if (typeof Sortable === 'undefined') {
            if (retryCount < 50) {  // Max 5 seconds (50 * 100ms)
                setTimeout(() => this.initSortable(retryCount + 1), 100);
            } else {
                console.error('Failed to load Sortable library after 5 seconds');
                // Show user-friendly message
                const notice = document.createElement('div');
                notice.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #FEE2E2; color: #991B1B; padding: 12px 20px; border-radius: 8px; border: 2px solid #DC2626; z-index: 10000;';
                notice.textContent = 'Drag-and-drop disabled: Library failed to load';
                document.body.appendChild(notice);
                setTimeout(() => notice.remove(), 5000);
            }
            return;
        }

        this.sortableInstance = new Sortable(grid, {
            animation: 150,
            handle: '.drag-handle',
            draggable: '.stream-cell:not(.empty-cell)',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            onEnd: (evt) => {
                if (evt.oldIndex === evt.newIndex) return;

                // Reorder the grid streams array
                const movedStream = this.gridStreams[evt.oldIndex];
                this.gridStreams.splice(evt.oldIndex, 1);
                this.gridStreams.splice(evt.newIndex, 0, movedStream);

                // Update active audio index if needed
                if (this.activeAudioIndex === evt.oldIndex) {
                    this.activeAudioIndex = evt.newIndex;
                } else if (evt.oldIndex < this.activeAudioIndex && evt.newIndex >= this.activeAudioIndex) {
                    this.activeAudioIndex--;
                } else if (evt.oldIndex > this.activeAudioIndex && evt.newIndex <= this.activeAudioIndex) {
                    this.activeAudioIndex++;
                }

                this.saveState();
                this.render();
            }
        });
    },

    // Listen for changes from control panel
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith('multistream_')) {
                this.loadState();
                this.render();
                this.updateLayoutButtons();
                this.renderSavedStreamers();
            }
        });
    },

    // Save/Load State
    saveState() {
        try {
            localStorage.setItem('multistream_layout', this.gridLayout);
            localStorage.setItem('multistream_grid', JSON.stringify(this.gridStreams));
            localStorage.setItem('multistream_audio', this.activeAudioIndex);
            localStorage.setItem('multistream_streamers', JSON.stringify(this.savedStreamers));
            localStorage.setItem('multistream_scenes', JSON.stringify(this.scenes));
            localStorage.setItem('multistream_active_scene', this.activeSceneId || '');
            localStorage.setItem('multistream_overlays', JSON.stringify(this.overlays));
            localStorage.setItem('multistream_transition_type', this.transitionType);
            localStorage.setItem('multistream_transition_duration', this.transitionDuration);
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('Storage quota exceeded. Please clear some saved streams.');
                alert('Storage full! Please clear some saved streams or browser data to continue saving.');
            } else if (error.name === 'SecurityError') {
                console.warn('localStorage not available (private browsing mode)');
            } else {
                console.error('Failed to save state:', error);
            }
        }
    },

    loadState() {
        try {
            this.gridLayout = localStorage.getItem('multistream_layout') || '2x2';
            this.gridStreams = JSON.parse(localStorage.getItem('multistream_grid') || '[]');
            this.activeAudioIndex = parseInt(localStorage.getItem('multistream_audio') || '-1');

            // Load streamers (new format) or migrate from old saved streams
            const savedStreamers = localStorage.getItem('multistream_streamers');
            if (savedStreamers) {
                this.savedStreamers = JSON.parse(savedStreamers);
            } else {
                // Migration: convert old saved streams to streamers
                const oldStreams = JSON.parse(localStorage.getItem('multistream_saved') || '[]');
                this.savedStreamers = oldStreams.map(stream => this.convertStreamToStreamer(stream));
            }

            // Load scenes
            this.scenes = JSON.parse(localStorage.getItem('multistream_scenes') || '[]');
            this.activeSceneId = localStorage.getItem('multistream_active_scene') || null;

            // Load overlays
            this.overlays = JSON.parse(localStorage.getItem('multistream_overlays') || '[]');

            // Load transition settings
            this.transitionType = localStorage.getItem('multistream_transition_type') || 'fade';
            this.transitionDuration = parseInt(localStorage.getItem('multistream_transition_duration') || '300');
        } catch (error) {
            console.error('Failed to load state:', error);
            // Use defaults
            this.gridLayout = '2x2';
            this.gridStreams = [];
            this.activeAudioIndex = -1;
            this.savedStreamers = [];
        }

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

    // Convert old stream format to streamer format
    convertStreamToStreamer(stream) {
        const platformInfo = this.extractPlatformInfo(stream.url);
        return {
            id: platformInfo.id,
            platform: platformInfo.platform,
            handle: platformInfo.handle,
            displayName: stream.name,
            profileUrl: stream.url,
            createdAt: Date.now()
        };
    },

    // Extract platform and channel info from URL
    extractPlatformInfo(url) {
        // Twitch
        if (url.includes('twitch.tv')) {
            const handle = url.split('twitch.tv/')[1]?.split('/')[0] || 'unknown';
            return {
                platform: 'twitch',
                handle: handle,
                id: `twitch:${handle}`
            };
        }

        // YouTube - handle @handle format
        if (url.includes('youtube.com/@') || url.includes('youtu.be/@')) {
            const handleMatch = url.match(/\/@([^\/\?]+)/);
            if (handleMatch) {
                const handle = handleMatch[1];
                return {
                    platform: 'youtube',
                    handle: '@' + handle,
                    id: `youtube:@${handle}`
                };
            }
        }

        // YouTube - channel ID format
        if (url.includes('youtube.com/channel/')) {
            const channelMatch = url.match(/\/channel\/([^\/\?]+)/);
            if (channelMatch) {
                const channelId = channelMatch[1];
                return {
                    platform: 'youtube',
                    handle: channelId,
                    id: `youtube:${channelId}`
                };
            }
        }

        // X (Twitter)
        if (url.includes('x.com') || url.includes('twitter.com')) {
            // Extract username from /USERNAME/status/ID format
            const usernameMatch = url.match(/(?:x\.com|twitter\.com)\/([^\/]+)/);
            if (usernameMatch) {
                const handle = usernameMatch[1];
                return {
                    platform: 'x',
                    handle: '@' + handle,
                    id: `x:@${handle}`
                };
            }
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            // Extract username from /@username/ format
            const usernameMatch = url.match(/@([^\/\?]+)/);
            if (usernameMatch) {
                const handle = usernameMatch[1];
                return {
                    platform: 'tiktok',
                    handle: '@' + handle,
                    id: `tiktok:@${handle}`
                };
            }
        }

        // Default/unknown
        return {
            platform: 'unknown',
            handle: 'unknown',
            id: `unknown:${Date.now()}`
        };
    },

    // Resolve YouTube channel info using oEmbed
    async resolveYouTubeStreamer(videoUrl) {
        try {
            const endpoint = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`;
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error('YouTube oEmbed request failed');
            }

            const data = await response.json();

            // Extract channel handle from author_url if possible
            let handle = 'unknown';
            if (data.author_url) {
                const handleMatch = data.author_url.match(/\/@([^\/\?]+)/);
                const channelMatch = data.author_url.match(/\/channel\/([^\/\?]+)/);

                if (handleMatch) {
                    handle = '@' + handleMatch[1];
                } else if (channelMatch) {
                    handle = channelMatch[1];
                }
            }

            return {
                id: `youtube:${handle}`,
                platform: 'youtube',
                handle: handle,
                displayName: data.author_name || 'Unknown Channel',
                profileUrl: data.author_url || videoUrl,
                createdAt: Date.now()
            };
        } catch (error) {
            console.error('Failed to resolve YouTube streamer:', error);
            return null;
        }
    },

    // Resolve TikTok user info using oEmbed
    async resolveTikTokStreamer(videoUrl) {
        try {
            const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error('TikTok oEmbed request failed');
            }

            const data = await response.json();

            // Extract username from author_url if available
            let handle = 'unknown';
            if (data.author_url) {
                const handleMatch = data.author_url.match(/@([^\/\?]+)/);
                if (handleMatch) {
                    handle = '@' + handleMatch[1];
                }
            }

            return {
                id: `tiktok:${handle}`,
                platform: 'tiktok',
                handle: handle,
                displayName: data.author_name || data.author_unique_id || 'Unknown TikToker',
                profileUrl: data.author_url || videoUrl,
                createdAt: Date.now()
            };
        } catch (error) {
            console.error('Failed to resolve TikTok streamer:', error);
            return null;
        }
    },

    // Save streamer from current video URL
    async saveStreamerFromUrl(url, customName = null) {
        let streamer = null;

        // Twitch - direct extraction
        if (url.includes('twitch.tv')) {
            const handle = url.split('twitch.tv/')[1]?.split('/')[0];
            streamer = {
                id: `twitch:${handle}`,
                platform: 'twitch',
                handle: handle,
                displayName: customName || handle,
                profileUrl: `https://twitch.tv/${handle}`,
                createdAt: Date.now()
            };
        }
        // YouTube - use oEmbed if it's a video URL
        else if (url.includes('youtube.com/watch') || url.includes('youtube.com/live') || url.includes('youtu.be/')) {
            streamer = await this.resolveYouTubeStreamer(url);
            if (streamer && customName) {
                streamer.displayName = customName;
            }
        }
        // YouTube - handle or channel URL
        else if (url.includes('youtube.com/@') || url.includes('youtube.com/channel/')) {
            const platformInfo = this.extractPlatformInfo(url);
            streamer = {
                id: platformInfo.id,
                platform: 'youtube',
                handle: platformInfo.handle,
                displayName: customName || platformInfo.handle,
                profileUrl: url,
                createdAt: Date.now()
            };
        }
        // TikTok - use oEmbed for video/live URLs
        else if (url.includes('tiktok.com')) {
            streamer = await this.resolveTikTokStreamer(url);
            if (streamer && customName) {
                streamer.displayName = customName;
            }
            // If oEmbed fails, fall back to basic extraction
            if (!streamer) {
                const platformInfo = this.extractPlatformInfo(url);
                streamer = {
                    id: platformInfo.id,
                    platform: 'tiktok',
                    handle: platformInfo.handle,
                    displayName: customName || platformInfo.handle,
                    profileUrl: url,
                    createdAt: Date.now()
                };
            }
        }
        // Other platforms
        else {
            const platformInfo = this.extractPlatformInfo(url);
            streamer = {
                id: platformInfo.id,
                platform: platformInfo.platform,
                handle: platformInfo.handle,
                displayName: customName || 'Unknown',
                profileUrl: url,
                createdAt: Date.now()
            };
        }

        if (streamer) {
            // Check if streamer already exists
            const existingIndex = this.savedStreamers.findIndex(s => s.id === streamer.id);
            if (existingIndex >= 0) {
                // Update existing
                this.savedStreamers[existingIndex] = streamer;
            } else {
                // Add new
                this.savedStreamers.push(streamer);
            }

            this.saveState();
            this.renderSavedStreamers();
            return streamer;
        }

        return null;
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

    // Check if streamer is already saved
    isStreamerSaved(url) {
        const platformInfo = this.extractPlatformInfo(url);
        if (!platformInfo) return false;

        return this.savedStreamers.some(s => s.id === platformInfo.id);
    },

    // Render Grid
    render() {
        try {
            const [rows, cols] = this.gridLayout.split('x').map(Number);
            const grid = document.getElementById('streamGrid');

            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

            grid.innerHTML = '';

        for (let i = 0; i < this.gridStreams.length; i++) {
            const stream = this.gridStreams[i];
            const cell = document.createElement('div');
            cell.className = 'stream-cell';
            cell.dataset.index = i;

            if (stream) {
                cell.classList.add('has-stream');
                if (i === this.activeAudioIndex) {
                    cell.classList.add('active-audio');
                }

                // Apply custom size (grid span)
                const size = stream.size || '1x1';
                const [spanCols, spanRows] = size.split('x').map(Number);
                cell.style.gridColumn = `span ${spanCols}`;
                cell.style.gridRow = `span ${spanRows}`;

                const embedUrl = this.getEmbedUrl(stream.url);
                const isAlreadySaved = this.isStreamerSaved(stream.url);

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
                            <div class="drag-handle" title="Drag to reorder">⋮⋮</div>
                            <div class="stream-title">${this.escapeHtml(stream.name)}</div>
                            <div class="stream-controls">
                                <div class="size-controls" onclick="event.stopPropagation();">
                                    <button class="btn-size ${size === '1x1' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '1x1')" title="1×1">1×1</button>
                                    <button class="btn-size ${size === '2x1' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '2x1')" title="2×1">2×1</button>
                                    <button class="btn-size ${size === '1x2' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '1x2')" title="1×2">1×2</button>
                                    <button class="btn-size ${size === '2x2' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '2x2')" title="2×2">2×2</button>
                                    <button class="btn-size ${size === '3x1' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '3x1')" title="3×1">3×1</button>
                                    <button class="btn-size ${size === '1x3' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '1x3')" title="1×3">1×3</button>
                                    <button class="btn-size ${size === '3x2' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '3x2')" title="3×2">3×2</button>
                                    <button class="btn-size ${size === '2x3' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '2x3')" title="2×3">2×3</button>
                                    <button class="btn-size ${size === '3x3' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '3x3')" title="3×3">3×3</button>
                                    <button class="btn-size ${size === '4x4' ? 'active' : ''}" onclick="app.setStreamSize(${i}, '4x4')" title="4×4">4×4</button>
                                </div>
                                ${!isAlreadySaved ? `<button class="btn-save-streamer" onclick="app.saveStreamerFromStream(${i}); event.stopPropagation();" title="Save streamer to your list">💾</button>` : ''}
                                <button class="btn-remove" onclick="app.removeStream(${i}); event.stopPropagation();">✕</button>
                            </div>
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
                    <!-- Resize Handles -->
                    <div class="resize-handle resize-handle-nw" data-direction="nw" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-ne" data-direction="ne" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-sw" data-direction="sw" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-se" data-direction="se" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-n" data-direction="n" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-s" data-direction="s" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-w" data-direction="w" data-index="${i}"></div>
                    <div class="resize-handle resize-handle-e" data-direction="e" data-index="${i}"></div>
                `;

                // Apply custom positioning if stream has custom dimensions
                if (stream.customSize) {
                    cell.classList.add('custom-size');
                    cell.style.left = stream.customSize.x + 'px';
                    cell.style.top = stream.customSize.y + 'px';
                    cell.style.width = stream.customSize.width + 'px';
                    cell.style.height = stream.customSize.height + 'px';
                    grid.classList.add('free-resize-mode');
                }

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
            this.initSortable(); // Reinitialize sortable after render
            this.initResizeHandles(); // Initialize resize functionality

            // Render overlays on top of the grid
            setTimeout(() => this.renderOverlays(), 100);

            // Update dashboard stats
            this.updateDashboardStats();
        } catch (error) {
            console.error('Render error:', error);
            this.showError('Failed to render streams. Please refresh the page.');
        }
    },

    // Initialize resize handles
    initResizeHandles() {
        const handles = document.querySelectorAll('.resize-handle');

        handles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                e.preventDefault();

                const index = parseInt(handle.dataset.index);
                const direction = handle.dataset.direction;
                const cell = document.querySelector(`.stream-cell[data-index="${index}"]`);
                const grid = document.getElementById('streamGrid');
                const gridRect = grid.getBoundingClientRect();

                if (!cell) return;

                cell.classList.add('resizing');

                // Get current dimensions
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = cell.offsetWidth;
                const startHeight = cell.offsetHeight;
                const startLeft = cell.offsetLeft;
                const startTop = cell.offsetTop;

                // Switch to custom positioning
                const stream = this.gridStreams[index];
                if (!stream.customSize) {
                    stream.customSize = {
                        x: cell.offsetLeft,
                        y: cell.offsetTop,
                        width: startWidth,
                        height: startHeight
                    };
                }

                cell.classList.add('custom-size');
                grid.classList.add('free-resize-mode');

                const onMouseMove = (e) => {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;

                    let newWidth = startWidth;
                    let newHeight = startHeight;
                    let newLeft = startLeft;
                    let newTop = startTop;

                    // Calculate new dimensions based on resize direction
                    if (direction.includes('e')) {
                        newWidth = Math.max(200, startWidth + deltaX);
                    }
                    if (direction.includes('w')) {
                        newWidth = Math.max(200, startWidth - deltaX);
                        newLeft = startLeft + deltaX;
                        if (newWidth === 200) newLeft = startLeft + startWidth - 200;
                    }
                    if (direction.includes('s')) {
                        newHeight = Math.max(150, startHeight + deltaY);
                    }
                    if (direction.includes('n')) {
                        newHeight = Math.max(150, startHeight - deltaY);
                        newTop = startTop + deltaY;
                        if (newHeight === 150) newTop = startTop + startHeight - 150;
                    }

                    // Apply new dimensions
                    cell.style.width = newWidth + 'px';
                    cell.style.height = newHeight + 'px';
                    cell.style.left = newLeft + 'px';
                    cell.style.top = newTop + 'px';

                    // Update stream data
                    stream.customSize = {
                        x: newLeft,
                        y: newTop,
                        width: newWidth,
                        height: newHeight
                    };
                };

                const onMouseUp = () => {
                    cell.classList.remove('resizing');
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                    this.saveState();
                };

                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
    },

    // Save streamer from active stream
    async saveStreamerFromStream(index) {
        const stream = this.gridStreams[index];
        if (!stream) return;

        const streamer = await this.saveStreamerFromUrl(stream.url, stream.name);
        if (streamer) {
            alert(`Saved streamer: ${streamer.displayName} (${streamer.platform})`);
        } else {
            alert('Could not save streamer. Try adding manually.');
        }
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
            // Twitch requires exact parent domain match
            // For localhost (including IPv6 [::]), always use 'localhost'
            let parent = window.location.hostname;

            // Handle various localhost scenarios
            if (!parent || parent === '' || parent === '::1' || parent === '127.0.0.1' || parent.includes('::')) {
                parent = 'localhost';
            }

            return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&autoplay=true&muted=false`;
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

        // X (Twitter)
        if (url.includes('x.com') || url.includes('twitter.com')) {
            // Extract tweet ID from /status/ID format
            const tweetMatch = url.match(/status\/(\d+)/);
            if (tweetMatch) {
                const tweetId = tweetMatch[1];
                return `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark`;
            }
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            // Extract video ID from /video/ID format
            const videoMatch = url.match(/\/video\/(\d+)/);
            if (videoMatch) {
                const videoId = videoMatch[1];
                return `https://www.tiktok.com/embed/v2/${videoId}`;
            }
            // For live streams or short links, use oEmbed approach
            // Note: TikTok live streams have limited iframe support
            // They work best opened in a new window/tab
            return url; // Will attempt to load as-is, may need user interaction
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

    // Audio Control
    toggleAudio(index) {
        if (this.activeAudioIndex === index) {
            this.activeAudioIndex = null;
        } else {
            this.activeAudioIndex = index;
        }
        this.updateAudioIndicators();
        this.updateAudioStatus();
        this.updateDashboardStats();
        this.saveState();
    },

    updateAudioIndicators() {
        // Update audio indicators without reloading iframes
        document.querySelectorAll('.stream-cell').forEach((cell, i) => {
            const isActive = i === this.activeAudioIndex;
            const audioIcon = cell.querySelector('.audio-icon');
            const audioText = cell.querySelector('.audio-indicator span:last-child');

            if (audioIcon && audioText) {
                audioIcon.textContent = isActive ? '🔊' : '🔇';
                audioIcon.classList.toggle('active', isActive);
                audioText.textContent = isActive ? 'Audio ON' : 'Click for audio';
            }

            // Update active-audio class for red border
            if (this.gridStreams[i]) {
                cell.classList.toggle('active-audio', isActive);
            }

            // Update iframe mute parameter by reloading only if needed
            const iframe = cell.querySelector('iframe');
            if (iframe && this.gridStreams[i]) {
                const stream = this.gridStreams[i];
                const embedUrl = this.getEmbedUrl(stream.url);
                const newSrc = `${embedUrl}${isActive ? '' : '&mute=1'}`;

                // Only reload if mute state actually changed
                if (iframe.src !== newSrc) {
                    iframe.src = newSrc;
                }
            }
        });
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
    async addStream() {
        const name = document.getElementById('streamName').value.trim();
        const url = document.getElementById('streamUrl').value.trim();
        const shouldSaveStreamer = document.getElementById('saveStreamer').checked;

        if (!name || !url) {
            alert('Please enter both name and URL');
            return;
        }

        // Validate name length
        if (name.length > 50) {
            alert('Stream name too long (maximum 50 characters)');
            return;
        }

        // Validate URL format
        try {
            const urlObj = new URL(url);

            // Check protocol
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                alert('Invalid URL protocol. Please use HTTP or HTTPS URLs.');
                return;
            }

            // Warn if using potentially unsupported domains (optional)
            const hostname = urlObj.hostname.toLowerCase();
            const supportedDomains = ['youtube.com', 'youtu.be', 'twitch.tv', 'facebook.com', 'kick.com', 'tiktok.com', 'rumble.com'];
            const isSupported = supportedDomains.some(domain => hostname.includes(domain));

            if (!isSupported) {
                const proceed = confirm(`Warning: "${hostname}" may not support embedding. Continue anyway?`);
                if (!proceed) return;
            }
        } catch (error) {
            alert('Invalid URL format. Please enter a valid URL (e.g., https://twitch.tv/channel)');
            return;
        }

        const stream = { name, url, size: '1x1' };

        // Save streamer if checked
        if (shouldSaveStreamer) {
            await this.saveStreamerFromUrl(url, name);
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

    setStreamSize(index, size) {
        if (this.gridStreams[index]) {
            this.gridStreams[index].size = size;
            // Clear custom size when preset is selected
            delete this.gridStreams[index].customSize;

            // Remove free-resize-mode if no streams have custom sizes
            const hasCustomSizes = this.gridStreams.some(s => s && s.customSize);
            if (!hasCustomSizes) {
                const grid = document.getElementById('streamGrid');
                grid.classList.remove('free-resize-mode');
            }

            this.render();
            this.saveState();
        }
    },

    clearAll() {
        if (confirm('Remove all streams from the grid?')) {
            this.gridStreams = this.gridStreams.map(() => null);
            this.activeAudioIndex = null;
            this.render();
            this.saveState();
        }
    },

    // Saved Streamers (new)
    renderSavedStreamers() {
        const list = document.getElementById('savedStreamersList');
        if (this.savedStreamers.length === 0) {
            list.innerHTML = '<p style="color: #64748B; font-size: 14px;">No saved streamers yet</p>';
            return;
        }

        list.innerHTML = this.savedStreamers.map((streamer, index) => {
            const platformEmoji = {
                'twitch': '💜',
                'youtube': '▶️',
                'facebook': '👍',
                'rumble': '🎥',
                'x': '𝕏',
                'tiktok': '🎵',
                'unknown': '📺'
            };

            return `
                <div class="saved-streamer-item">
                    <div style="flex: 1; min-width: 0;">
                        <div class="saved-streamer-name">
                            ${platformEmoji[streamer.platform] || '📺'} ${this.escapeHtml(streamer.displayName)}
                        </div>
                        <div class="saved-streamer-info">
                            ${this.escapeHtml(streamer.platform)} · ${this.escapeHtml(streamer.handle)}
                        </div>
                    </div>
                    <div class="saved-streamer-actions">
                        <button class="btn-small btn-use" onclick="app.useSavedStreamer(${index})">Use</button>
                        <button class="btn-small btn-delete" onclick="app.deleteSavedStreamer(${index})">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    useSavedStreamer(index) {
        const streamer = this.savedStreamers[index];

        // Create stream from streamer
        const stream = {
            name: streamer.displayName,
            url: streamer.profileUrl,
            size: '1x1'
        };

        if (this.selectedSlot !== null) {
            this.gridStreams[this.selectedSlot] = stream;
        } else {
            const emptyIndex = this.gridStreams.findIndex(s => s === null);
            if (emptyIndex >= 0) {
                this.gridStreams[emptyIndex] = stream;
            } else {
                alert('Grid is full! Remove a stream or change layout.');
                return;
            }
        }

        this.closeModal();
        this.render();
        this.saveState();
    },

    deleteSavedStreamer(index) {
        if (confirm(`Delete "${this.savedStreamers[index].displayName}" from saved streamers?`)) {
            this.savedStreamers.splice(index, 1);
            this.renderSavedStreamers();
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

    // Stream Scanner
    openScanner() {
        const width = 1400;
        const height = 900;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;

        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
        const scannerWindow = window.open('scanner.html', 'StreamScanner', features);

        if (scannerWindow) {
            scannerWindow.focus();
        } else {
            alert('Pop-up blocked! Please allow pop-ups for this app to use the Stream Scanner.');
        }
    },

    // Modal
    openModal() {
        this.selectedSlot = null;
        document.getElementById('streamName').value = '';
        document.getElementById('streamUrl').value = '';
        document.getElementById('saveStreamer').checked = false;
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

    // Import/Export Modal
    openImportExportModal() {
        document.getElementById('importExportModal').classList.add('active');
        document.getElementById('bulkStreamUrls').value = '';
    },

    closeImportExportModal() {
        document.getElementById('importExportModal').classList.remove('active');
    },

    // Export Configuration
    exportConfiguration() {
        const config = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            gridLayout: this.gridLayout,
            gridStreams: this.gridStreams,
            savedStreamers: this.savedStreamers,
            scenes: this.scenes,
            overlays: this.overlays,
            transitionType: this.transitionType,
            transitionDuration: this.transitionDuration
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `uniterev-config-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        this.showSuccess('Configuration exported successfully!');
    },

    // Import Configuration
    importConfiguration(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);

                // Validate config structure
                if (!config.version) {
                    throw new Error('Invalid configuration file format');
                }

                // Confirm with user
                if (!confirm('This will replace your current configuration. Are you sure you want to continue?')) {
                    return;
                }

                // Apply configuration
                this.gridLayout = config.gridLayout || '2x2';
                this.gridStreams = config.gridStreams || [];
                this.savedStreamers = config.savedStreamers || [];
                this.scenes = config.scenes || [];
                this.overlays = config.overlays || [];
                this.transitionType = config.transitionType || 'fade';
                this.transitionDuration = config.transitionDuration || 300;

                // Save to localStorage
                this.saveState();

                // Update UI
                this.render();
                this.updateLayoutButtons();
                this.renderSavedStreamers();
                this.renderSceneList();
                this.renderOverlayList();

                this.showSuccess('Configuration imported successfully!');
                this.closeImportExportModal();

                // Reset file input
                event.target.value = '';
            } catch (error) {
                console.error('Import error:', error);
                this.showError('Failed to import configuration. Please check the file format.');
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    },

    // Load Bulk Stream File
    loadBulkStreamFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('bulkStreamUrls').value = e.target.result;
            event.target.value = '';
        };
        reader.readAsText(file);
    },

    // Bulk Add Streams
    bulkAddStreams() {
        const textarea = document.getElementById('bulkStreamUrls');
        const urls = textarea.value
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && (line.startsWith('http://') || line.startsWith('https://')));

        if (urls.length === 0) {
            this.showError('Please enter at least one valid URL');
            return;
        }

        let addedCount = 0;
        let skippedCount = 0;

        urls.forEach(url => {
            // Check if we have room
            const emptySlotCount = this.gridStreams.filter(s => s === null).length;
            if (addedCount >= emptySlotCount && this.gridStreams.length >= this.getMaxStreams()) {
                skippedCount++;
                return;
            }

            // Extract stream info from URL
            const streamInfo = this.extractStreamInfo(url);
            if (streamInfo) {
                // Find first empty slot or add to end
                const emptyIndex = this.gridStreams.findIndex(s => s === null);
                if (emptyIndex >= 0) {
                    this.gridStreams[emptyIndex] = streamInfo;
                } else if (this.gridStreams.length < this.getMaxStreams()) {
                    this.gridStreams.push(streamInfo);
                } else {
                    skippedCount++;
                    return;
                }
                addedCount++;
            } else {
                skippedCount++;
            }
        });

        // Save and render
        this.saveState();
        this.render();

        // Show results
        let message = `Added ${addedCount} stream(s)`;
        if (skippedCount > 0) {
            message += `, skipped ${skippedCount} (invalid or grid full)`;
        }
        this.showSuccess(message);

        // Clear textarea
        textarea.value = '';
    },

    // Extract stream info from URL (helper for bulk add)
    extractStreamInfo(url) {
        try {
            // Generate a name from the URL
            let name = 'Stream';

            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                name = 'YouTube Stream';
            } else if (url.includes('twitch.tv')) {
                const match = url.match(/twitch\.tv\/([^\/\?]+)/);
                name = match ? match[1] : 'Twitch Stream';
            } else if (url.includes('twitter.com') || url.includes('x.com')) {
                name = 'X/Twitter Stream';
            } else if (url.includes('facebook.com')) {
                name = 'Facebook Stream';
            } else if (url.includes('tiktok.com')) {
                name = 'TikTok Stream';
            } else if (url.includes('rumble.com')) {
                name = 'Rumble Stream';
            }

            return {
                name: name,
                url: url,
                embed: this.getEmbedUrl(url)
            };
        } catch (error) {
            console.error('Failed to extract stream info:', error);
            return null;
        }
    },

    // Get max streams based on grid layout
    getMaxStreams() {
        const [rows, cols] = this.gridLayout.split('x').map(Number);
        return rows * cols;
    },

    // Utility
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showError(message) {
        // Create error notification
        const error = document.createElement('div');
        error.className = 'error-notification';
        error.setAttribute('role', 'alert');
        error.setAttribute('aria-live', 'assertive');
        error.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FEE2E2;
            color: #991B1B;
            padding: 16px 24px;
            border-radius: 8px;
            border: 2px solid #DC2626;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        error.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">⚠️</span>
                <div style="flex: 1;">${this.escapeHtml(message)}</div>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; cursor: pointer; font-size: 20px; color: #991B1B;"
                        aria-label="Close error message">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(error);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (error.parentElement) {
                error.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => error.remove(), 300);
            }
        }, 5000);
    },

    showSuccess(message) {
        // Create success notification
        const success = document.createElement('div');
        success.className = 'success-notification';
        success.setAttribute('role', 'alert');
        success.setAttribute('aria-live', 'polite');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #D1FAE5;
            color: #065F46;
            padding: 16px 24px;
            border-radius: 8px;
            border: 2px solid #10B981;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        success.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">✅</span>
                <div style="flex: 1;">${this.escapeHtml(message)}</div>
                <button onclick="this.parentElement.parentElement.remove()"
                        style="background: none; border: none; cursor: pointer; font-size: 20px; color: #065F46;"
                        aria-label="Close success message">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(success);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (success.parentElement) {
                success.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => success.remove(), 300);
            }
        }, 5000);
    },

    // ===== RECORDING FUNCTIONALITY =====

    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    },

    async startRecording() {
        try {
            // Check if there are any streams to record
            const hasStreams = this.gridStreams.some(stream => stream !== null);
            if (!hasStreams) {
                alert('Please add at least one stream before recording.');
                return;
            }

            // Use Screen Capture API - prompts user to select what to record
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'browser'
                },
                audio: true,
                preferCurrentTab: true
            });

            // Check if user cancelled
            if (!displayStream) {
                return;
            }

            // Initialize MediaRecorder with best available codec
            let options = { mimeType: 'video/webm;codecs=vp9,opus' };

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm;codecs=vp8,opus' };
            }

            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = { mimeType: 'video/webm' };
            }

            this.mediaRecorder = new MediaRecorder(displayStream, options);
            this.recordedChunks = [];

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Handle recording stop
            this.mediaRecorder.onstop = () => {
                this.downloadRecording();
                // Stop all tracks
                displayStream.getTracks().forEach(track => track.stop());
            };

            // Handle errors
            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showError('Recording error: ' + event.error.message);
                this.stopRecording();
            };

            // Handle user stopping screen share manually
            displayStream.getVideoTracks()[0].addEventListener('ended', () => {
                if (this.isRecording) {
                    this.stopRecording();
                }
            });

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second
            this.isRecording = true;
            this.recordingStartTime = Date.now();

            // Update UI
            this.updateRecordingUI();
            this.startRecordingTimer();

            console.log('Recording started with mime type:', options.mimeType);

        } catch (error) {
            console.error('Failed to start recording:', error);

            if (error.name === 'NotAllowedError') {
                this.showError('Screen recording permission denied. Please allow screen sharing.');
            } else if (error.name === 'NotSupportedError') {
                this.showError('Screen recording not supported. Try Chrome or Edge.');
            } else {
                this.showError('Failed to start recording: ' + error.message);
            }

            this.isRecording = false;
            this.updateRecordingUI();
        }
    },

    stopRecording() {
        if (!this.mediaRecorder || !this.isRecording) return;

        try {
            // Stop the recorder
            if (this.mediaRecorder.state !== 'inactive') {
                this.mediaRecorder.stop();
            }

            // Stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }

            this.isRecording = false;
            this.stopRecordingTimer();
            this.updateRecordingUI();

            console.log('Recording stopped');

        } catch (error) {
            console.error('Error stopping recording:', error);
            this.showError('Error stopping recording: ' + error.message);
        }
    },

    downloadRecording() {
        if (this.recordedChunks.length === 0) {
            this.showError('No recording data available');
            return;
        }

        try {
            // Create blob from recorded chunks
            const blob = new Blob(this.recordedChunks, { type: 'video/webm' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
            a.download = `uniterev-recording-${timestamp}.webm`;

            document.body.appendChild(a);
            a.click();

            // Cleanup
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);

            // Show success message
            const success = document.createElement('div');
            success.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #D1FAE5;
                color: #065F46;
                padding: 16px 24px;
                border-radius: 8px;
                border: 2px solid: #10B981;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                font-weight: 600;
            `;
            success.textContent = '✅ Recording saved!';
            document.body.appendChild(success);
            setTimeout(() => success.remove(), 3000);

            console.log('Recording downloaded:', a.download);

        } catch (error) {
            console.error('Error downloading recording:', error);
            this.showError('Failed to download recording: ' + error.message);
        }
    },

    updateRecordingUI() {
        const recordBtn = document.getElementById('recordBtn');
        const recordingIndicator = document.getElementById('recordingIndicator');
        const recordingStatus = document.getElementById('recordingStatus');

        if (this.isRecording) {
            // Update button
            recordBtn.textContent = '⏹️ Stop';
            recordBtn.classList.add('recording');
            recordBtn.classList.remove('btn-record');
            recordBtn.classList.add('btn-stop-record');
            recordBtn.title = 'Stop recording';
            recordBtn.setAttribute('aria-label', 'Stop recording');

            // Show indicator
            recordingIndicator.classList.add('active');

            // Show dashboard recording status
            if (recordingStatus) {
                recordingStatus.style.display = 'flex';
            }
        } else {
            // Reset button
            recordBtn.textContent = '⏺️ Record';
            recordBtn.classList.remove('recording', 'btn-stop-record');
            recordBtn.classList.add('btn-record');
            recordBtn.title = 'Start recording the grid';
            recordBtn.setAttribute('aria-label', 'Start recording');

            // Hide indicator
            recordingIndicator.classList.remove('active');

            // Hide dashboard recording status
            if (recordingStatus) {
                recordingStatus.style.display = 'none';
            }
        }
    },

    startRecordingTimer() {
        const timerElement = document.getElementById('recordingTimer');
        const dashboardDuration = document.getElementById('recordingDuration');

        this.recordingTimerInterval = setInterval(() => {
            const elapsed = Date.now() - this.recordingStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;

            const timeString = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            timerElement.textContent = timeString;

            // Update dashboard duration
            if (dashboardDuration) {
                dashboardDuration.textContent = timeString;
            }
        }, 1000);
    },

    stopRecordingTimer() {
        if (this.recordingTimerInterval) {
            clearInterval(this.recordingTimerInterval);
            this.recordingTimerInterval = null;
        }

        const timerElement = document.getElementById('recordingTimer');
        const dashboardDuration = document.getElementById('recordingDuration');

        if (timerElement) {
            timerElement.textContent = '00:00';
        }
        if (dashboardDuration) {
            dashboardDuration.textContent = '00:00';
        }
    },

    // ===== AUDIO MIXER FUNCTIONALITY =====

    toggleAudioMixer() {
        this.audioMixerOpen = !this.audioMixerOpen;
        const panel = document.getElementById('audioMixerPanel');
        const toggle = document.getElementById('audioMixerToggle');

        if (this.audioMixerOpen) {
            panel.classList.add('open');
            toggle.classList.add('open');
            this.initAudioMixer();
            this.renderAudioChannels();
            this.startAudioMetering();
        } else {
            panel.classList.remove('open');
            toggle.classList.remove('open');
            this.stopAudioMetering();
        }
    },

    initAudioMixer() {
        // Initialize Web Audio API context if not already created
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
            this.masterGainNode.gain.value = this.masterVolume;

            console.log('Audio mixer initialized');
        }
    },

    renderAudioChannels() {
        const container = document.getElementById('audioChannels');
        container.innerHTML = '';

        // Find all streams that are currently in the grid
        this.gridStreams.forEach((stream, index) => {
            if (stream) {
                const channel = this.createAudioChannelUI(stream, index);
                container.appendChild(channel);
            }
        });

        if (container.children.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #64748B;">
                    <div style="font-size: 48px; margin-bottom: 12px;">🔇</div>
                    <div>No streams in grid</div>
                    <div style="font-size: 13px; margin-top: 8px;">Add streams to the grid to see audio controls</div>
                </div>
            `;
        }
    },

    createAudioChannelUI(stream, index) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'audio-channel';
        channelDiv.dataset.index = index;

        const channelData = this.audioChannels[index] || {
            volume: 100,
            muted: false,
            solo: false
        };

        channelDiv.innerHTML = `
            <div class="audio-channel-header">
                <div class="audio-channel-name">
                    <span>${this.escapeHtml(stream.name)}</span>
                </div>
                <div class="audio-channel-controls">
                    <button class="audio-btn-icon ${channelData.muted ? 'muted' : ''}"
                            onclick="app.toggleMute(${index})"
                            title="${channelData.muted ? 'Unmute' : 'Mute'}"
                            aria-label="${channelData.muted ? 'Unmute' : 'Mute'} ${this.escapeHtml(stream.name)}">
                        ${channelData.muted ? '🔇' : '🔊'}
                    </button>
                    <button class="audio-btn-icon ${channelData.solo ? 'active' : ''}"
                            onclick="app.toggleSolo(${index})"
                            title="Solo"
                            aria-label="Solo ${this.escapeHtml(stream.name)}">
                        S
                    </button>
                </div>
            </div>

            <div class="audio-volume-control">
                <div class="audio-volume-label">
                    <span>Volume</span>
                    <span class="audio-volume-value" id="volumeValue${index}">${channelData.volume}%</span>
                </div>
                <input type="range" class="audio-slider"
                       min="0" max="100" value="${channelData.volume}"
                       oninput="app.setChannelVolume(${index}, this.value)"
                       aria-label="Volume for ${this.escapeHtml(stream.name)}">
                <div class="audio-meter">
                    <div class="audio-meter-fill" id="meter${index}"></div>
                </div>
            </div>
        `;

        return channelDiv;
    },

    setChannelVolume(index, volume) {
        volume = parseInt(volume);

        if (!this.audioChannels[index]) {
            this.audioChannels[index] = { volume: 100, muted: false, solo: false };
        }

        this.audioChannels[index].volume = volume;

        // Update UI
        const valueDisplay = document.getElementById(`volumeValue${index}`);
        if (valueDisplay) {
            valueDisplay.textContent = volume + '%';
        }

        // Update iframe volume if possible (limited by same-origin policy)
        this.updateIframeVolume(index, volume);

        console.log(`Channel ${index} volume set to ${volume}%`);
    },

    updateIframeVolume(index, volume) {
        try {
            const cell = document.querySelectorAll('.stream-cell.has-stream')[index];
            if (cell) {
                const iframe = cell.querySelector('iframe');
                if (iframe && iframe.contentWindow) {
                    // Try to control iframe volume (will fail for cross-origin)
                    // This is a best-effort attempt
                    const volumeValue = volume / 100;
                    // Most platforms don't allow this due to security, but we try anyway
                    try {
                        iframe.contentWindow.postMessage({
                            type: 'setVolume',
                            volume: volumeValue
                        }, '*');
                    } catch (e) {
                        // Cross-origin restriction - expected for most streams
                    }
                }
            }
        } catch (error) {
            // Silently fail - cross-origin restrictions are expected
        }
    },

    toggleMute(index) {
        if (!this.audioChannels[index]) {
            this.audioChannels[index] = { volume: 100, muted: false, solo: false };
        }

        this.audioChannels[index].muted = !this.audioChannels[index].muted;

        // Update UI
        this.renderAudioChannels();

        // Update actual audio
        this.updateIframeVolume(index, this.audioChannels[index].muted ? 0 : this.audioChannels[index].volume);

        console.log(`Channel ${index} ${this.audioChannels[index].muted ? 'muted' : 'unmuted'}`);
    },

    toggleSolo(index) {
        if (!this.audioChannels[index]) {
            this.audioChannels[index] = { volume: 100, muted: false, solo: false };
        }

        this.audioChannels[index].solo = !this.audioChannels[index].solo;

        // If soloing, mute all other channels
        if (this.audioChannels[index].solo) {
            this.gridStreams.forEach((stream, i) => {
                if (stream && i !== index) {
                    if (!this.audioChannels[i]) {
                        this.audioChannels[i] = { volume: 100, muted: false, solo: false };
                    }
                    this.audioChannels[i].muted = true;
                }
            });
        } else {
            // Un-solo: unmute all channels
            this.gridStreams.forEach((stream, i) => {
                if (stream && this.audioChannels[i]) {
                    this.audioChannels[i].muted = false;
                }
            });
        }

        // Update UI
        this.renderAudioChannels();

        // Update all iframe volumes
        this.gridStreams.forEach((stream, i) => {
            if (stream && this.audioChannels[i]) {
                const volume = this.audioChannels[i].muted ? 0 : this.audioChannels[i].volume;
                this.updateIframeVolume(i, volume);
            }
        });

        console.log(`Channel ${index} solo ${this.audioChannels[index].solo ? 'enabled' : 'disabled'}`);
    },

    setMasterVolume(volume) {
        volume = parseInt(volume);
        this.masterVolume = volume / 100;

        // Update display
        const valueDisplay = document.getElementById('masterVolumeValue');
        if (valueDisplay) {
            valueDisplay.textContent = volume + '%';
        }

        // Update Web Audio API master gain if available
        if (this.masterGainNode) {
            this.masterGainNode.gain.value = this.masterVolume;
        }

        console.log(`Master volume set to ${volume}%`);
    },

    startAudioMetering() {
        // Start updating audio meters
        this.stopAudioMetering(); // Clear any existing interval

        this.meterUpdateInterval = setInterval(() => {
            this.updateAudioMeters();
        }, 100); // Update meters 10 times per second
    },

    stopAudioMetering() {
        if (this.meterUpdateInterval) {
            clearInterval(this.meterUpdateInterval);
            this.meterUpdateInterval = null;
        }
    },

    updateAudioMeters() {
        // Simulate audio metering with random values
        // In a real implementation, this would use AnalyserNode from Web Audio API
        this.gridStreams.forEach((stream, index) => {
            if (stream && !this.audioChannels[index]?.muted) {
                const meterElement = document.getElementById(`meter${index}`);
                if (meterElement) {
                    // Simulate audio level (0-100%)
                    const level = Math.random() * 60 + 20; // Random between 20-80%
                    meterElement.style.width = level + '%';
                }
            } else {
                const meterElement = document.getElementById(`meter${index}`);
                if (meterElement) {
                    meterElement.style.width = '0%';
                }
            }
        });

        // Update master meter (average of all active channels)
        const masterMeter = document.getElementById('masterMeter');
        if (masterMeter) {
            let activeChannels = 0;
            let totalLevel = 0;

            this.gridStreams.forEach((stream, index) => {
                if (stream && !this.audioChannels[index]?.muted) {
                    activeChannels++;
                    totalLevel += Math.random() * 60 + 20;
                }
            });

            const avgLevel = activeChannels > 0 ? totalLevel / activeChannels : 0;
            masterMeter.style.width = (avgLevel * this.masterVolume) + '%';
        }
    },

    // ===== SCENE MANAGER FUNCTIONALITY =====

    toggleSceneManager() {
        this.sceneManagerOpen = !this.sceneManagerOpen;
        const panel = document.getElementById('sceneManagerPanel');
        const toggle = document.getElementById('sceneManagerToggle');

        if (this.sceneManagerOpen) {
            panel.classList.add('open');
            toggle.classList.add('open');
            this.renderSceneList();
            this.initializeTransitionControls();
        } else {
            panel.classList.remove('open');
            toggle.classList.remove('open');
        }
    },

    renderSceneList() {
        const container = document.getElementById('sceneList');

        if (this.scenes.length === 0) {
            container.innerHTML = `
                <div class="scene-empty">
                    <div class="scene-empty-icon">🎬</div>
                    <div style="font-size: 14px; margin-bottom: 8px;">No scenes saved yet</div>
                    <div style="font-size: 12px;">Save your current layout to create a scene</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.scenes.forEach((scene, index) => {
            const sceneDiv = document.createElement('div');
            sceneDiv.className = 'scene-item' + (scene.id === this.activeSceneId ? ' active' : '');
            sceneDiv.dataset.sceneId = scene.id;

            const hotkey = index < 9 ? index + 1 : '';

            sceneDiv.innerHTML = `
                <div class="scene-item-info" onclick="app.loadScene('${scene.id}')">
                    <div class="scene-item-name">${this.escapeHtml(scene.name)}</div>
                    <div class="scene-item-meta">
                        <span>${scene.layout}</span>
                        <span>${scene.streamCount} stream${scene.streamCount !== 1 ? 's' : ''}</span>
                        ${hotkey ? `<span class="scene-item-hotkey">${hotkey}</span>` : ''}
                    </div>
                </div>
                <div class="scene-item-actions">
                    <button class="scene-btn-icon" onclick="event.stopPropagation(); app.renameScene('${scene.id}')" title="Rename scene" aria-label="Rename ${this.escapeHtml(scene.name)}">
                        ✏️
                    </button>
                    <button class="scene-btn-icon" onclick="event.stopPropagation(); app.duplicateScene('${scene.id}')" title="Duplicate scene" aria-label="Duplicate ${this.escapeHtml(scene.name)}">
                        📋
                    </button>
                    <button class="scene-btn-icon delete" onclick="event.stopPropagation(); app.deleteScene('${scene.id}')" title="Delete scene" aria-label="Delete ${this.escapeHtml(scene.name)}">
                        🗑️
                    </button>
                </div>
            `;

            container.appendChild(sceneDiv);
        });
    },

    saveCurrentScene() {
        const name = prompt('Enter scene name:', `Scene ${this.scenes.length + 1}`);
        if (!name || !name.trim()) return;

        const scene = {
            id: 'scene-' + Date.now(),
            name: name.trim(),
            layout: this.gridLayout,
            streams: JSON.parse(JSON.stringify(this.gridStreams)), // Deep copy
            activeAudioIndex: this.activeAudioIndex,
            audioChannels: JSON.parse(JSON.stringify(this.audioChannels)),
            streamCount: this.gridStreams.filter(s => s !== null).length,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.scenes.push(scene);
        this.activeSceneId = scene.id;
        this.saveState();
        this.renderSceneList();
        this.updateDashboardStats();

        // Show success message
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #D1FAE5;
            color: #065F46;
            padding: 16px 24px;
            border-radius: 8px;
            border: 2px solid #10B981;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 600;
        `;
        success.textContent = `✅ Scene "${name}" saved!`;
        document.body.appendChild(success);
        setTimeout(() => success.remove(), 2000);

        console.log('Scene saved:', scene);
    },

    async loadScene(sceneId) {
        if (this.sceneTransitioning) return;

        const scene = this.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        // Start transition
        this.sceneTransitioning = true;
        const transition = document.getElementById('sceneTransition');

        // Apply transition type and duration
        transition.className = 'scene-transition ' + this.transitionType;
        transition.style.setProperty('--transition-duration', this.transitionDuration + 'ms');

        // Trigger transition
        transition.classList.add('active');

        // Wait for transition (half duration for fade in)
        await new Promise(resolve => setTimeout(resolve, this.transitionDuration / 2));

        // Apply scene
        this.gridLayout = scene.layout;
        this.gridStreams = JSON.parse(JSON.stringify(scene.streams)); // Deep copy
        this.activeAudioIndex = scene.activeAudioIndex || null;
        this.audioChannels = JSON.parse(JSON.stringify(scene.audioChannels || {}));
        this.activeSceneId = scene.id;

        // Update UI
        this.render();
        this.updateLayoutButtons();
        this.updateAudioStatus();
        this.saveState();

        // If audio mixer is open, update it
        if (this.audioMixerOpen) {
            this.renderAudioChannels();
        }

        // End transition (wait for second half)
        await new Promise(resolve => setTimeout(resolve, this.transitionDuration / 2));
        transition.classList.remove('active');
        this.sceneTransitioning = false;

        // Update scene list
        this.renderSceneList();

        console.log('Scene loaded:', scene.name, 'with transition:', this.transitionType);
    },

    deleteScene(sceneId) {
        const scene = this.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        if (!confirm(`Delete scene "${scene.name}"?`)) return;

        this.scenes = this.scenes.filter(s => s.id !== sceneId);

        // If deleted scene was active, clear active scene
        if (this.activeSceneId === sceneId) {
            this.activeSceneId = null;
        }

        this.saveState();
        this.renderSceneList();
        this.updateDashboardStats();

        console.log('Scene deleted:', scene.name);
    },

    renameScene(sceneId) {
        const scene = this.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const newName = prompt('Enter new name:', scene.name);
        if (!newName || !newName.trim()) return;

        scene.name = newName.trim();
        scene.updatedAt = Date.now();

        this.saveState();
        this.renderSceneList();

        console.log('Scene renamed to:', newName);
    },

    duplicateScene(sceneId) {
        const scene = this.scenes.find(s => s.id === sceneId);
        if (!scene) return;

        const duplicate = {
            ...scene,
            id: 'scene-' + Date.now(),
            name: scene.name + ' (Copy)',
            streams: JSON.parse(JSON.stringify(scene.streams)),
            audioChannels: JSON.parse(JSON.stringify(scene.audioChannels || {})),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.scenes.push(duplicate);
        this.saveState();
        this.renderSceneList();

        console.log('Scene duplicated:', duplicate.name);
    },

    // Load scene by hotkey (1-9)
    loadSceneByHotkey(number) {
        const index = number - 1;
        if (index >= 0 && index < this.scenes.length) {
            this.loadScene(this.scenes[index].id);
        }
    },

    // ============================================================================
    // OVERLAY MANAGER
    // ============================================================================

    toggleOverlayManager() {
        this.overlayManagerOpen = !this.overlayManagerOpen;
        const panel = document.getElementById('overlayManagerPanel');
        const toggle = document.querySelector('.overlay-manager-toggle');

        if (this.overlayManagerOpen) {
            panel.classList.add('open');
            toggle.classList.add('open');
            this.renderOverlayList();
        } else {
            panel.classList.remove('open');
            toggle.classList.remove('open');
        }
    },

    renderOverlayList() {
        const container = document.getElementById('overlayList');

        if (this.overlays.length === 0) {
            container.innerHTML = `
                <div class="overlay-empty">
                    <div class="overlay-empty-icon">📐</div>
                    <div style="font-size: 14px; margin-bottom: 8px;">No overlays yet</div>
                    <div style="font-size: 12px;">Add text or image overlays to your streams</div>
                </div>
            `;
            return;
        }

        container.innerHTML = '';

        this.overlays.forEach(overlay => {
            const overlayDiv = document.createElement('div');
            overlayDiv.className = 'overlay-item' + (overlay.id === this.selectedOverlayId ? ' active' : '');
            overlayDiv.dataset.overlayId = overlay.id;

            const typeIcon = overlay.type === 'text' ? '📝' : '🖼️';
            const visibleIcon = overlay.visible ? '👁️' : '👁️‍🗨️';

            overlayDiv.innerHTML = `
                <div class="overlay-item-info">
                    <div class="overlay-item-header">
                        <span class="overlay-type-icon">${typeIcon}</span>
                        <span class="overlay-item-name">${this.escapeHtml(overlay.name || (overlay.type === 'text' ? 'Text Overlay' : 'Image Overlay'))}</span>
                    </div>
                    <div class="overlay-item-controls">
                        <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Opacity</label>
                        <input type="range" class="overlay-slider" min="0" max="100" value="${overlay.opacity * 100}"
                               oninput="app.updateOverlayProperty('${overlay.id}', 'opacity', this.value / 100)"
                               style="width: 100%; margin-bottom: 8px;">
                        ${overlay.type === 'text' ? `
                            <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Text</label>
                            <input type="text" class="overlay-text-input" value="${this.escapeHtml(overlay.text || '')}"
                                   oninput="app.updateOverlayProperty('${overlay.id}', 'text', this.value)"
                                   style="width: 100%; padding: 6px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; color: white; font-size: 12px; margin-bottom: 8px;">
                            <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Font Size</label>
                            <input type="number" class="overlay-size-input" value="${overlay.fontSize || 24}" min="12" max="72"
                                   oninput="app.updateOverlayProperty('${overlay.id}', 'fontSize', this.value)"
                                   style="width: 100%; padding: 6px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; color: white; font-size: 12px; margin-bottom: 8px;">
                            <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Color</label>
                            <input type="color" value="${overlay.color || '#ffffff'}"
                                   oninput="app.updateOverlayProperty('${overlay.id}', 'color', this.value)"
                                   style="width: 100%; height: 32px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; margin-bottom: 8px;">
                        ` : `
                            <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Image URL</label>
                            <input type="text" class="overlay-text-input" value="${this.escapeHtml(overlay.imageUrl || '')}"
                                   oninput="app.updateOverlayProperty('${overlay.id}', 'imageUrl', this.value)"
                                   placeholder="https://example.com/image.png"
                                   style="width: 100%; padding: 6px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; color: white; font-size: 12px; margin-bottom: 8px;">
                            <label style="font-size: 11px; color: #94A3B8; margin-bottom: 4px; display: block;">Size (px)</label>
                            <input type="number" class="overlay-size-input" value="${overlay.width || 200}" min="50" max="800"
                                   oninput="app.updateOverlayProperty('${overlay.id}', 'width', this.value)"
                                   style="width: 100%; padding: 6px; background: #0F172A; border: 1px solid #334155; border-radius: 4px; color: white; font-size: 12px; margin-bottom: 8px;">
                        `}
                    </div>
                </div>
                <div class="overlay-item-actions">
                    <button class="overlay-btn-icon" onclick="event.stopPropagation(); app.toggleOverlayVisibility('${overlay.id}')"
                            title="${overlay.visible ? 'Hide' : 'Show'} overlay">
                        ${visibleIcon}
                    </button>
                    <button class="overlay-btn-icon delete" onclick="event.stopPropagation(); app.deleteOverlay('${overlay.id}')"
                            title="Delete overlay">
                        🗑️
                    </button>
                </div>
            `;

            container.appendChild(overlayDiv);
        });

        // Re-render overlays on grid
        this.renderOverlays();
    },

    addTextOverlay() {
        const overlay = {
            id: 'overlay-' + Date.now(),
            type: 'text',
            name: `Text ${this.overlays.length + 1}`,
            text: 'Sample Text',
            fontSize: 24,
            color: '#ffffff',
            x: 50, // percent from left
            y: 50, // percent from top
            opacity: 1.0,
            visible: true,
            createdAt: Date.now()
        };

        this.overlays.push(overlay);
        this.saveState();
        this.renderOverlayList();

        console.log('Text overlay added:', overlay);
    },

    addImageOverlay() {
        const imageUrl = prompt('Enter image URL:', 'https://');
        if (!imageUrl || !imageUrl.trim() || imageUrl === 'https://') return;

        const overlay = {
            id: 'overlay-' + Date.now(),
            type: 'image',
            name: `Image ${this.overlays.length + 1}`,
            imageUrl: imageUrl.trim(),
            width: 200,
            x: 50, // percent from left
            y: 50, // percent from top
            opacity: 1.0,
            visible: true,
            createdAt: Date.now()
        };

        this.overlays.push(overlay);
        this.saveState();
        this.renderOverlayList();

        console.log('Image overlay added:', overlay);
    },

    updateOverlayProperty(overlayId, property, value) {
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (!overlay) return;

        // Type conversion
        if (property === 'opacity' || property === 'fontSize' || property === 'width') {
            value = parseFloat(value);
        }

        overlay[property] = value;
        this.saveState();
        this.renderOverlays();
    },

    toggleOverlayVisibility(overlayId) {
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (!overlay) return;

        overlay.visible = !overlay.visible;
        this.saveState();
        this.renderOverlayList();
    },

    deleteOverlay(overlayId) {
        const overlay = this.overlays.find(o => o.id === overlayId);
        if (!overlay) return;

        if (!confirm(`Delete overlay "${overlay.name}"?`)) return;

        this.overlays = this.overlays.filter(o => o.id !== overlayId);
        this.saveState();
        this.renderOverlayList();

        console.log('Overlay deleted:', overlay.name);
    },

    renderOverlays() {
        // Remove existing overlay elements
        const existingOverlays = document.querySelectorAll('.grid-overlay');
        existingOverlays.forEach(el => el.remove());

        // Render visible overlays
        const gridContainer = document.getElementById('streamGrid');
        if (!gridContainer) return;

        this.overlays.forEach(overlay => {
            if (!overlay.visible) return;

            const overlayEl = document.createElement('div');
            overlayEl.className = 'grid-overlay';
            overlayEl.dataset.overlayId = overlay.id;
            overlayEl.style.left = overlay.x + '%';
            overlayEl.style.top = overlay.y + '%';
            overlayEl.style.opacity = overlay.opacity;
            overlayEl.style.transform = 'translate(-50%, -50%)';

            // Make draggable
            overlayEl.addEventListener('mousedown', (e) => {
                this.startDraggingOverlay(overlay.id, e);
            });

            if (overlay.type === 'text') {
                const textEl = document.createElement('div');
                textEl.className = 'grid-overlay-text';
                textEl.textContent = overlay.text || 'Sample Text';
                textEl.style.fontSize = (overlay.fontSize || 24) + 'px';
                textEl.style.color = overlay.color || '#ffffff';
                overlayEl.appendChild(textEl);
            } else if (overlay.type === 'image') {
                const imgEl = document.createElement('img');
                imgEl.className = 'grid-overlay-image';
                imgEl.src = overlay.imageUrl || '';
                imgEl.style.width = (overlay.width || 200) + 'px';
                imgEl.style.height = 'auto';
                imgEl.alt = overlay.name || 'Overlay image';
                overlayEl.appendChild(imgEl);
            }

            gridContainer.appendChild(overlayEl);
        });
    },

    startDraggingOverlay(overlayId, event) {
        event.preventDefault();
        event.stopPropagation();

        const overlay = this.overlays.find(o => o.id === overlayId);
        if (!overlay) return;

        this.draggingOverlay = overlay;
        this.selectedOverlayId = overlayId;

        const gridContainer = document.getElementById('streamGrid');
        const gridRect = gridContainer.getBoundingClientRect();

        const onMouseMove = (e) => {
            if (!this.draggingOverlay) return;

            // Calculate position as percentage
            const x = ((e.clientX - gridRect.left) / gridRect.width) * 100;
            const y = ((e.clientY - gridRect.top) / gridRect.height) * 100;

            // Clamp to grid bounds
            overlay.x = Math.max(0, Math.min(100, x));
            overlay.y = Math.max(0, Math.min(100, y));

            // Update position immediately
            const overlayEl = document.querySelector(`[data-overlay-id="${overlayId}"]`);
            if (overlayEl) {
                overlayEl.style.left = overlay.x + '%';
                overlayEl.style.top = overlay.y + '%';
            }
        };

        const onMouseUp = () => {
            if (this.draggingOverlay) {
                this.saveState();
                this.draggingOverlay = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    },

    // ============================================================================
    // ENHANCED MULTIVIEW DASHBOARD
    // ============================================================================

    updateDashboardStats() {
        // Update stream count
        const activeStreams = this.gridStreams.filter(s => s !== null).length;
        const streamCountEl = document.getElementById('streamCount');
        if (streamCountEl) {
            streamCountEl.textContent = activeStreams;
        }

        // Update audio source
        const audioSourceEl = document.getElementById('audioSource');
        if (audioSourceEl) {
            if (this.activeAudioIndex !== null && this.activeAudioIndex >= 0) {
                const audioStream = this.gridStreams[this.activeAudioIndex];
                if (audioStream) {
                    audioSourceEl.textContent = audioStream.name || `Stream ${this.activeAudioIndex + 1}`;
                } else {
                    audioSourceEl.textContent = 'None';
                }
            } else {
                audioSourceEl.textContent = 'None';
            }
        }

        // Update active scene
        const activeSceneEl = document.getElementById('activeScene');
        if (activeSceneEl) {
            if (this.activeSceneId) {
                const scene = this.scenes.find(s => s.id === this.activeSceneId);
                activeSceneEl.textContent = scene ? scene.name : 'None';
            } else {
                activeSceneEl.textContent = 'None';
            }
        }

        // Update recording status (handled separately in updateRecordingUI)

        // Update layout preset active states
        this.updateLayoutPresetButtons();
    },

    updateLayoutPresetButtons() {
        const buttons = document.querySelectorAll('.btn-layout-preset');
        buttons.forEach(btn => {
            const layout = btn.textContent.trim();
            if (layout === this.gridLayout) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    },

    setLayoutPreset(layout) {
        this.setLayout(layout);
        this.updateDashboardStats();
    },

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                const icon = document.getElementById('fullscreenIcon');
                if (icon) icon.textContent = '⛶';
            }).catch(err => {
                console.error('Failed to enter fullscreen:', err);
            });
        } else {
            document.exitFullscreen().then(() => {
                const icon = document.getElementById('fullscreenIcon');
                if (icon) icon.textContent = '⛶';
            });
        }
    },

    // ============================================================================
    // TRANSITION SYSTEM
    // ============================================================================

    setTransitionType(type) {
        this.transitionType = type;
        this.saveState();
        console.log('Transition type set to:', type);
    },

    setTransitionDuration(duration) {
        this.transitionDuration = parseInt(duration);

        // Update label
        const label = document.getElementById('transitionDurationLabel');
        if (label) {
            label.textContent = duration + 'ms';
        }

        this.saveState();
        console.log('Transition duration set to:', duration + 'ms');
    },

    initializeTransitionControls() {
        // Set initial values from loaded state
        const typeSelect = document.getElementById('transitionType');
        const durationSlider = document.getElementById('transitionDuration');
        const durationLabel = document.getElementById('transitionDurationLabel');

        if (typeSelect) {
            typeSelect.value = this.transitionType;
        }

        if (durationSlider) {
            durationSlider.value = this.transitionDuration;
        }

        if (durationLabel) {
            durationLabel.textContent = this.transitionDuration + 'ms';
        }
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle Enter key in inputs and scene hotkeys
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
        app.addStream();
    }
    if (e.key === 'Escape') {
        app.closeModal();
    }

    // Scene hotkeys (1-9) - only when not typing in input
    if (!e.target.classList.contains('form-input') && !e.target.isContentEditable) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            app.loadSceneByHotkey(num);
        }
    }
});
