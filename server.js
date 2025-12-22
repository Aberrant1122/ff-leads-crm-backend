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
app.get('/api/health', async (req, res) => {
    const health = {
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        database: 'unknown',
        migrations: 'unknown'
    };

    try {
        // Test database connection
        const dbConnected = await testConnection();
        health.database = dbConnected ? 'connected' : 'disconnected';

        if (dbConnected) {
            // Check if migrations table exists and get status
            try {
                const migrationRunner = new MigrationRunner();
                const status = await migrationRunner.getMigrationStatus();
                health.migrations = {
                    total: status.total,
                    executed: status.executed,
                    pending: status.pending
                };
            } catch (error) {
                health.migrations = 'error';
            }
        }
    } catch (error) {
        health.database = 'error';
    }

    res.json(health);
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
    let migrationSuccess = false;
    
    try {
        // Test database connection with retries for Railway
        console.log('🔄 Testing database connection...');
        let dbConnected = false;
        let retries = 5;
        
        while (!dbConnected && retries > 0) {
            dbConnected = await testConnection();
            if (!dbConnected) {
                console.log(`⏳ Database not ready, retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                retries--;
            }
        }

        if (!dbConnected) {
            console.warn('⚠️  Database connection failed after retries. Starting server anyway...');
        } else {
            console.log('✅ Database connection established');
            
            // Run database migrations safely
            console.log('🔄 Running database migrations...');
            const migrationRunner = new MigrationRunner();
            try {
                await migrationRunner.runMigrations();
                migrationSuccess = true;
                console.log('✅ Database migrations completed successfully');
            } catch (error) {
                console.warn('⚠️  Migration failed:', error.message);
                console.warn('💡 Server will continue starting. Migrations can be run later.');
            }

            // Create legacy tables if migrations didn't run
            if (!migrationSuccess) {
                console.log('🔄 Creating legacy tables...');
                try {
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
                    
                    console.log('✅ Legacy tables created');
                } catch (tableError) {
                    console.warn('⚠️  Some tables may not be available:', tableError.message);
                }
            }
        }

        // Start server regardless of migration status
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT}`);
            console.log(`📍 API URL: http://localhost:${PORT}`);
            console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log(`📊 Database: ${dbConnected ? '✅ Connected' : '❌ Not Connected'}`);
            console.log(`📊 Migrations: ${migrationSuccess ? '✅ Completed' : '⚠️  Pending'}`);
            console.log(`\n✅ Ready to accept requests\n`);
        });
        
    } catch (error) {
        console.error('❌ Server startup error:', error.message);
        // Don't exit - try to start server anyway for Railway
        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on port ${PORT} (with errors)`);
            console.log(`⚠️  Some features may not work properly`);
            console.log(`💡 Check database configuration and run migrations manually\n`);
        });
    }
};

startServer();
