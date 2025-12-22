#!/usr/bin/env node

/**
 * Database Setup Script
 * Creates the database if it doesn't exist and tests the connection
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupDatabase() {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306
    };

    const dbName = process.env.DB_NAME || 'fortune-crm';

    console.log('🔄 Setting up database...');
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`👤 User: ${config.user}`);
    console.log(`🗄️  Database: ${dbName}`);

    try {
        // Connect without specifying database
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to MySQL server');

        // Create database if it doesn't exist
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`✅ Database '${dbName}' ready`);

        // Close connection and reconnect to the specific database
        await connection.end();
        
        // Test connection to the specific database
        const dbConnection = await mysql.createConnection({
            ...config,
            database: dbName
        });
        
        console.log('✅ Database connection successful');
        await dbConnection.end();
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('You can now run: npm run migrate');
        
    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('\n🔧 Troubleshooting:');
        console.error('1. Make sure MySQL is running');
        console.error('2. Check your .env file database credentials');
        console.error('3. Ensure the MySQL user has CREATE DATABASE privileges');
        console.error('4. Verify the port number (default: 3306)');
        process.exit(1);
    }
}

setupDatabase();