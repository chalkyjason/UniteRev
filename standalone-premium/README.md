# Multi-Stream Manager - Premium Version 💎

**This is the PREMIUM version with license key validation and feature gating.**

---

## 🆓 Free vs Premium

### FREE Features (No License):
- ✅ Up to **4 streams** (2×2 grid max)
- ✅ Save up to **10 streams**
- ✅ Basic layouts: 1×1, 1×2, 2×1, 2×2
- ✅ Audio control with red border
- ✅ Manual stream adding

### 💎 PREMIUM Features (With License):
- ✅ Up to **16 streams** (4×4 grid)
- ✅ **Unlimited saved streams**
- ✅ **All grid layouts**: 1×1, 1×2, 2×1, 2×2, 2×3, 3×2, 3×3, 4×2, 2×4, 4×4
- ✅ Stream recording (coming soon)
- ✅ Hotkeys & shortcuts (coming soon)
- ✅ Custom themes (coming soon)
- ✅ Quality selector (coming soon)

---

## 🔐 License System

### How It Works:

1. **User opens app** → Sees FREE badge in header
2. **Tries premium feature** (e.g., 4×4 grid) → Upgrade modal appears
3. **Clicks "Buy Premium"** → Goes to Gumroad
4. **Purchases** → Receives license key via email
5. **Clicks "Activate License"** → Enters key
6. **Premium unlocked!** → All features available

### License Key Format:

```
MULTI-XXXXX-XXXXX-XXXXX
```

Example: `MULTI-A3B9K-7F2DX-9M4WC`

- **Prefix**: `MULTI` (Multi-Stream Manager)
- **3 segments**: Random alphanumeric (no confusing chars)
- **Validation**: Simple checksum (expandable to server validation)

---

## 🛠️ For Developers

### Test License Keys

These keys are hardcoded for testing:

```javascript
MULTI-PREM1-UM12-3456  // PREMIUM tier
MULTI-PRO12-3456-7890  // PRO tier
```

### Adding Real License Validation

**Option 1: Gumroad License API**

```javascript
async validateLicense(key) {
    const response = await fetch('https://api.gumroad.com/v2/licenses/verify', {
        method: 'POST',
        body: JSON.stringify({
            product_id: 'YOUR_PRODUCT_ID',
            license_key: key
        })
    });

    const data = await response.json();
    return data.success ? 'PREMIUM' : false;
}
```

**Option 2: Your Own Server**

```javascript
async validateLicense(key) {
    const response = await fetch('https://yoursite.com/api/validate', {
        method: 'POST',
        body: JSON.stringify({ key })
    });

    const data = await response.json();
    return data.valid ? data.tier : false;
}
```

**Option 3: Encrypted Local Validation** (Current)

```javascript
validateLicense(key) {
    // Simple format check
    if (!key.startsWith('MULTI-')) return false;

    // In production: Use crypto to validate signature
    // For now: Check against known keys
    const validKeys = {
        'MULTI-PREM1-UM12-3456': 'PREMIUM',
        'MULTI-PRO12-3456-7890': 'PRO'
    };

    return validKeys[key] || false;
}
```

### Feature Gating

**Example: Limit Stream Count**

```javascript
canAddStream() {
    const limit = this.limits[this.licenseType].maxStreams;
    const current = this.gridStreams.filter(s => s !== null).length;

    if (current >= limit) {
        this.showUpgradeModal('stream_limit');
        return false;
    }
    return true;
}
```

**Example: Lock Premium Layouts**

```javascript
canUseLayout(layout) {
    const allowed = this.limits[this.licenseType].allowedLayouts;

    if (!allowed.includes(layout)) {
        this.showUpgradeModal('layout_limit');
        return false;
    }
    return true;
}
```

### Adding New Premium Features

1. **Add to limits object:**

```javascript
limits: {
    FREE: {
        features: {
            recording: false,
            newFeature: false  // ← Add here
        }
    },
    PREMIUM: {
        features: {
            recording: true,
            newFeature: true   // ← Add here
        }
    }
}
```

2. **Gate the feature:**

```javascript
startRecording() {
    if (!this.canUseFeature('newFeature')) {
        this.showUpgradeModal('feature_limit');
        return;
    }

    // Your feature code...
}
```

3. **Add to upgrade modal:**

```html
<li>Your new premium feature</li>
```

---

## 💰 Monetization Setup

### 1. Set Up Gumroad

1. Go to https://gumroad.com
2. Create product
3. Set price: $9.99
4. Enable **"Generate a unique license key"**
5. Upload this folder as ZIP

### 2. Update Buy Button

In `index.html`, line ~XXX, update:

```html
<button class="btn-buy" onclick="window.open('https://gumroad.com/l/YOUR-URL', '_blank')">
```

Replace `YOUR-URL` with your Gumroad product URL

### 3. Integrate License Validation

Choose your validation method:

**Quick Start (Gumroad API):**
- Get Gumroad API key
- Update `validateLicense()` function
- Test with real purchase

**Advanced (Your Server):**
- Build validation endpoint
- Store licenses in database
- Track activations per license

### 4. Launch!

See `QUICK_START_SELLING.md` for complete launch guide

---

## 🎨 Customization

### Change Pricing

In `index.html` upgrade modal:

```html
<div class="price">$9.99</div>  <!-- Change this -->
```

