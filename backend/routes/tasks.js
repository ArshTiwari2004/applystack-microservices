const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// Get all tasks for current user
router.get('/', authenticate, taskController.getTasks);

// Create a new task
router.post('/', authenticate, taskController.createTask);

// Update a task
router.put('/:taskId', authenticate, taskController.updateTask);

// Delete a task
router.delete('/:taskId', authenticate, taskController.deleteTask);

module.exports = router;
