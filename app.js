// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// Initialize game state
let gameState = {
    level: 1,
    strength: 75,
    happiness: 80,
    health: 90,
    evolution: 'Baby Bull',
    experience: 0,
    experienceToNextLevel: 100,
    coins: 0
};

// Expand the webapp to full height
tg.expand();

// Set up main button
tg.MainButton.text = "Close Game";
tg.MainButton.onClick(() => {
    tg.close();
});

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const feedButton = document.getElementById('feedButton');
const trainButton = document.getElementById('trainButton');
const evolveButton = document.getElementById('evolveButton');
const copyButton = document.getElementById('copyButton');
const inviteLink = document.getElementById('inviteLink');
const filterButtons = document.querySelectorAll('.filter-btn');

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('href').slice(1);
        
        // Update active states
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        pages.forEach(page => {
            page.classList.remove('active');
            if (page.id === targetId) {
                page.classList.add('active');
            }
        });

        // Haptic feedback
        tg.HapticFeedback.impactOccurred('light');
    });
});

// Game Functions
function updateStats() {
    // Update DOM elements with current stats
    document.getElementById('bullLevel').textContent = gameState.level;
    document.getElementById('strengthProgress').style.width = `${gameState.strength}%`;
    document.getElementById('happinessProgress').style.width = `${gameState.happiness}%`;
    document.getElementById('evolutionStage').textContent = gameState.evolution;
    document.getElementById('healthProgress').style.width = `${gameState.health}%`;
    document.getElementById('strengthDetailProgress').style.width = `${gameState.strength}%`;
}

function feed() {
    if (gameState.happiness < 100) {
        gameState.happiness = Math.min(100, gameState.happiness + 10);
        gameState.health = Math.min(100, gameState.health + 5);
        gainExperience(10);
        updateStats();
        tg.HapticFeedback.impactOccurred('light');
        showNotification('Fed your bull! 🍎');
    } else {
        showNotification('Your bull is already full! 😊');
    }
}

function train() {
    if (gameState.strength < 100) {
        gameState.strength = Math.min(100, gameState.strength + 5);
        gameState.happiness = Math.max(0, gameState.happiness - 5);
        gainExperience(15);
        updateStats();
        tg.HapticFeedback.impactOccurred('medium');
        showNotification('Training complete! 💪');
    } else {
        showNotification('Your bull is at maximum strength! 🏆');
    }
}

function evolve() {
    if (gameState.level >= 5 && gameState.evolution === 'Baby Bull') {
        gameState.evolution = 'Young Bull';
        tg.HapticFeedback.notificationOccurred('success');
        showNotification('Your bull evolved into a Young Bull! 🌟');
        addAchievement('First Evolution', 'Evolved your bull to Young Bull stage!');
    } else if (gameState.level >= 10 && gameState.evolution === 'Young Bull') {
        gameState.evolution = 'Adult Bull';
        tg.HapticFeedback.notificationOccurred('success');
        showNotification('Your bull evolved into an Adult Bull! ⭐');
        addAchievement('Master Evolution', 'Evolved your bull to Adult Bull stage!');
    } else {
        showNotification('Not ready to evolve yet! Keep training! 💪');
    }
    updateStats();
}

function gainExperience(amount) {
    gameState.experience += amount;
    if (gameState.experience >= gameState.experienceToNextLevel) {
        levelUp();
    }
}

function levelUp() {
    gameState.level++;
    gameState.experience = 0;
    gameState.experienceToNextLevel = Math.floor(gameState.experienceToNextLevel * 1.5);
    gameState.coins += 50; // Reward coins on level up
    tg.HapticFeedback.notificationOccurred('success');
    showNotification(`Level Up! Your bull is now level ${gameState.level}! 🎉\nYou earned 50 Bull Coins! 💰`);
    
    if (gameState.level === 5) {
        addAchievement('Rising Star', 'Reached level 5!');
    } else if (gameState.level === 10) {
        addAchievement('Bull Master', 'Reached level 10!');
    }
}

