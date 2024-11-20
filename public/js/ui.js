// UI Handler
class UI {
    constructor() {
        this.pages = document.querySelectorAll('.page');
        this.navItems = document.querySelectorAll('.nav-item');
        this.gameContent = document.getElementById('game-content');
        this.loadingScreen = document.getElementById('loading-screen');
        
        this.setupEventListeners();
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = e.currentTarget.getAttribute('href').substring(1);
                this.navigateToPage(targetPage);
            });
        });

        // Handle back button
        window.addEventListener('popstate', () => {
            const page = window.location.hash.substring(1) || 'home';
            this.navigateToPage(page, false);
        });
    }

    // Navigation
    navigateToPage(pageId, addToHistory = true) {
        // Update navigation
        this.navItems.forEach(item => {
            item.classList.toggle('active', item.getAttribute('href') === `#${pageId}`);
        });

        // Update pages
        this.pages.forEach(page => {
            page.classList.toggle('active', page.id === pageId);
        });

        // Update history
        if (addToHistory) {
            window.history.pushState(null, '', `#${pageId}`);
        }

        // Load page content
        this.loadPageContent(pageId);
    }

    // Page Content Loading
    async loadPageContent(pageId) {
        const page = document.getElementById(pageId);
        if (!page) return;

        try {
            switch (pageId) {
                case 'profile':
                    await this.loadProfile();
                    break;
                case 'bulls':
                    await this.loadBulls();
                    break;
                case 'shop':
                    await this.loadShop();
                    break;
            }
        } catch (error) {
            console.error('Error loading page content:', error);
            this.showError('Failed to load content');
        }
    }

    // Profile Page
    async loadProfile() {
        const profilePage = document.getElementById('profile');
        // Profile content will be loaded here
    }

    // Bulls Page
    async loadBulls() {
        const bullsPage = document.getElementById('bulls');
        try {
            const bulls = await window.BULLS_GAME.api.getBulls();
            // Bulls content will be loaded here
        } catch (error) {
            console.error('Error loading bulls:', error);
            this.showError('Failed to load bulls');
        }
    }

    // Shop Page
    async loadShop() {
        const shopPage = document.getElementById('shop');
        try {
            const items = await window.BULLS_GAME.api.getShopItems();
            // Shop content will be loaded here
        } catch (error) {
            console.error('Error loading shop:', error);
            this.showError('Failed to load shop items');
        }
    }

    // UI Utilities
    showLoading() {
        this.loadingScreen.style.display = 'flex';
        this.gameContent.style.display = 'none';
    }

    hideLoading() {
        this.loadingScreen.style.display = 'none';
        this.gameContent.style.display = 'block';
    }

    showError(message) {
        // Implement error toast/notification
        console.error(message);
    }

    showSuccess(message) {
        // Implement success toast/notification
        console.log(message);
    }
}

// Export UI instance
window.BULLS_GAME.ui = new UI();
