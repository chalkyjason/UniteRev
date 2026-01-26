# mimoLive Feature Analysis & UniteRev Improvement Roadmap

**Date**: 2026-01-23
**Purpose**: Analyze mimoLive features to identify improvements for UniteRev Stream Manager

---

## mimoLive Overview

mimoLive is a professional live video production software for Mac that functions as a:
- Multi-camera video switcher
- Graphics generator and overlay system
- DVR playback and ISO recorder
- Streaming encoder and transcoder
- Audio and video router
- Multiview monitor
- Automation system

**Target Audience**: Professional broadcasters, live event producers, content creators
**Platform**: macOS exclusive
**Pricing**: Premium professional software

---

## Core mimoLive Features

### 1. **Layer-Based Composition System**
mimoLive uses a powerful layer-based graphics engine to compose the final video output.

**Layer Types**:
- Video Switcher Layer (up to 9 sources with transitions)
- Placer Layer (basic media display with geometric transformations)
- Picture-in-Picture (PIP)
- Split Screen Layer
- Lower Thirds (text overlays)
- Annotation Layer (real-time drawing)
- Instant Replay Layer
- Audio Only Layer
- Custom layers via Layer Store

**Graphics Capabilities**:
- Text overlays, station logos, news tickers
- Clocks, countdowns, timers
- Background animations
- Data-driven elements (sports scores, weather, stock charts, Twitter feeds)
- Real-time chroma keying (green screen removal)
- AI-powered background removal (no green screen needed)

### 2. **Multi-Source Video Management**
- Support for up to 9+ video sources simultaneously
- Smooth cut or dissolve transitions between sources
- NDI source support (unlimited composition)
- Camera feeds, video files, screen capture
- Window capture with audio
- macOS system audio capture (Ventura+)
- PTZ camera control via NDI

### 3. **Multiview Display**
- Watch all 9 sources at once
- Separate monitor display support
- Easy input monitoring
- Program output preview

### 4. **Streaming & Recording**
- Multi-platform streaming (YouTube, Facebook Live, Twitch, Instagram, LinkedIn Live)
- Simultaneous streaming to multiple platforms
- ISO recording (clean source recording)
- H.264 and ProRes recording (including ProRes 4444)
- Program output recording
- NDI ISO recording with real-time transcoding

### 5. **Audio Management**
- Audio mixer built-in
- Audio routing capabilities
- Audio level meters
- Per-source audio control
- Audio-only injection into program out
- Window/app audio capture

### 6. **Automation & Control**
- Automation layer for triggered events
- Scripting support
- Custom remote control surfaces
- HTTP API for external control
- Trigger lower thirds, camera switches, content updates
- Data-driven automation (e.g., pull guest names from Zoom)

### 7. **Remote Guest Integration**
- **mimoCall**: Remote guests can join via web browser
- No software installation required for guests
- Video and audio integration into live production
- Interview and panel discussion support

### 8. **NDI Technology**
- Full NDI support (video, power, PTZ over single cable)
- Send NDI sources via HDMI, SDI, RTMP(S)
- Virtual camera output (Zoom, WebEx, Teams)
- Unlimited NDI source composition

### 9. **Professional Features**
- Real-time keying and compositing
- Geometric transformations
- Color correction and grading
- Video effects and filters
- Templates and presets
- Sports graphics packages
- Layer design templates

---

## UniteRev Current Feature Set

### ✅ **Existing Strengths**
1. **Multi-Stream Viewing**
   - Grid layouts (2x2, 3x3, 4x4, custom)
   - Simultaneous stream viewing
   - Drag-and-drop reordering
   - Resizable stream windows

2. **Stream Scanner**
   - Keyword-based stream discovery
   - Multi-platform scanning (Twitch, YouTube)
   - Plugin architecture
   - OAuth authentication
   - Real-time results

3. **Audio Management**
   - Per-stream audio control
   - Single active audio source
   - Mute/unmute functionality

4. **Saved Streamers**
   - Favorite streamer management
   - Quick access to saved streams
   - Platform-agnostic storage

