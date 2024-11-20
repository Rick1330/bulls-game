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

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.BOT_TOKEN, {
    webHook: {
        port: process.env.PORT || 3000
    }
});

// Set webhook with better error handling
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

// CORS and JSON middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

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

// Handle webhook
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    console.log('Received webhook request:', req.body);
    bot.handleUpdate(req.body);
    res.sendStatus(200);
});

// Debug endpoint
app.get('/debug/webhook', async (req, res) => {
    try {
        const info = await bot.getWebHookInfo();
        res.json({
            webhook_info: info,
            current_url: `${url}/webhook/${process.env.BOT_TOKEN}`,
            environment: {
                MINI_APP_URL: process.env.MINI_APP_URL,
                BOT_USERNAME: process.env.BOT_USERNAME,
                MINI_APP_SHORT_NAME: process.env.MINI_APP_SHORT_NAME
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// API Routes
app.post('/api/auth', async (req, res) => {
    try {
        const { initData } = req.body;
        console.log('Received init data:', initData);

        // Parse the initData
        const params = new URLSearchParams(initData);
        const userDataStr = params.get('user');
        
        if (!userDataStr) {
            return res.status(400).json({ error: 'No user data found' });
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
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        res.json({ token, user });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: error.message });
    }
});

// Handle all other routes
app.get('*', (req, res) => {
    // Check if the request is coming from Telegram
    const userAgent = req.headers['user-agent'] || '';
    const isTelegramWebView = userAgent.includes('TelegramWebApp');
    
    if (!isTelegramWebView) {
        // If not from Telegram, serve the error page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Access Error</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background-color: #f5f5f5;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                        background: white;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 80%;
                    }
                    h1 { color: #ff4444; }
                    p { color: #666; }
                    a { color: #0088cc; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>⚠️ Access Error</h1>
                    <p>This game can only be played through Telegram.</p>
                    <p>Please open it using:</p>
                    <p><a href="http://t.me/bullsbite_bot/bullsgame">http://t.me/bullsbite_bot/bullsgame</a></p>
                    <p>Or search for @bullsbite_bot in Telegram</p>
                </div>
            </body>
            </html>
        `);
    } else {
        // If from Telegram, serve the game
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    
    // Start the server
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});
