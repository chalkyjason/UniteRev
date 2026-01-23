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

    // Initialize
    init() {
        this.loadState();
        this.render();
        this.updateLayoutButtons();
        this.renderSavedStreamers();
        this.setupStorageListener();
        this.initSortable();
    },

    // Initialize drag-and-drop
    initSortable() {
        const grid = document.getElementById('streamGrid');
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }

        // Wait for Sortable library to load
        if (typeof Sortable === 'undefined') {
            setTimeout(() => this.initSortable(), 100);
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
