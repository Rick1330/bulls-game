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

        // Check if running in Telegram environment
        if (!window.Telegram?.WebApp) {
            this.showDirectAccessError();
            return;
        }

        // Initialize Telegram WebApp
        try {
            this.webapp = window.Telegram.WebApp;
            console.log('Telegram WebApp:', this.webapp);
            
            // Initialize and expand the WebApp
            this.webapp.ready();
            this.webapp.expand();

            // Hide loading overlay
            this.hideLoading();

            // Initialize the game
            this.initializeGame();
        } catch (error) {
            console.error('Error initializing Telegram WebApp:', error);
            this.showDirectAccessError();
        }
    }

    showDirectAccessError() {
        const errorMessage = document.getElementById('error-message');
        const loadingOverlay = document.getElementById('loading');
        if (errorMessage) errorMessage.style.display = 'block';
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loading');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    async initializeGame() {
        try {
            // Log initialization data
            console.log('Init Data:', this.webapp.initData);
            console.log('Init Data Unsafe:', this.webapp.initDataUnsafe);

            if (!this.webapp.initDataUnsafe?.user) {
                throw new Error('No user data in initialization');
            }

            // Authenticate with the server
            const authResponse = await this.api.post('/auth', {
                initData: this.webapp.initData
            });

            if (!authResponse.ok) {
                throw new Error('Authentication failed');
            }

            // Set the auth token
            this.api.setAuthToken(authResponse.token);
            this.user = authResponse.user;

            // Load user's bulls
            await this.loadBulls();

            // Setup UI event listeners
            this.setupEventListeners();
        } catch (error) {
            console.error('Game initialization error:', error);
            this.showError('Failed to initialize game. Please try again later.');
        }
    }

    bindUIElements() {
        try {
            // Loading overlay
            this.loadingOverlay = document.getElementById('loading');
            if (!this.loadingOverlay) {
                throw new Error('Loading overlay element not found');
            }
            
            // Main sections
            this.userStatsSection = document.getElementById('user-stats');
            this.bullsContainer = document.getElementById('bulls-container');
            this.trainingSection = document.getElementById('training');
            this.shopSection = document.getElementById('shop');

            // Forms
            this.createBullForm = document.getElementById('create-bull-form');
            
            // Buttons
            this.trainStrengthBtn = document.getElementById('train-strength');
            this.trainSpeedBtn = document.getElementById('train-speed');
            this.trainStaminaBtn = document.getElementById('train-stamina');
            this.feedBullBtn = document.getElementById('feed-bull');
            
            // Navigation
            this.navBtns = document.querySelectorAll('.nav-btn');
            this.sections = document.querySelectorAll('.section');

            // Verify critical elements
            if (!this.userStatsSection || !this.bullsContainer) {
                throw new Error('Critical UI elements not found');
            }
        } catch (error) {
            console.error('UI Elements binding failed:', error);
            throw error;
        }
    }

    showError(message) {
        console.error('Game Error:', message);
        if (this.loadingOverlay) {
            this.loadingOverlay.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn">Try Again</button>
                </div>
            `;
        } else {
            alert(message);
        }
    }

    setupEventListeners() {
        try {
            // Navigation
            this.navBtns.forEach(btn => {
                btn.addEventListener('click', () => this.navigateToSection(btn.dataset.section));
            });

            // Create Bull Form
            this.createBullForm?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                try {
                    const newBull = await this.api.createBull({
                        name: formData.get('name'),
                        type: formData.get('type')
                    });
                    this.bulls.push(newBull);
                    this.updateBullsDisplay();
                    this.navigateToSection('bulls');
                    e.target.reset();
                } catch (error) {
                    console.error('Failed to create bull:', error);
                    this.webapp.showPopup({
                        title: 'Error',
                        message: 'Failed to create bull. Please try again.',
                        buttons: [{type: 'ok'}]
                    });
                }
            });

            // Training Buttons
            this.trainStrengthBtn?.addEventListener('click', () => this.trainBull('strength'));
            this.trainSpeedBtn?.addEventListener('click', () => this.trainBull('speed'));
            this.trainStaminaBtn?.addEventListener('click', () => this.trainBull('stamina'));
            this.feedBullBtn?.addEventListener('click', () => this.feedBull());
        } catch (error) {
            console.error('Event listener binding failed:', error);
            throw error;
        }
    }

    updateUserStats() {
        if (!this.user) return;
        
        this.userStatsSection.innerHTML = `
            <div class="stat">
                <i class="fas fa-user"></i>
                <span>Level ${this.user.level}</span>
            </div>
            <div class="stat">
                <i class="fas fa-star"></i>
                <span>${this.user.experience} XP</span>
            </div>
            <div class="stat">
                <i class="fas fa-coins"></i>
                <span>${this.user.coins} Coins</span>
            </div>
        `;
    }

    updateBullsDisplay() {
        this.bullsContainer.innerHTML = '';
        
        if (this.bulls.length === 0) {
            this.bullsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bull"></i>
                    <p>You don't have any bulls yet!</p>
                    <button class="btn primary" onclick="game.navigateToSection('create')">
                        Create Your First Bull
                    </button>
                </div>
            `;
            return;
        }

        this.bulls.forEach(bull => {
            const card = document.createElement('div');
            card.className = 'bull-card' + (bull === this.selectedBull ? ' selected' : '');
            card.innerHTML = `
                <h3>${bull.name}</h3>
                <div class="bull-stats">
                    <div class="stat">
                        <i class="fas fa-dumbbell"></i>
                        <span>Strength: ${bull.strength}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-bolt"></i>
                        <span>Speed: ${bull.speed}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-heart"></i>
                        <span>Stamina: ${bull.stamina}</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-battery-full"></i>
                        <span>Health: ${bull.health}%</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-smile"></i>
                        <span>Happiness: ${bull.happiness}%</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => this.selectBull(bull));
            this.bullsContainer.appendChild(card);
        });
    }

    async createBull() {
        try {
            const name = document.getElementById('name').value;
            const type = document.getElementById('type').value;
            
            const newBull = await this.api.createBull({ name, type });
            this.bulls.push(newBull);
            this.updateBullsDisplay();
            this.navigateToSection('bulls');
            this.showSuccess('Bull created successfully!');
        } catch (error) {
            console.error('Error creating bull:', error);
            this.showError('Failed to create bull. Please try again.');
        }
    }

    selectBull(bull) {
        this.selectedBull = bull;
        this.updateBullsDisplay();
        this.updateTrainingButtons();
    }

    async trainBull(attribute) {
        if (!this.selectedBull) {
            this.showError('Please select a bull to train!');
            return;
        }

        if (this.gameState.isTraining) {
            this.showError('Training in progress!');
            return;
        }

        const now = Date.now();
        if (this.gameState.lastTrainingTime && 
            now - this.gameState.lastTrainingTime < this.gameState.trainingCooldown) {
            const remainingTime = Math.ceil((this.gameState.trainingCooldown - (now - this.gameState.lastTrainingTime)) / 1000);
            this.showError(`Training cooldown: ${remainingTime} seconds remaining`);
            return;
        }

        try {
            this.gameState.isTraining = true;
            this.updateTrainingButtons();

            const result = await this.api.trainBull(this.selectedBull._id, attribute);
            this.selectedBull = result.bull;
            this.user = result.user;

            this.gameState.lastTrainingTime = now;
            this.updateUserStats();
            this.updateBullsDisplay();
            this.showSuccess(`Training successful! ${attribute} increased!`);
        } catch (error) {
            console.error('Training error:', error);
            this.showError('Training failed. Please try again.');
        } finally {
            this.gameState.isTraining = false;
            this.updateTrainingButtons();
        }
    }

    async feedBull() {
        if (!this.selectedBull) {
            this.showError('Please select a bull to feed!');
            return;
        }

        try {
            const result = await this.api.feedBull(this.selectedBull._id);
            this.selectedBull = result.bull;
            this.user = result.user;
            
            this.updateUserStats();
            this.updateBullsDisplay();
            this.showSuccess('Bull fed successfully!');
        } catch (error) {
            console.error('Feeding error:', error);
            this.showError('Failed to feed bull. Please try again.');
        }
    }

    updateTrainingButtons() {
        const isDisabled = !this.selectedBull || this.gameState.isTraining;
        
        [this.trainStrengthBtn, this.trainSpeedBtn, this.trainStaminaBtn].forEach(btn => {
            btn.disabled = isDisabled;
            btn.textContent = isDisabled ? 'Select Bull First' : btn.dataset.originalText;
        });
    }

    navigateToSection(sectionId) {
        this.sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });

        this.navBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.section === sectionId) {
                btn.classList.add('active');
            }
        });
    }

    showSuccess(message) {
        this.webapp.showPopup({
            title: 'Success',
            message: message,
            buttons: [{
                type: 'ok',
                text: 'OK'
            }]
        });
    }

    async loadBulls() {
        try {
            const bullsResponse = await this.api.getBulls();
            this.bulls = bullsResponse.bulls;
            this.updateBullsDisplay();
        } catch (error) {
            console.error('Failed to load bulls:', error);
            this.showError('Failed to load bulls. Please try again.');
        }
    }
}

// Initialize game when document is ready
document.addEventListener('DOMContentLoaded', () => {
    const api = new API();
    window.game = new BullsGame(api);
});
