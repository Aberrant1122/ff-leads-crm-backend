const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const whatsappRoutes = require('./whatsappRoutes');
const pipelineRoutes = require('./pipelineRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const leadsRoutes = require('./leadsRoutes');
const userRoutes = require('./userRoutes');
const tasksRoutes = require('./tasks');

// Mount auth routes
router.use('/auth', authRoutes);

// Mount WhatsApp routes
router.use('/', whatsappRoutes);

// Mount pipeline routes
router.use('/', pipelineRoutes);

// Mount analytics routes
router.use('/', analyticsRoutes);

// Mount dashboard routes
router.use('/', dashboardRoutes);

// Mount leads routes
router.use('/', leadsRoutes);

// Mount user routes
router.use('/', userRoutes);

// Mount tasks routes
router.use('/tasks', tasksRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Test endpoint for debugging (no auth required)
router.get('/test-tasks', async (req, res) => {
    try {
        const { pool } = require('../config/database');
        
        // Check if tasks table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'tasks'");
        const tableExists = tables.length > 0;
        
        let taskCount = 0;
        let sampleTasks = [];
        
        if (tableExists) {
            const [count] = await pool.query('SELECT COUNT(*) as total FROM tasks');
            taskCount = count[0].total;
            
            const [tasks] = await pool.query('SELECT id, title, status, user_id FROM tasks LIMIT 3');
            sampleTasks = tasks;
        }
        
        res.json({
            success: true,
            data: {
                tableExists,
                taskCount,
                sampleTasks,
                endpoints: {
                    'GET /tasks': 'Get all tasks (auth required)',
                    'PATCH /tasks/:id/status': 'Update task status (auth required)',
                    'POST /tasks': 'Create task (auth required)'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
