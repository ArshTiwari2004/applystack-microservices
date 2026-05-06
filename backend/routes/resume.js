const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');
const { resumeUpload, handleUploadError } = require('../middleware/upload');

router.use(authenticate);

// Upload resume (PDF/DOCX) → stored in S3
router.post('/upload', resumeUpload.single('resume'), handleUploadError, resumeController.uploadResumeFile);

// List user's resumes
router.get('/', resumeController.getUserResumes);

// Analyze resume against a job description
router.post('/analyze', resumeController.analyzeResume);

// Analysis history
router.get('/analyses', resumeController.getAnalysisHistory);

// Delete a resume (from S3 + DB)
router.delete('/:resumeId', resumeController.deleteResume);

module.exports = router;