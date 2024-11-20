// Main App Initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize theme
        window.BULLS_GAME.initTheme();

        // Initialize game
        const initialized = await window.BULLS_GAME.game.init();
        if (!initialized) {
            throw new Error('Game initialization failed');
        }

        // Hide loading screen
        window.BULLS_GAME.ui.hideLoading();

        // Set up Telegram WebApp buttons
        window.Telegram.WebApp.MainButton.setText('Create Bull').show();
        window.Telegram.WebApp.MainButton.onClick(() => {
            const name = prompt('Enter your bull\'s name:');
            if (name) {
                window.BULLS_GAME.game.createBull(name)
                    .then(() => {
                        window.BULLS_GAME.ui.showSuccess('Bull created successfully!');
                        window.BULLS_GAME.ui.navigateToPage('bulls');
                    })
                    .catch(error => {
                        window.BULLS_GAME.ui.showError('Failed to create bull');
                        console.error('Error:', error);
                    });
            }
        });

        // Handle navigation based on initial hash
        const initialPage = window.location.hash.substring(1) || 'home';
        window.BULLS_GAME.ui.navigateToPage(initialPage, false);

    } catch (error) {
        console.error('App initialization error:', error);
        window.BULLS_GAME.ui.showError('Failed to initialize app');
    }
});

// Global game functions
window.createNewBull = () => {
    const name = prompt('Enter your bull\'s name:');
    if (name) {
        window.BULLS_GAME.game.createBull(name)
            .then(() => {
                window.BULLS_GAME.ui.showSuccess('Bull created successfully!');
                window.BULLS_GAME.ui.navigateToPage('bulls');
            })
            .catch(error => {
                window.BULLS_GAME.ui.showError('Failed to create bull');
                console.error('Error:', error);
            });
    }
};

window.goToTraining = async () => {
    try {
        await window.BULLS_GAME.game.goToTraining();
        window.BULLS_GAME.ui.navigateToPage('training');
    } catch (error) {
        window.BULLS_GAME.ui.showError(error.message);
    }
};

window.goToCompetition = async () => {
    try {
        await window.BULLS_GAME.game.goToCompetition();
        window.BULLS_GAME.ui.navigateToPage('competition');
    } catch (error) {
        window.BULLS_GAME.ui.showError(error.message);
    }
};
