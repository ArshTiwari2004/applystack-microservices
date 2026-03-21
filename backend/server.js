require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');

// Import services
const { connectRedis, closeRedis, getRedisClient } = require('./services/redis');
const { connectRabbitMQ, closeRabbitMQ, getRabbitMQChannel } = require('./services/rabbitmq');

const app = express();
const PORT = process.env.PORT || 8001;

// MongoDB connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'taskflow';
let db;

const mongoClient = new MongoClient(mongoUrl, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    maxPoolSize: 50,
    minPoolSize: 10
});

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoClient.connect();
        db = mongoClient.db(dbName);
        console.log('Successfully connected to MongoDB');
        return db;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Make db and services available to routes
app.use((req, res, next) => {
    req.db = db;
    req.redis = getRedisClient();
    req.rabbitmq = getRabbitMQChannel();
    next();
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:4173',
            'https://taskflow-smem.vercel.app',
            process.env.CORS_ORIGINS
        ].flat().filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieParser());

// Import routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const jobRoutes = require('./routes/jobs');
const templateRoutes = require('./routes/templates');
const companyRoutes = require('./routes/companies');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/companies', companyRoutes);

// Root endpoint
app.get('/api', (req, res) => {
    res.json({ message: 'TaskFlow API', status: 'running' });
});

// Health check endpoints
app.get('/api/health', async (req, res) => {
    try {
        // Check MongoDB
        await db.command({ ping: 1 });

        // Check Redis
        const redisStatus = getRedisClient() ? 'connected' : 'not connected';

        // Check RabbitMQ
        const rabbitmqStatus = getRabbitMQChannel() ? 'connected' : 'not connected';

        res.json({
            status: 'healthy',
            service: 'TaskFlow API',
            services: {
                mongodb: 'connected',
                redis: redisStatus,
                rabbitmq: rabbitmqStatus
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

app.get('/health', async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.json({
            status: 'healthy',
            service: 'TaskFlow API',
            database: 'connected'
        });
    } catch (error) {
        console.error('Root health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled exception:', err);
    res.status(500).json({
        detail: 'Internal server error',
        message: 'An unexpected error occurred'
    });
});

// Start server with all services
async function startServer() {
    try {
        // Connect to MongoDB (required)
        await connectDB();

        // Connect to Redis (optional - won't crash if unavailable)
        await connectRedis();

        // Connect to RabbitMQ (optional - won't crash if unavailable)
        await connectRabbitMQ();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`TaskFlow API running on port ${PORT}`);
            console.log('Services status:');
            console.log('  - MongoDB: connected');
            console.log(`  - Redis: ${getRedisClient() ? 'connected' : 'not available'}`);
            console.log(`  - RabbitMQ: ${getRabbitMQChannel() ? 'connected' : 'not available'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await closeRedis();
    await closeRabbitMQ();
    await mongoClient.close();
    console.log('All connections closed');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, shutting down...');
    await closeRedis();
    await closeRabbitMQ();
    await mongoClient.close();
    process.exit(0);
});

module.exports = { app, db };
