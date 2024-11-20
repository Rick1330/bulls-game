// Game Logic Handler
class BullsGame {
    constructor(api) {
        this.api = api;
        this.user = null;
        this.bulls = [];
        this.selectedBull = null;
        this.gameState = {
            isTraining: false,
            lastTrainingTime: null,
            trainingCooldown: 300000, // 5 minutes in milliseconds
        };

        // Initialize immediately
        this.init();
    }

    async init() {
        try {
            // Check if running in Telegram environment
            if (!window.Telegram?.WebApp) {
                console.error('Telegram WebApp not found');
                this.showDirectAccessError();
                return;
            }

            // Initialize Telegram WebApp
            this.webapp = window.Telegram.WebApp;
            console.log('Telegram WebApp initialized:', this.webapp);
            
            // Wait for webapp to be ready
            await new Promise(resolve => {
                this.webapp.ready();
                this.webapp.expand();
                // Give WebApp time to initialize
                setTimeout(resolve, 1000);
            });

            // Get initData
            const initData = this.webapp.initData;
            console.log('Init Data:', initData);

            if (!initData) {
                throw new Error('No init data available');
            }

            // Authenticate with backend
            const authResult = await this.api.post('/auth', { initData });
            console.log('Auth result:', authResult);

            if (!authResult || !authResult.token) {
                throw new Error('Authentication failed');
            }

            // Set the auth token
            this.api.setAuthToken(authResult.token);
            this.user = authResult.user;

            // Hide loading screen
            this.hideLoading();

            // Load game data
            await this.loadGameData();

            // Setup UI
            this.setupUI();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize game: ' + error.message);
        }
    }

    showDirectAccessError() {
        const errorMessage = document.getElementById('error-message');
        const loadingOverlay = document.getElementById('loading');
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <h2>⚠️ Access Error</h2>
                <p>This game can only be played through Telegram.</p>
                <p>Please open it using:</p>
                <p><a href="http://t.me/bullsbite_bot/bullsgame">http://t.me/bullsbite_bot/bullsgame</a></p>
                <p>Or search for @bullsbite_bot in Telegram</p>
            `;
        }
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    showError(message) {
        const errorMessage = document.getElementById('error-message');
        const loadingOverlay = document.getElementById('loading');
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.innerHTML = `
                <h2>⚠️ Error</h2>
                <p>${message}</p>
                <p>Please try again later or contact support.</p>
            `;
        }
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    async loadGameData() {
        try {
            // Load user's bulls
            const bulls = await this.api.getBulls();
            this.bulls = bulls;
            this.updateBullsDisplay();
        } catch (error) {
            console.error('Error loading game data:', error);
            this.showError('Failed to load game data');
        }
    }

    setupUI() {
        // Setup navigation
        const sections = ['bulls', 'training', 'shop'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.addEventListener('click', () => this.showSection(section));
            }
        });

        // Setup create bull form
        const createForm = document.getElementById('create-bull-form');
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const type = document.getElementById('type').value;
                try {
                    await this.api.createBull(name, type);
                    await this.loadGameData();
                    this.showSection('bulls');
                } catch (error) {
                    console.error('Error creating bull:', error);
                    this.showError('Failed to create bull');
                }
            });
        }
    }

    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    updateBullsDisplay() {
        const container = document.getElementById('bulls-container');
        if (!container) return;

        container.innerHTML = '';
        this.bulls.forEach(bull => {
            const card = document.createElement('div');
            card.className = 'bull-card';
            card.innerHTML = `
                <h3>${bull.name}</h3>
                <div class="stats">
                    <p>Strength: ${bull.strength}</p>
                    <p>Speed: ${bull.speed}</p>
                    <p>Stamina: ${bull.stamina}</p>
                </div>
            `;
            container.appendChild(card);
        });
    }
}

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const api = new API();
    window.game = new BullsGame(api);
});