function addAchievement(title, description) {
    const achievementList = document.querySelector('.achievement-list');
    const achievement = document.createElement('div');
    achievement.className = 'achievement-item';
    achievement.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div class="achievement-info">
            <h4>${title}</h4>
            <p>${description}</p>
        </div>
    `;
    achievementList.appendChild(achievement);
}

function showNotification(message) {
    tg.showPopup({
        title: 'Bulls',
        message: message,
        buttons: [{type: 'ok'}]
    });
}

// Leaderboard functionality
const leaderboardManager = {
    currentTimeframe: 'weekly',
    currentFilter: 'level',
    page: 1,
    itemsPerPage: 10,
    isLoading: false,

    init() {
        this.attachEventListeners();
        this.loadLeaderboardData();
        this.startTournamentTimer();
        this.initializeRealTimeUpdates();
    },

    attachEventListeners() {
        // Timeframe selector
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.time-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentTimeframe = btn.dataset.time;
                this.page = 1;
                this.loadLeaderboardData();
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelector('.filter-btn.active').classList.remove('active');
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.page = 1;
                this.loadLeaderboardData();
            });
        });

        // Load more button
        document.querySelector('.load-more-btn').addEventListener('click', () => {
            this.loadMoreEntries();
        });

        // Tournament join button
        document.querySelector('.join-tournament-btn').addEventListener('click', () => {
            this.joinTournament();
        });

        // Invite friends button
        document.querySelector('.invite-friends-btn').addEventListener('click', () => {
            this.inviteFriends();
        });
    },

    async loadLeaderboardData() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            // Show loading state
            document.querySelector('.leaderboard-list').classList.add('loading');

            // Simulate API call - replace with actual API endpoint
            const response = await this.fetchLeaderboardData();
            
            // Update leaderboard UI
            this.updateLeaderboardUI(response);
            
            // Update user's rank card
            this.updateUserRankCard(response.userRank);
            
            // Update achievements
            this.updateAchievements(response.achievements);
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Show error message to user
            Telegram.WebApp.showAlert('Failed to load leaderboard data. Please try again.');
        } finally {
            this.isLoading = false;
            document.querySelector('.leaderboard-list').classList.remove('loading');
        }
    },

    async fetchLeaderboardData() {
        // Simulate API response - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    entries: this.generateMockLeaderboardData(),
                    userRank: {
                        rank: 42,
                        xp: 1500,
                        nextRankXp: 1700,
                        progress: 65
                    },
                    achievements: [
                        { id: 1, title: 'Top 50 Player', description: 'Reached top 50 in global rankings', unlocked: true },
                        { id: 2, title: 'Leaderboard Legend', description: 'Stay in top 10 for 3 weeks', unlocked: false }
                    ]
                });
            }, 500);
        });
    },

    generateMockLeaderboardData() {
        // Generate mock data for testing
        return Array.from({ length: 10 }, (_, i) => ({
            rank: i + 1,
            username: `BullMaster${i + 1}`,
            level: Math.floor(Math.random() * 20) + 10,
            points: Math.floor(Math.random() * 1000) + 500,
            avatar: `https://placeholder.com/50`
        }));
    },

    updateLeaderboardUI(data) {
        const listContainer = document.querySelector('.leaderboard-list');
        const entries = data.entries.map(entry => this.createLeaderboardEntry(entry));
        
        if (this.page === 1) {
            // Clear existing entries if this is the first page
            listContainer.innerHTML = '';
        }
        
        entries.forEach(entry => listContainer.appendChild(entry));
    },

    createLeaderboardEntry(entry) {
        const div = document.createElement('div');
        div.className = 'leaderboard-entry';
        div.innerHTML = `
            <span class="rank">#${entry.rank}</span>
            <div class="player-info">
                <img src="${entry.avatar}" alt="${entry.username}" class="avatar">
                <span class="username">${entry.username}</span>
            </div>
            <span class="level">Level ${entry.level}</span>
            <span class="points">${entry.points}</span>
        `;
        return div;
    },

    updateUserRankCard(rankData) {
        const rankCard = document.querySelector('.user-rank-card');
        rankCard.querySelector('.rank-number').textContent = `#${rankData.rank}`;
        rankCard.querySelector('.progress').style.width = `${rankData.progress}%`;
        rankCard.querySelector('.progress-text span:first-child').textContent = 
            `${rankData.nextRankXp - rankData.xp} XP to Rank ${rankData.rank - 1}`;
    },

    updateAchievements(achievements) {
        const container = document.querySelector('.achievements-grid');
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? '' : 'locked'}">
                <i class="fas fa-${achievement.unlocked ? 'trophy' : 'lock'}"></i>
                <span class="achievement-title">${achievement.title}</span>
                <span class="achievement-desc">${achievement.description}</span>
            </div>
        `).join('');
    },

    async loadMoreEntries() {
        this.page++;
        await this.loadLeaderboardData();
    },

    startTournamentTimer() {
        const timerElement = document.getElementById('tournamentTimer');
        let timeLeft = 2 * 24 * 60 * 60 + 14 * 60 * 60 + 35 * 60; // 2d 14h 35m in seconds

        const updateTimer = () => {
            const days = Math.floor(timeLeft / (24 * 60 * 60));
            const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
            const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
            
            timerElement.textContent = `${days}d ${hours}h ${minutes}m`;
            
            if (timeLeft > 0) {
                timeLeft--;
                setTimeout(updateTimer, 1000);
            } else {
                timerElement.textContent = 'Tournament Ended';
                document.querySelector('.join-tournament-btn').disabled = true;
            }
        };

        updateTimer();
    },

    joinTournament() {
        Telegram.WebApp.showConfirm(
            'Join the Summer Bull Battle?',
            (confirmed) => {
                if (confirmed) {
                    // Add tournament join logic here
                    Telegram.WebApp.showAlert('Successfully joined the tournament!');
                }
            }
        );
    },

    inviteFriends() {
        // Generate invite link
        const inviteLink = 'https://t.me/BullGameBot?start=invite_123';
        
        // Show sharing options
        Telegram.WebApp.showPopup({
            title: 'Invite Friends',
            message: 'Share this link with your friends:',
            buttons: [
                {
                    id: 'copy',
                    type: 'default',
                    text: 'Copy Link'
                },
                {
                    id: 'share',
                    type: 'default',
                    text: 'Share'
                }
            ]
        }, (buttonId) => {
            if (buttonId === 'copy') {
                navigator.clipboard.writeText(inviteLink)
                    .then(() => Telegram.WebApp.showAlert('Link copied!'));
            } else if (buttonId === 'share') {
                Telegram.WebApp.switchInlineQuery(
                    `Join me in raising bulls! Use this link: ${inviteLink}`,
                    ['friends']
                );
            }
        });
    },

    initializeRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible' && !this.isLoading) {
                this.loadLeaderboardData();
            }
        }, 30000);
    }
};

// Initialize leaderboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    leaderboardManager.init();
});

// Leaderboard Filters
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const filter = button.dataset.filter;
        // Implement filtering logic here
        tg.HapticFeedback.impactOccurred('light');
    });
});

// Event Listeners
feedButton.addEventListener('click', feed);
trainButton.addEventListener('click', train);
evolveButton.addEventListener('click', evolve);

// Copy invite link functionality
copyButton.addEventListener('click', () => {
    inviteLink.select();
    document.execCommand('copy');
    tg.HapticFeedback.impactOccurred('light');
    showNotification('Invite link copied! 📋');
});

// Profile Section Manager
const profileManager = {
    init() {
        this.initTabSwitching();
        this.initImageUploads();
        this.initEditButtons();
        this.initInventoryFilters();
    },

    initTabSwitching() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all tabs and panes
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding pane
                btn.classList.add('active');
                const tabId = `${btn.dataset.tab}-content`;
                document.getElementById(tabId).classList.add('active');
            });
        });
    },

    initImageUploads() {
        const uploadBtns = document.querySelectorAll('.edit-banner-btn, .edit-avatar-btn');
        uploadBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = btn.closest('div').querySelector('img');
                            img.src = event.target.result;
                            // Here you would typically upload the image to your server
                            this.uploadImage(file, btn.classList.contains('edit-banner-btn') ? 'banner' : 'avatar');
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            });
        });
    },

    async uploadImage(file, type) {
        // Implement image upload to server
        console.log(`Uploading ${type} image:`, file);
        // Example implementation:
        // const formData = new FormData();
        // formData.append('image', file);
        // const response = await fetch(`/api/upload/${type}`, {
        //     method: 'POST',
        //     body: formData
        // });
        // const result = await response.json();
        // return result;
    },

    initEditButtons() {
        const editBtns = document.querySelectorAll('.edit-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.parentElement;
                const currentText = parent.childNodes[0].textContent.trim();
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentText;
                input.className = 'edit-input';
                
                input.onblur = () => {
                    const newText = input.value.trim();
                    if (newText && newText !== currentText) {
                        parent.childNodes[0].textContent = newText;
                        // Here you would typically update the value on your server
                        this.updateUserInfo(parent.classList.contains('username') ? 'username' : 'motto', newText);
                    }
                    input.remove();
                };

                parent.insertBefore(input, btn);
                input.focus();
            });
        });
    },

    async updateUserInfo(field, value) {
        // Implement server update
        console.log(`Updating ${field}:`, value);
        // Example implementation:
        // const response = await fetch('/api/user/update', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify({ field, value })
        // });
        // const result = await response.json();
        // return result;
    },

    initInventoryFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Here you would typically filter the inventory items
                this.filterInventory(btn.textContent.toLowerCase());
            });
        });
    },

    filterInventory(category) {
        const items = document.querySelectorAll('.inventory-item');
        items.forEach(item => {
            if (category === 'all' || item.dataset.category === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
};

// Initialize profile features when the page loads
document.addEventListener('DOMContentLoaded', () => {
    profileManager.init();
});

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    updateStats();
    
    // Set theme class
    document.documentElement.className = tg.colorScheme;
    
    // Enable animations
    document.body.style.opacity = 1;
    
    // Add some initial achievements
    addAchievement('Welcome!', 'Started your journey as a bull trainer!');
});

// Listen for theme changes
tg.onEvent('themeChanged', () => {
    document.documentElement.className = tg.colorScheme;
});
