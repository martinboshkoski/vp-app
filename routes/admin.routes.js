const express = require('express')
const adminController = require('../controllers/admin.controller')

const router = express.Router();

router.get('/daily-report', adminController.generateDailyReport)

router.get('/admin-report', adminController.getPageReport)

module.exports = router;