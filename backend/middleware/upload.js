/**
 * upload.js
 * Multer middleware for handling file uploads
 * 
 * Why Multer?
 * Express doesn't parse multipart/form-data (file uploads) by default.
 * Multer adds this capability. It's the standard Node.js solution.
 * 
 * We use memory storage (not disk) because:
 * 1. We're uploading directly to S3 — no need to save to disk first
 * 2. On EC2/serverless, disk space is limited and not shared across instances
 * 3. Memory is faster than disk I/O for the file pipeline
 * 
 * Limitation: Large files (>50MB) will strain memory.
 * Production solution: Use S3 multipart upload with pre-signed URLs (client → S3 directly).
 */

const multer = require('multer');


// MEMORY STORAGE
// Files are available as req.file.buffer

const memoryStorage = multer.memoryStorage();

// FILE FILTER

const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only PDF, DOC, and DOCX files are allowed for resumes'), false);
  }
};


// UPLOAD CONFIGURATIONS
const resumeUpload = multer({
  storage: memoryStorage,
  fileFilter: resumeFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max — enough for any resume
    files: 1,
  },
});

// Generic upload (for any file type)
const genericUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
});

// ERROR HANDLER

function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ detail: 'File size exceeds the allowed limit (5MB)' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ detail: 'Only one file allowed per upload' });
    }
    return res.status(400).json({ detail: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ detail: err.message });
  }
  next();
}

module.exports = { resumeUpload, genericUpload, handleUploadError };