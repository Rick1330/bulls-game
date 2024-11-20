require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Import models
const Bull = require('./models/Bull');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(cors());

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, {
    webHook: {
        port: process.env.PORT || 3000
    }
});

// Set webhook
const url = process.env.MINI_APP_URL;
console.log('Setting webhook URL:', `${url}/webhook/${process.env.BOT_TOKEN}`);

bot.setWebHook(`${url}/webhook/${process.env.BOT_TOKEN}`)
    .then(() => {
        console.log('Webhook set successfully');
        return bot.getWebHookInfo();
    })
    .then((info) => {
        console.log('Webhook info:', info);
    })
    .catch(error => {
        console.error('Failed to set webhook:', error);
    });

// Bot command handlers
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{ text: '🎮 Play Bulls Game', web_app: { url: process.env.MINI_APP_URL } }]
        ]
    };
    bot.sendMessage(chatId, 'Welcome to Bulls Game! Click the button below to start playing:', {
        reply_markup: keyboard
    });
});

// Verify Telegram WebApp data
function verifyTelegramWebAppData(initData) {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Sort parameters alphabetically
    const paramsList = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    // Calculate data-check-string
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(process.env.BOT_TOKEN)
        .digest();

    const generatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(paramsList)
        .digest('hex');

    return hash === generatedHash;
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        User.findById(decoded.userId)
            .then(user => {
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                req.user = user;
                next();
            })
            .catch(error => {
                console.error('Auth middleware error:', error);
                res.status(500).json({ error: 'Internal server error' });
            });
    });
}

// API Routes
app.post('/api/auth', async (req, res) => {
    try {
        const { initData } = req.body;
        console.log('Auth request:', { initData });

        if (!initData) {
            throw new Error('No initialization data provided');
        }

        // Verify the data
        if (!verifyTelegramWebAppData(initData)) {
            throw new Error('Invalid initialization data');
        }

        // Parse the initData
        const params = new URLSearchParams(initData);
        const userDataStr = params.get('user');
        
        if (!userDataStr) {
            throw new Error('No user data in initialization data');
        }

        const userData = JSON.parse(userDataStr);
        console.log('Parsed user data:', userData);

        // Find or create user
        let user = await User.findOne({ telegramId: userData.id.toString() });
        if (!user) {
            user = new User({
                telegramId: userData.id.toString(),
                username: userData.username,
                firstName: userData.first_name,
                lastName: userData.last_name
            });
            await user.save();
            console.log('Created new user:', user);
        } else {
            console.log('Found existing user:', user);
        }

        // Generate token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: error.message });
    }
});

// Bull routes
app.get('/api/bulls', authenticateToken, async (req, res) => {
    try {
        const bulls = await Bull.find({ owner: req.user._id });
        res.json(bulls);
    } catch (error) {
        console.error('Error fetching bulls:', error);
        res.status(500).json({ error: 'Failed to fetch bulls' });
    }
});

app.post('/api/bulls', authenticateToken, async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name || name.length < 3) {
            return res.status(400).json({ error: 'Bull name must be at least 3 characters long' });
        }

        const bull = new Bull({
            name,
            owner: req.user._id,
            strength: Math.floor(Math.random() * 50) + 50,
            speed: Math.floor(Math.random() * 50) + 50,
            stamina: Math.floor(Math.random() * 50) + 50
        });

        await bull.save();
        res.json(bull);
    } catch (error) {
        console.error('Error creating bull:', error);
        res.status(500).json({ error: 'Failed to create bull' });
    }
});

app.post('/api/bulls/:id/train', authenticateToken, async (req, res) => {
    try {
        const bull = await Bull.findOne({ _id: req.params.id, owner: req.user._id });
        
        if (!bull) {
            return res.status(404).json({ error: 'Bull not found' });
        }

        // Random stat improvements
        const stats = ['strength', 'speed', 'stamina'];
        const stat = stats[Math.floor(Math.random() * stats.length)];
        const improvement = Math.floor(Math.random() * 5) + 1;

        bull[stat] = Math.min(100, bull[stat] + improvement);
        await bull.save();

        res.json(bull);
    } catch (error) {
        console.error('Error training bull:', error);
        res.status(500).json({ error: 'Failed to train bull' });
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
    });
