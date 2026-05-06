const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// All AI routes require authentication
router.use(authenticate);

// JD Parser — extracts structured info from pasted job description
router.post('/parse-jd', aiController.parseJD);

// Cover letter / cold message / referral DM generator
router.post('/cover-letter', aiController.generateMessage);

// Application health analysis — reads user's entire DB history
router.get('/health-analysis', aiController.getHealthAnalysis);
router.get('/health-analysis/cached', aiController.getCachedAnalysis);

// Auto-generate prep tasks for a job application
router.post('/generate-tasks', aiController.generateJobTasks);

// AI usage stats
router.get('/usage', aiController.getAIUsage);

// Saved AI-generated content
router.get('/saved', aiController.getSavedContent);

module.exports = router;