5. **Basic Controls**
   - Stream size adjustment
   - Grid layout switching
   - Stream removal
   - Fullscreen support (per iframe)

### ❌ **Missing Features**
- No video recording capability
- No stream output/broadcasting
- No overlays or graphics
- No transitions between views
- No automation
- No remote guest features
- No professional production tools
- Limited audio mixing (only one source)
- No NDI support
- No multiview dashboard
- No replay functionality

---

## Feature Gap Analysis

| Feature Category | mimoLive | UniteRev | Priority |
|-----------------|----------|----------|----------|
| **Multi-source viewing** | ✅ | ✅ | - |
| **Grid layouts** | ✅ | ✅ | - |
| **Recording** | ✅ Full ISO | ❌ | HIGH |
| **Streaming output** | ✅ Multi-platform | ❌ | HIGH |
| **Overlays/Graphics** | ✅ Extensive | ❌ | MEDIUM |
| **Transitions** | ✅ | ❌ | MEDIUM |
| **Audio mixing** | ✅ Full mixer | ⚠️ Basic | MEDIUM |
| **Automation** | ✅ | ❌ | LOW |
| **Remote guests** | ✅ mimoCall | ❌ | MEDIUM |
| **NDI support** | ✅ | ❌ | LOW |
| **Instant replay** | ✅ | ❌ | LOW |
| **Multiview dashboard** | ✅ | ⚠️ Partial | MEDIUM |
| **PTZ camera control** | ✅ | N/A | LOW |
| **Stream discovery** | ❌ | ✅ | - |
| **Keyword scanning** | ❌ | ✅ | - |
| **Web-based** | ❌ Mac only | ✅ | - |
| **Free/Open** | ❌ | ✅ | - |

---

## Recommended Improvements for UniteRev

### 🔴 **HIGH PRIORITY** (Core Production Features)

#### 1. **Recording Functionality**
**Why**: Essential for content creation and archiving
**Implementation**:
- Add "Record" button to main interface
- Use MediaRecorder API for browser-based recording
- Support for:
  - Program output recording (entire grid)
  - Individual stream recording (ISO)
  - Format options: WebM, MP4 (via conversion)
  - Quality settings (1080p, 720p, 480p)
- Recording controls: Start, Stop, Pause
- Auto-save to local storage or download
- Recording indicator (red dot, timer)

**Estimated Effort**: 20-30 hours
**Technical Requirements**:
```javascript
// Use MediaRecorder API
const stream = canvas.captureStream(30); // 30 FPS
const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 5000000
});
```

#### 2. **Streaming Output Functionality**
**Why**: Transform from viewer-only to broadcaster tool
**Implementation**:
- "Go Live" button with streaming configuration
- RTMP output support
- Stream to multiple platforms simultaneously:
  - Twitch
  - YouTube
  - Facebook Live
  - Custom RTMP endpoints
- Stream health monitoring
- Bitrate control
- Connection status indicators

**Estimated Effort**: 40-60 hours
**Technical Requirements**:
- Backend service for RTMP relay (Node.js + FFmpeg)
- WebRTC for browser capture
- Stream key management
- Could use services like Restream.io API for multi-streaming

**Note**: Browser limitations require backend service or Electron app for true RTMP streaming

---

### 🟡 **MEDIUM PRIORITY** (Enhanced Production)

#### 3. **Overlay System**
**Why**: Professional branding and information display
**Implementation**:
- Draggable overlay editor
- Overlay types:
  - Text overlays (titles, lower thirds)
  - Image overlays (logos, watermarks)
  - Timer/Clock overlays
  - Chat overlays (from stream chat)
  - Alerts (follower, subscriber, donation)
- Positioning system (corners, center, custom)
- Opacity control
- Show/Hide animations
- Overlay templates library
- Save/load custom overlays

**Estimated Effort**: 30-40 hours

#### 4. **Advanced Audio Mixer**
**Why**: Better control over audio sources
**Implementation**:
- Audio mixer panel with:
  - Volume sliders for each stream
  - Mute/Solo buttons
  - Audio level meters (VU meters)
  - Master volume control
  - Audio ducking (auto-lower when speaking)
