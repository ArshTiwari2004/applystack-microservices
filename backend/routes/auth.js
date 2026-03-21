const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Register new user
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Get current user
router.get('/me', authenticate, authController.getMe);

// Logout
router.post('/logout', authController.logout);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
