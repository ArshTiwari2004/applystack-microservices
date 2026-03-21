const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

// Initialize Redis connection
async function connectRedis() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
        redisClient = createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: false // Disable auto-reconnect
            }
        });

        redisClient.on('error', (err) => {
            if (isConnected) {
                console.error('Redis Client Error:', err.message);
            }
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('Redis client connected');
            isConnected = true;
        });

        redisClient.on('end', () => {
            console.log('Redis client disconnected');
            isConnected = false;
        });

        await redisClient.connect();
        isConnected = true;
        console.log('Successfully connected to Redis');
        return redisClient;
    } catch (error) {
        console.log('Redis not available - caching disabled');
        redisClient = null;
        isConnected = false;
        return null;
    }
}

// Get Redis client
function getRedisClient() {
    return isConnected ? redisClient : null;
}

// Check if Redis is available
function isRedisAvailable() {
    return isConnected && redisClient !== null;
}

// Cache helpers
async function setCache(key, value, expirySeconds = 3600) {
    if (!isRedisAvailable()) return false;
    try {
        await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Redis setCache error:', error.message);
        return false;
    }
}

async function getCache(key) {
    if (!isRedisAvailable()) return null;
    try {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Redis getCache error:', error.message);
        return null;
    }
}

async function deleteCache(key) {
    if (!isRedisAvailable()) return false;
    try {
        await redisClient.del(key);
        return true;
    } catch (error) {
        console.error('Redis deleteCache error:', error.message);
        return false;
    }
}

// Session management
async function setSession(userId, sessionData, expirySeconds = 604800) { // 7 days
    return setCache(`session:${userId}`, sessionData, expirySeconds);
}

async function getSession(userId) {
    return getCache(`session:${userId}`);
}

async function deleteSession(userId) {
    return deleteCache(`session:${userId}`);
}

// Close Redis connection
async function closeRedis() {
    if (redisClient && isConnected) {
        try {
            await redisClient.quit();
            console.log('Redis connection closed');
        } catch (error) {
            // Ignore errors on close
        }
    }
    isConnected = false;
    redisClient = null;
}

module.exports = {
    connectRedis,
    getRedisClient,
    isRedisAvailable,
    setCache,
    getCache,
    deleteCache,
    setSession,
    getSession,
    deleteSession,
    closeRedis
};
