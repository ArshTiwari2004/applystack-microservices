const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const templateController = require('../controllers/templateController');

// Get all templates for current user
router.get('/', authenticate, templateController.getTemplates);

// Get a single template
router.get('/:templateId', authenticate, templateController.getTemplate);

// Create a new template
router.post('/', authenticate, templateController.createTemplate);

// Update a template
router.put('/:templateId', authenticate, templateController.updateTemplate);

// Delete a template
router.delete('/:templateId', authenticate, templateController.deleteTemplate);

module.exports = router;
