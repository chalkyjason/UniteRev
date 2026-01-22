// Stream Scanner Feature Configuration
// Set SCANNER_ENABLED to false to completely disable the scanner feature
// This makes it easy to create a free version without scanner

const ScannerConfig = {
    // Feature flag - set to false to disable scanner entirely
    ENABLED: true,

    // Default settings
    DEFAULT_SCAN_INTERVAL: 60, // seconds
    DEFAULT_MIN_VIEWERS: 0,

    // Plugin availability per version
    PLUGINS_ENABLED: {
        twitch: true,
        youtube: true,
        kick: true,
        tiktok: true
    },

    // Feature limits (can be overridden in premium)
    MAX_KEYWORDS: 50,
    MAX_RESULTS: 100,

    // UI Configuration
    SHOW_IN_CONTROL_PANEL: true, // Show scanner button in control panel

    // Version info
    VERSION: 'free', // 'free' or 'premium'
    IS_PREMIUM: false
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ScannerConfig = ScannerConfig;
}
