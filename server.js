require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

// Import models
const Bull = require('./models/Bull');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Extensive logging middleware
app.use((req, res, next) => {
    console.log('---REQUEST RECEIVED---');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files with detailed logging
app.use((req, res, next) => {
    console.log('Static file request:', req.url);
    next();
}, express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        console.log('Serving static file:', filePath);
    }
}));

// Dynamically determine the app URL with extensive logging
const APP_URL = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.MINI_APP_URL || 'http://localhost:3000';

console.log('ENVIRONMENT DETAILS:');
console.log('process.env.VERCEL_URL:', process.env.VERCEL_URL);
console.log('process.env.MINI_APP_URL:', process.env.MINI_APP_URL);
console.log('RESOLVED APP_URL:', APP_URL);

// Webhook diagnostics function
async function diagnoseWebhook() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/getWebhookInfo`);
        console.log('Telegram Webhook Diagnostics:');
        console.log('Webhook Info:', JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error('Failed to retrieve webhook info:', error);
        return null;
    }
}

// Initialize Telegram Bot with error handling
let bot;
try {
    bot = new TelegramBot(process.env.BOT_TOKEN, {
        webHook: {
            port: process.env.PORT || 3000
        }
    });

    // Webhook URL validation and logging
    const webhookUrl = `${APP_URL.replace(/\/+$/, '')}/webhook/${process.env.BOT_TOKEN}`;
    console.log('Attempting to set webhook URL:', webhookUrl);

    bot.setWebHook(webhookUrl, {
        // Optional certificate for secure webhook
        // certificate: fs.readFileSync('/path/to/cert.pem')
    })
    .then(async () => {
        console.log('Webhook set successfully');
        
        // Perform additional diagnostics
        const webhookInfo = await diagnoseWebhook();
        
        if (webhookInfo) {
            console.log('Webhook Diagnostics:');
            console.log('URL:', webhookInfo.result.url);
            console.log('Pending Update Count:', webhookInfo.result.pending_update_count);
            console.log('Last Error Date:', webhookInfo.result.last_error_date ? 
                new Date(webhookInfo.result.last_error_date * 1000).toISOString() : 'No recent errors');
            console.log('Last Error Message:', webhookInfo.result.last_error_message || 'N/A');
        }
        
        return bot.getWebHookInfo();
    })
    .then((info) => {
        console.log('Webhook info:', JSON.stringify(info, null, 2));
        
        // Additional validation
        if (!info.url) {
            console.error('Webhook URL not set correctly');
        }
    })
    .catch(error => {
        console.error('Failed to set webhook:', error);
        console.error('Detailed error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    });
} catch (error) {
    console.error('Error initializing Telegram Bot:', error);
}

// Webhook route with comprehensive error handling
app.post(`/webhook/${process.env.BOT_TOKEN}`, (req, res) => {
    console.log('Webhook received:', JSON.stringify(req.body, null, 2));
    
    try {
        if (bot && req.body) {
            bot.processUpdate(req.body);
        } else {
            console.error('Bot not initialized or no body received');
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// Bot command handlers with extensive logging
bot?.onText(/\/start/, (msg) => {
    console.log('Start command received:', JSON.stringify(msg, null, 2));
    const chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{ text: '🎮 Play Bulls Game', web_app: { url: APP_URL } }]
        ]
    };
    
    try {
        bot.sendMessage(chatId, 'Welcome to Bulls Game! Click the button below to start playing:', {
            reply_markup: keyboard
        });
    } catch (error) {
        console.error('Error sending start message:', error);
    }
});

// Verify Telegram WebApp data
function verifyTelegramWebAppData(initData) {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        
        if (!hash) {
            console.log('No hash found in initData');
            return false;
        }

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

        const isValid = hash === generatedHash;
        console.log('Telegram data verification:', { isValid, hash, generatedHash });
        return isValid;
    } catch (error) {
        console.error('Error verifying Telegram data:', error);
        return false;
    }
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
            console.error('Token verification error:', err);
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
        console.log('Auth request received:', req.body);
        const { initData } = req.body;

        if (!initData) {
            throw new Error('No initialization data provided');
        }

        // Verify the data
        if (!verifyTelegramWebAppData(initData)) {
            console.error('Invalid initialization data');
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

// Health check endpoint with webhook validation
app.get('/health', async (req, res) => {
    const webhookInfo = await diagnoseWebhook();
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: {
            VERCEL_URL: process.env.VERCEL_URL,
            MINI_APP_URL: process.env.MINI_APP_URL,
            RESOLVED_APP_URL: APP_URL,
            WEBHOOK_URL: `${APP_URL}/webhook/${process.env.BOT_TOKEN}`
        },
        webhookDiagnostics: webhookInfo
    });
});

// Handle all other routes - serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all route with logging
app.use((req, res, next) => {
    console.log('Unhandled route:', req.method, req.path);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Connect to MongoDB with extensive logging
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Start the server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log('Full server configuration:', {
                PORT,
                MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURED' : 'NOT SET',
                BOT_TOKEN: process.env.BOT_TOKEN ? 'CONFIGURED' : 'NOT SET',
                APP_URL
            });
        });
    })
    .catch(error => {
        console.error('MongoDB connection error:', error);
    });
