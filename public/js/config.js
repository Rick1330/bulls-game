// Game Configuration
const CONFIG = {
    // API Endpoints
    API: {
        BASE_URL: '/api',
        ENDPOINTS: {
            AUTH: '/auth/telegram',
            BULLS: '/bulls',
            INVENTORY: '/inventory',
            SHOP: '/shop',
            ACHIEVEMENTS: '/achievements',
            PROFILE: '/profile'
        }
    },

    // Game Constants
    GAME: {
        MAX_BULL_LEVEL: 100,
        MAX_STATS: 100,
        TRAINING_COOLDOWN: 3600, // 1 hour in seconds
        COMPETITION_COOLDOWN: 7200, // 2 hours in seconds
        INITIAL_COINS: 100,
        EXPERIENCE_MULTIPLIER: 1.5
    },

    // UI Constants
    UI: {
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000,
        MAX_INVENTORY_SLOTS: 50
    }
};

// Telegram WebApp initialization
const webapp = window.Telegram.WebApp;
webapp.ready(); // Notify Telegram that the Mini App is ready

// Initialize theme
const initTheme = () => {
    document.documentElement.style.setProperty('--tg-theme-bg-color', webapp.backgroundColor);
    document.documentElement.style.setProperty('--tg-theme-text-color', webapp.textColor);
    document.documentElement.style.setProperty('--tg-theme-hint-color', webapp.hint_color);
    document.documentElement.style.setProperty('--tg-theme-link-color', webapp.link_color);
    document.documentElement.style.setProperty('--tg-theme-button-color', webapp.button_color);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', webapp.button_text_color);
};

// Export configuration
window.BULLS_GAME = {
    CONFIG,
    webapp,
    initTheme
};
