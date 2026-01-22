// Stream Scanner Feature Configuration - PREMIUM VERSION
// Set SCANNER_ENABLED to false to completely disable the scanner feature
// This makes it easy to create a free version without scanner

const ScannerConfig = {
    // Feature flag - set to false to disable scanner entirely
    ENABLED: true,

    // Default settings
    DEFAULT_SCAN_INTERVAL: 30, // seconds (faster for premium)
    DEFAULT_MIN_VIEWERS: 0,

    // Plugin availability per version
    PLUGINS_ENABLED: {
        twitch: true,
        youtube: true,
        kick: true,
        tiktok: true
    },

    // Feature limits (enhanced for premium)
    MAX_KEYWORDS: 500, // 10x more than free
    MAX_RESULTS: 1000, // 10x more than free

    // UI Configuration
    SHOW_IN_CONTROL_PANEL: true, // Show scanner button in control panel

    // Version info
    VERSION: 'premium',
    IS_PREMIUM: true
};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ScannerConfig = ScannerConfig;
}
