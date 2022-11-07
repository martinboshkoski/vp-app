const Agent = require("../models/agent.model");

// const Client = require("../models/client.model");
const Policy = require("../models/policy.model");
// const Payment = require("../models/payment.model");

function generateDailyReport(req, res) {
    
    try {
        // const policies = await Policy.findAll();   
        res.render('admin/daily-report')
    } catch(error){
        next(error)
        return
    }
}

function getPageReport(req, res) {
    res.render('admin/admin-report')
}

module.exports = {
    generateDailyReport:generateDailyReport,
    getPageReport:getPageReport
}