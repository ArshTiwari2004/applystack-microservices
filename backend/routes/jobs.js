const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const jobController = require('../controllers/jobController');

// Get all job applications for current user
router.get('/', authenticate, jobController.getJobs);

// Create a new job application
router.post('/', authenticate, jobController.createJob);

// Update a job application
router.put('/:jobId', authenticate, jobController.updateJob);

// Update job logo
router.post('/update-logo/:jobId', authenticate, jobController.updateJobLogo);

// Delete a job application
router.delete('/:jobId', authenticate, jobController.deleteJob);

module.exports = router;