### Add Monthly Subscription

```html
<div class="pricing-options">
    <button onclick="buyOneTime()">$9.99 One-time</button>
    <button onclick="buyMonthly()">$2.99/month</button>
</div>
```

### Change Feature Limits

In `app.js`:

```javascript
limits: {
    FREE: {
        maxStreams: 4,      // ← Change this
        maxSaved: 10,       // ← Change this
        // ...
    }
}
```

### Customize Upgrade Modal

In `index.html`, search for `upgrade-modal-content` and customize:
- Icon
- Title
- Message
- Features list
- Pricing
- Button text

---

## 📊 Analytics

### Track Upgrade Modal Views

```javascript
showUpgradeModal(reason) {
    // Track with Google Analytics
    gtag('event', 'upgrade_modal_shown', {
        'reason': reason,
        'license_type': this.licenseType
    });

    // Show modal...
}
```

### Track Conversions

```javascript
saveLicense(type, key) {
    // Track successful activation
    gtag('event', 'license_activated', {
        'license_type': type
    });

    // Save license...
}
```

### Track Feature Usage

```javascript
setLayout(layout) {
    // Track layout changes
    gtag('event', 'layout_changed', {
        'layout': layout,
        'license_type': this.licenseType
    });

    // Change layout...
}
```

---

## 🧪 Testing

### Test Free Tier Limits

1. Open app (no license)
2. Add 4 streams → Should work
3. Try to add 5th → Should show upgrade modal
4. Try 3×3 layout → Should show upgrade modal
5. Save 10 streams → Should work
6. Try to save 11th → Should show upgrade modal

### Test Premium Activation

1. Click "Activate License"
2. Enter: `MULTI-PREM1-UM12-3456`
3. Should show success message
4. Badge should change to "✓ PREMIUM"
5. Try 4×4 layout → Should work
6. Try adding 16 streams → Should work
7. Save unlimited streams → Should work

### Test Persistence

1. Activate premium
2. Close browser
3. Reopen app
4. Should still show as PREMIUM
5. Premium features should work

---

## 🚀 Deployment

### As Standalone App

1. ZIP the `standalone-premium` folder
2. Upload to Gumroad
3. Users download and open `index.html`
4. Works immediately in browser

### As Electron App

1. Wrap in Electron
2. Build installers (.exe, .dmg, .AppImage)
3. Distribute via Gumroad or your site
4. Auto-update support

### As Web App

1. Host on your domain
2. Users visit URL
3. License stored in localStorage
4. Works across devices

---

## 🔒 Security Considerations

### Current Implementation:
- ✅ Simple format validation
- ✅ localStorage persistence
- ✅ Basic test keys
- ⚠️ Keys can be shared (no tracking)
- ⚠️ No server validation

### Recommended for Production:
- ✅ Server-side validation
- ✅ Track activations per key
- ✅ Limit devices per license
- ✅ Revocation capability
- ✅ Encrypted key storage

### Quick Security Upgrade:

```javascript
validateLicense(key) {
    // Check format
    if (!key.match(/^MULTI-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/)) {
        return false;
    }

    // Validate with server
    return await fetch('/api/validate', {
        method: 'POST',
        body: JSON.stringify({ key })
    }).then(r => r.json());
}
```

---

## 📝 Customer Instructions

When a customer purchases, send them this:

```
Thanks for purchasing Multi-Stream Manager Premium! 🎉

YOUR LICENSE KEY:
[LICENSE-KEY-HERE]

HOW TO ACTIVATE:

1. Download the app (attached)
2. Extract the ZIP file
3. Open "index.html" in Chrome or Firefox
4. Click the green "Upgrade" button in the header
5. Click "Already have a license? Activate it here"
6. Paste your license key
7. Press Enter

That's it! All premium features are now unlocked.

PREMIUM FEATURES YOU NOW HAVE:
✅ Up to 16 streams (4×4 grid)
✅ All grid layouts
✅ Unlimited saved streams
✅ Lifetime updates

Need help? Reply to this email anytime!

Enjoy! 🚀
```

---

## 🐛 Troubleshooting

### "License key invalid"
- Check for typos (dashes matter!)
- Copy the entire key including MULTI-
- Try clearing browser cache

### "Premium features still locked"
- Refresh the page
- Clear localStorage: `localStorage.clear()`
- Re-enter license key

### "License not persisting"
- Check browser localStorage is enabled
- Try a different browser
- Check browser privacy settings

---

## 💡 Ideas for More Premium Features

### Easy to Add:
- Dark/light theme toggle
- Custom grid colors
- Stream quality selector
- Keyboard shortcuts
- Fullscreen mode
- Picture-in-picture

### Medium Difficulty:
- Stream recording
- Screenshot capture
- Stream alerts/notifications
- Cloud sync (save to server)
- Export/import settings

### Advanced:
- Multi-instance support
- API access
- Webhook integrations
- Team features
- White label option
- Custom integrations

---

## 📞 Support

Questions about the premium system?
- Email: support@yoursite.com
- Discord: [Your Server]
- Twitter: @yourhandle

---

**Ready to start selling? See `QUICK_START_SELLING.md` for the complete launch guide!**

**License key generation, Gumroad setup, and marketing templates included.**

🚀 **Let's make some money!**
