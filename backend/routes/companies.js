const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Search companies - with Redis caching
router.post('/search', companyController.searchCompanies);

module.exports = router;
