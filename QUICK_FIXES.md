# Quick Fixes for Critical Issues

## 🔴 MUST FIX IMMEDIATELY

### 1. Fix XSS Vulnerability in Scanner (5 minutes)

**File:** `standalone/scanner.js`

Add this function at the top:
```javascript
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
```

Replace line 529 (and similar lines):
```javascript
// BEFORE:
<div class="result-name">${stream.displayName}</div>

// AFTER:
<div class="result-name">${escapeHtml(stream.displayName)}</div>
```

Apply to ALL these lines:
- Line 529: `stream.displayName`
- Line 536: `stream.title`
- Line 539: `stream.game`
- Lines 542, 545: `stream.url`, `stream.username`, `stream.platform`

---

### 2. Fix Undefined Event Error (1 minute)

**File:** `standalone/scanner.js`

**Line 323:** Change from:
```javascript
async youtubeSignIn() {
```

To:
```javascript
async youtubeSignIn(event) {
```

Do the same for line 333 if there's another place.

---

### 3. Fix Missing Twitch accessToken (1 minute)

**File:** `standalone/scanner-plugins.js`

**Line 39:** Add after `this.clientId = null;`:
```javascript
this.clientId = null;
this.accessToken = null;  // ADD THIS LINE
this.clientSecret = null; // ADD THIS TOO
```

---

### 4. Fix OAuth Memory Leak (2 minutes)

**File:** `standalone/scanner-plugins.js` (line 203)

**Replace the try-catch block:**
```javascript
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

            const params = new URLSearchParams(popupUrl.split('#')[1]);
            this.accessToken = params.get('access_token');
            const expiresIn = parseInt(params.get('expires_in')) || 3600;
            this.tokenExpiry = Date.now() + (expiresIn * 1000);
            this.isAuthenticated = true;

            this.saveCredentials();
            resolve(true);
        }
    } catch (error) {
        // Only ignore cross-origin SecurityError
        if (error.name !== 'SecurityError') {
            console.error('OAuth popup error:', error);
            clearInterval(checkPopup);  // ADD THIS
            if (!popup.closed) popup.close();
            reject(error);
        }
    }
}, 500);
```

Apply same fix to `control-panel.html` line 2398.

---

### 5. Add localStorage Error Handling (3 minutes)

**File:** `standalone/app.js`

Wrap `saveState()` function (line 78):
```javascript
saveState() {
    try {
        localStorage.setItem('multistream_layout', this.gridLayout);
        localStorage.setItem('multistream_grid', JSON.stringify(this.gridStreams));
        localStorage.setItem('multistream_audio', this.activeAudioIndex);
        localStorage.setItem('multistream_streamers', JSON.stringify(this.savedStreamers));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            alert('Storage full! Please clear some saved streams or browser data.');
        } else if (error.name === 'SecurityError') {
            console.warn('localStorage not available (private browsing?)');
        } else {
            console.error('Failed to save state:', error);
        }
    }
}
```

Also wrap `loadState()`:
```javascript
loadState() {
    try {
        this.gridLayout = localStorage.getItem('multistream_layout') || '2x2';
        this.gridStreams = JSON.parse(localStorage.getItem('multistream_grid') || '[]');
        // ... rest of code
    } catch (error) {
        console.error('Failed to load state:', error);
        // Use defaults
        this.gridLayout = '2x2';
        this.gridStreams = [];
        this.activeAudioIndex = -1;
        this.savedStreamers = [];
    }
}
```

---

## 🟡 IMPORTANT BUT NOT URGENT

### 6. Add Input Validation (10 minutes)

**File:** `standalone/scanner.js`

Add validation in keyword input handler (line 46):
```javascript
keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const keyword = keywordInput.value.trim();

        // ADD VALIDATION:
        if (!keyword) return;

        if (keyword.length > 100) {
            alert('Keyword too long (max 100 characters)');
            return;
        }

        if (!/^[a-zA-Z0-9\s\-_]+$/.test(keyword)) {
            alert('Invalid characters. Use only letters, numbers, spaces, hyphens and underscores.');
            return;
        }

        if (this.keywords.includes(keyword)) {
            alert('Keyword already added');
            return;
        }

        // ... rest of existing code
    }
});
```

