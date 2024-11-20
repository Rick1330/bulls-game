require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Bull = require('./models/Bull');

async function testConnection() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Successfully connected to MongoDB Atlas!');

        // Create a test user
        const testUser = new User({
            telegramId: 'test123',
            username: 'TestUser',
            level: 1,
            experience: 0,
            coins: 100
        });

        // Save the test user
        await testUser.save();
        console.log('Test user created successfully!');

        // Create a test bull
        const testBull = new Bull({
            owner: testUser._id,
            name: 'TestBull',
            type: 'standard',
            strength: 10,
            speed: 10,
            health: 100
        });

        // Save the test bull
        await testBull.save();
        console.log('Test bull created successfully!');

        // Update user with bull reference
        testUser.bulls.push(testBull._id);
        await testUser.save();
        console.log('User updated with bull reference!');

        // Clean up test data
        await Bull.deleteOne({ _id: testBull._id });
        await User.deleteOne({ _id: testUser._id });
        console.log('Test data cleaned up successfully!');

        console.log('All database operations completed successfully!');
    } catch (error) {
        console.error('Database test failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

testConnection();
