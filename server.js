require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { testConnection } = require('./src/config/database');
const MigrationRunner = require('./src/utils/migrationRunner');
const User = require('./src/models/User');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
app.use(cors({
    origin: frontendUrl,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Public health check (no auth required)
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'CRM Authentication API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            me: 'GET /api/auth/me',
            logout: 'POST /api/auth/logout',
            refreshToken: 'POST /api/auth/refresh-token'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('Failed to connect to database. Please check your configuration.');
            process.exit(1);
        }

        // Run database migrations
        console.log('🔄 Running database migrations...');
        const migrationRunner = new MigrationRunner();
        try {
            await migrationRunner.runMigrations();
        } catch (error) {
            console.warn('⚠️  Migration failed:', error.message);
            console.warn('💡 Database may not be available. Server will start anyway.');
            console.warn('💡 Run "npm run setup-db" when database is ready.');
            console.warn('💡 Then run "npm run migrate" to apply migrations.');
        }

        // Create tables if they don't exist (legacy support)
        await User.createTable();
        await User.createRefreshTokensTable();
        
        // Create WhatsApp/Lead tables
        const Lead = require('./src/models/Lead');
        await Lead.createTable();
        await Lead.createMessagesTable();
        await Lead.createTimelineTable();

        // Create Tasks table
        const Task = require('./src/models/Task');
        await Task.createTable();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`\n✅ Ready to accept requests\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