---

### 7. Fix Sortable Race Condition (3 minutes)

**File:** `standalone/app.js` (line 30)

Replace:
```javascript
if (typeof Sortable === 'undefined') {
    setTimeout(() => this.initSortable(), 100);
    return;
}
```

With:
```javascript
initSortable(retryCount = 0) {
    const grid = document.getElementById('streamGrid');
    if (this.sortableInstance) {
        this.sortableInstance.destroy();
    }

    if (typeof Sortable === 'undefined') {
        if (retryCount < 50) {  // Max 5 seconds
            setTimeout(() => this.initSortable(retryCount + 1), 100);
        } else {
            console.error('Failed to load Sortable library. Drag-and-drop disabled.');
        }
        return;
    }

    // ... rest of existing code
}
```

---

### 8. Add CSRF Protection to OAuth (5 minutes)

**File:** `standalone/scanner-plugins.js` (line 175)

Before OAuth flow:
```javascript
async signIn(clientId, clientSecret = null) {
    this.clientId = clientId;

    // ADD: Generate random state
    const state = crypto.randomUUID();
    sessionStorage.setItem('youtube_oauth_state', state);

    const redirectUri = window.location.origin + window.location.pathname;
    const scope = 'https://www.googleapis.com/auth/youtube.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}`;  // CHANGE: Use random state
```

After callback:
```javascript
if (popupUrl.includes('access_token=')) {
    clearInterval(checkPopup);
    popup.close();

    const params = new URLSearchParams(popupUrl.split('#')[1]);

    // ADD: Verify state
    const receivedState = params.get('state');
    const expectedState = sessionStorage.getItem('youtube_oauth_state');
    if (receivedState !== expectedState) {
        reject(new Error('Invalid OAuth state - possible CSRF attack'));
        return;
    }
    sessionStorage.removeItem('youtube_oauth_state');

    // ... rest of existing code
}
```

Apply same fix to control-panel.html OAuth flow.

---

## 📝 COPY ALL FILES TO OTHER VERSIONS

After making fixes, run:
```bash
cp standalone/scanner.js standalone-premium/scanner.js
cp standalone/scanner.js desktop-app/app/scanner.js

cp standalone/scanner-plugins.js standalone-premium/scanner-plugins.js
cp standalone/scanner-plugins.js desktop-app/app/scanner-plugins.js

cp standalone/app.js standalone-premium/app.js

cp standalone/control-panel.html standalone-premium/control-panel.html
cp standalone/control-panel.html desktop-app/app/control-panel.html
```

---

## ⏱️ TIME ESTIMATES

| Fix | Time | Priority |
|-----|------|----------|
| XSS Vulnerability | 5 min | 🔴 CRITICAL |
| Undefined Event | 1 min | 🔴 CRITICAL |
| Missing accessToken | 1 min | 🔴 CRITICAL |
| OAuth Memory Leak | 2 min | 🔴 CRITICAL |
| localStorage Error | 3 min | 🔴 CRITICAL |
| Input Validation | 10 min | 🟡 HIGH |
| Sortable Race | 3 min | 🟡 HIGH |
| CSRF Protection | 5 min | 🟡 HIGH |

**Total Time: ~30 minutes for all critical fixes**

---

## ✅ TESTING CHECKLIST

After fixes:
- [ ] Try scanning with malicious keyword like `<script>alert('xss')</script>`
- [ ] Test YouTube OAuth sign-in
- [ ] Test Twitch configuration
- [ ] Fill localStorage to quota limit
- [ ] Test in private browsing mode
- [ ] Disable JavaScript CDN and check Sortable fallback
- [ ] Try rapid clicking on buttons
- [ ] Test with slow network (throttling)

---

## 🚀 DEPLOYMENT

1. Fix all critical issues
2. Test thoroughly
3. Commit with message: "Security & bug fixes: XSS, memory leaks, undefined vars"
4. Push to branch
5. Create PR with CODE_REVIEW.md attached
