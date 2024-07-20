const express = require('express');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/daily-report', adminController.generateDailyReport);
router.get('/admin-report', adminController.getPageReport);

// router.get('/reports', adminController.getReports);


// Add the API route for policy trends
router.get('/api/policy-trends', adminController.getPolicyTrends);

module.exports = router;