- Audio effects:
  - EQ (basic 3-band)
  - Compression
  - Noise gate
- Mix multiple audio sources simultaneously
- Audio delay adjustment (sync)
- Save/load mixer presets

**Estimated Effort**: 25-35 hours

#### 5. **Scene/Layout System**
**Why**: Quick switching between different configurations
**Implementation**:
- Scenes panel (like OBS)
- Create multiple scenes with:
  - Different stream arrangements
  - Different overlays
  - Different audio settings
- Quick scene switching (hotkeys)
- Scene transitions:
  - Cut (instant)
  - Fade
  - Slide
  - Custom transitions
- Scene preview before going live
- Copy/duplicate scenes

**Estimated Effort**: 20-30 hours

#### 6. **Enhanced Multiview Dashboard**
**Why**: Better monitoring and control
**Implementation**:
- Dedicated multiview mode
- Features:
  - Grid of all sources with thumbnails
  - Audio meters for each source
  - Stream status indicators (live, offline, buffering)
  - Click to switch program output
  - Preview window (next source)
  - Tally indicators (what's live)
- PIP controls from multiview
- Source labeling/naming
- Color-coding by platform

**Estimated Effort**: 15-25 hours

#### 7. **Remote Guest Feature** (Similar to mimoCall)
**Why**: Enable interviews and collaborations
**Implementation**:
- WebRTC-based guest connections
- Features:
  - Generate shareable guest links
  - No software required for guests
  - Browser-based connection
  - Video + audio input
  - Green room (waiting area)
  - Guest volume control
  - Guest video quality settings
- Guest management:
  - Accept/reject guests
  - Mute/unmute guests
  - Kick guests
- Multiple guest support (panels)

**Estimated Effort**: 50-70 hours
**Technical Requirements**:
- WebRTC signaling server
- STUN/TURN servers for NAT traversal
- Backend infrastructure

#### 8. **Stream Chat Integration**
**Why**: Interact with audience, show comments
**Implementation**:
- Chat panel showing:
  - Twitch chat
  - YouTube live chat
  - Combined multi-platform chat
- Chat overlay layer
- Chat interactions:
  - Pin messages
  - Highlight messages
  - Filter profanity
  - Show chat as scrolling overlay
- Chat commands/triggers
- Moderation tools

**Estimated Effort**: 20-30 hours

---

### 🟢 **LOW PRIORITY** (Advanced/Professional)

#### 9. **Transitions System**
**Why**: Smooth, professional look
**Implementation**:
- Transition effects between:
  - Layout changes
  - Stream switches
  - Scene changes
- Transition types:
  - Fade (dissolve)
  - Slide (directional)
  - Zoom
  - Wipe
  - Custom CSS transitions
- Transition duration control
- Transition preview

**Estimated Effort**: 10-15 hours

#### 10. **Instant Replay**
**Why**: Highlight moments in live streams
**Implementation**:
- Buffer last N seconds of video (configurable)
- Replay controls:
  - Instant replay button
  - Slow motion options
  - Rewind/fast-forward
  - Mark in/out points
- Replay overlay during playback
- Save replay clips
- Configurable buffer size (30s, 60s, 120s)

**Estimated Effort**: 25-35 hours
**Technical Requirements**:
- Continuous video buffering
- Memory management (limited buffer)

#### 11. **Automation System**
**Why**: Reduce manual work, enable complex workflows
**Implementation**:
- Automation rules:
  - If stream goes live → switch to that source
  - If viewer count > X → show overlay
  - On time trigger → switch scenes
  - On keyword in chat → trigger action
- Action types:
  - Switch scenes
  - Show/hide overlays
  - Play media
  - Send notifications
  - HTTP webhooks
- Visual automation editor (drag-drop flowchart)
- Schedule-based automation
- Save/load automation scripts

**Estimated Effort**: 30-45 hours

#### 12. **Green Screen / Background Removal**
**Why**: Professional production value
**Implementation**:
- Chroma key settings:
  - Color picker for key color
  - Threshold adjustment
  - Spill suppression
- AI-powered background removal (TensorFlow.js)
  - No green screen needed
  - Real-time processing
  - Background replacement options
- Apply to any video source
- Performance optimization needed

**Estimated Effort**: 30-40 hours
**Technical Requirements**:
- TensorFlow.js BodyPix or MediaPipe
- GPU acceleration (WebGL)
- Performance will vary by device

#### 13. **NDI Support** (Desktop App Only)
**Why**: Professional video routing
**Implementation**:
- NDI source discovery
- NDI input support
- NDI output (send program)
- PTZ camera control via NDI
- Desktop app required (not browser)

**Estimated Effort**: 40-60 hours
**Technical Requirements**:
- NDI SDK integration
- Electron app (desktop only)
- Network discovery

#### 14. **Media Library & Playlists**
**Why**: Manage content, play videos
**Implementation**:
- Media browser for local files
- Supported formats: MP4, WebM, MOV, images
- Media preview
- Create playlists
- Loop/shuffle options
- Crossfade between media
- Use in scenes or as sources

**Estimated Effort**: 15-20 hours

#### 15. **Advanced Stream Scanner Features**
**Why**: Enhance existing unique feature
**Implementation**:
- Auto-scan modes:
  - Continuous scanning (every N minutes)
  - Notify when found (notifications)
  - Auto-add to grid when criteria met
- Filter enhancements:
  - Language filter
  - Game/category filter
  - Stream tags
  - Viewer count trends
- Scanner history:
  - Track discovered streams
  - Analytics (peak viewers, stream duration)
- Export scan results (CSV, JSON)
- Scanner presets/templates

**Estimated Effort**: 15-25 hours

---

## Feature Implementation Roadmap

### **Phase 1: Core Production Tools** (3-4 months)
**Goal**: Enable basic content creation and streaming

1. Recording functionality (program + ISO)
2. Basic overlay system (text, images, logos)
3. Advanced audio mixer
4. Scene/Layout system
5. Enhanced multiview dashboard

**Value**: Transforms UniteRev from viewer to creator tool

---

### **Phase 2: Live Streaming Capabilities** (2-3 months)
**Goal**: Enable live broadcasting

1. RTMP streaming output
2. Multi-platform streaming
3. Stream health monitoring
4. Chat integration (Twitch, YouTube)
5. Stream chat overlays

**Value**: Compete with OBS, Streamlabs

---

### **Phase 3: Collaboration & Interaction** (2-3 months)
**Goal**: Enable remote collaboration

1. Remote guest feature (WebRTC)
2. Guest management system
3. Green room functionality
4. Multi-guest panels

**Value**: Unique selling point for interviews/podcasts

---

### **Phase 4: Professional Polish** (2-3 months)
**Goal**: Advanced production features

1. Transitions system
2. Instant replay
3. Green screen / background removal
4. Media library & playlists
5. Automation system

**Value**: Professional-grade production tool

---

### **Phase 5: Desktop App Features** (3-4 months)
**Goal**: Desktop-exclusive capabilities

1. NDI support
2. Hardware encoder integration
3. Advanced audio routing
4. Plugin system for extensions
5. Performance optimizations

**Value**: Professional broadcast solution

---

## Technical Architecture Considerations

### **Browser Limitations**
Current web-based architecture has constraints:
- ❌ Cannot directly output RTMP streams
- ❌ Cannot access NDI without native bridge
- ❌ Limited recording formats (WebM primary)
- ❌ Performance limits with many sources
- ✅ But: Cross-platform, no installation

### **Solution: Hybrid Architecture**
1. **Web App** (Current)
   - Stream viewing and monitoring
   - Scanner functionality
   - Basic controls
   - Lightweight usage

2. **Desktop App** (Electron)
   - Full recording capabilities
   - RTMP streaming output
   - NDI support
   - Better performance
   - Native OS integration

3. **Backend Services** (Node.js)
   - RTMP relay server
   - WebRTC signaling
   - Stream key management
   - Recording storage
   - API gateway

### **Recommended Tech Stack Additions**
- **Recording**: MediaRecorder API + FFmpeg (backend)
- **Streaming**: WebRTC + Node.js RTMP relay
- **Remote Guests**: WebRTC + Socket.io signaling
- **Overlays**: HTML Canvas API + CSS transforms
- **Audio**: Web Audio API + Tone.js
- **Background Removal**: TensorFlow.js + BodyPix
- **Desktop App**: Electron + Native modules

---

## Competitive Positioning

### **UniteRev's Unique Advantages**
1. ✅ **Stream Scanner** - No competitor has this
2. ✅ **Web-based** - No installation required
3. ✅ **Free & Open Source** - Community-driven
4. ✅ **Cross-platform** - Works everywhere
5. ✅ **Keyword-based discovery** - Unique workflow

### **After Implementing Recommendations**
UniteRev could position as:
- "**OBS + Multi-Stream Viewer + Stream Scanner**"
- "**The only tool for discovering AND broadcasting streams**"
- "**Free, web-based alternative to mimoLive**"
- "**All-in-one stream management & production tool**"

---

## Priority Matrix

| Feature | User Value | Implementation Effort | Priority Score |
|---------|------------|----------------------|----------------|
| Recording | 10/10 | Medium | **9/10** |
| Overlay System | 9/10 | Medium | **8/10** |
| Audio Mixer | 8/10 | Medium | **7/10** |
| Scene System | 9/10 | Medium | **8/10** |
| Streaming Output | 10/10 | High | **7/10** |
| Chat Integration | 7/10 | Medium | **6/10** |
| Remote Guests | 8/10 | High | **5/10** |
| Multiview Dashboard | 6/10 | Low | **7/10** |
| Transitions | 6/10 | Low | **7/10** |
| Instant Replay | 5/10 | Medium | **4/10** |
| Automation | 6/10 | High | **4/10** |
| Green Screen | 7/10 | High | **5/10** |
| NDI Support | 4/10 | High | **2/10** |
| Media Library | 5/10 | Low | **6/10** |
| Scanner Enhancements | 7/10 | Medium | **6/10** |

**Priority Score** = (User Value × 0.7) + (10 - Normalized Effort × 0.3)

---

## Conclusion

**mimoLive** is a comprehensive professional production suite with:
- Extensive layer-based composition
- Full automation capabilities
- Professional broadcast features
- Mac-exclusive, premium pricing

**UniteRev** can differentiate by:
1. Maintaining its unique **stream scanner** feature
2. Adding **core production tools** (recording, overlays, audio mixer)
3. Staying **web-based and free**
4. Focusing on **ease of use** over professional complexity
5. Eventually offering **desktop app** for advanced features

**Next Steps**:
1. Prioritize **Phase 1** features (recording, overlays, audio mixer, scenes)
2. Build **desktop app foundation** (Electron)
3. Implement **backend services** for streaming
4. Maintain **web app** for accessibility

This approach allows UniteRev to compete in the production space while maintaining its unique identity and accessibility advantages.

---

## Sources

- [mimoLive Professional Live Video Production Software](https://mimolive.com/)
- [mimoLive Features Overview](https://mimolive.com/technology/features/)
- [mimoLive 6 Major Release](https://mimolive.com/mimolive-6-new-major-release/)
- [Layer Overview Documentation](https://mimolive.com/user-manual/live-editing/layers/)
- [Understanding mimoLive Layer Concept](https://mimolive.com/understanding-mimolive-layer-concept-for-live-video-broadcasts/)
- [mimoLive Graphics Layer A-Z](https://mimolive.com/technology/mimolive-graphics-layer-a-z/)
- [mimoLive and NDI Integration](https://ndi.video/product-finder/mimolive6/)
- [NDI Technology in mimoLive](https://mimolive.com/technology/ndi/)
- [File Recording to Disk (ISO Recording)](https://mimolive.com/user-manual/playout-output-destinations/recording-to-disk/)
- [Video Switcher with Multiview Template](https://mimolive.com/user-manual/quick-start-projects-templates/quick-start/video-switcher-with-multiview-template/)
