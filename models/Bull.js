const mongoose = require('mongoose');

const bullSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 20
    },
    type: {
        type: String,
        enum: ['standard', 'speed', 'power'],
        default: 'standard'
    },
    strength: {
        type: Number,
        default: function() {
            return this.type === 'power' ? 15 : 10;
        }
    },
    speed: {
        type: Number,
        default: function() {
            return this.type === 'speed' ? 15 : 10;
        }
    },
    stamina: {
        type: Number,
        default: function() {
            return this.type === 'standard' ? 15 : 10;
        }
    },
    health: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    happiness: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    lastTrained: {
        type: Date,
        default: null
    },
    lastFed: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Add indexes
bullSchema.index({ owner: 1 });
bullSchema.index({ type: 1 });

// Add methods
bullSchema.methods.train = function(attribute) {
    const increase = Math.floor(Math.random() * 3) + 1;
    this[attribute] += increase;
    this.health = Math.max(0, Math.min(100, this.health - (Math.floor(Math.random() * 10) + 5)));
    this.happiness = Math.max(0, Math.min(100, this.happiness - (Math.floor(Math.random() * 10) + 5)));
    this.lastTrained = new Date();
    return increase;
};

bullSchema.methods.feed = function() {
    const healthIncrease = Math.floor(Math.random() * 20) + 10;
    const happinessIncrease = Math.floor(Math.random() * 20) + 10;
    this.health = Math.max(0, Math.min(100, this.health + healthIncrease));
    this.happiness = Math.max(0, Math.min(100, this.happiness + happinessIncrease));
    this.lastFed = new Date();
    return { healthIncrease, happinessIncrease };
};

module.exports = mongoose.model('Bull', bullSchema);
