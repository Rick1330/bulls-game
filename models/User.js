const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    level: {
        type: Number,
        default: 1,
        min: 1
    },
    experience: {
        type: Number,
        default: 0,
        min: 0
    },
    coins: {
        type: Number,
        default: 100,
        min: 0
    },
    bulls: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bull'
    }],
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Add methods
userSchema.methods.addExperience = function(amount) {
    this.experience += amount;
    while (this.experience >= 100) {
        this.level += 1;
        this.experience -= 100;
    }
};

userSchema.methods.addCoins = function(amount) {
    this.coins = Math.max(0, this.coins + amount);
};

userSchema.methods.canAfford = function(amount) {
    return this.coins >= amount;
};

userSchema.methods.spendCoins = function(amount) {
    if (!this.canAfford(amount)) {
        throw new Error('Not enough coins');
    }
    this.coins -= amount;
};

module.exports = mongoose.model('User', userSchema);
