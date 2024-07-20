const Agent = require("../models/agent.model");
const Policy = require("../models/policy.model");

async function generateDailyReport(req, res, next) {
    try {
        const policyTypes = await Policy.getPolicyTypes();
        res.render('admin/daily-report', { policyTypes });

    } catch (error) {
        next(error);
    }
}

function getPageReport(req, res) {
    res.render('admin/admin-report');
}

// Add the new method to get policy trends
async function getPolicyTrends(req, res) {
    const policyType = req.query.policyType;
    // console.log(policyType); // Debug: log the policy type
    try {
        const data = await Policy.getMonthlyTrendsByPolicyType(policyType);
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch policy trends' });
    }
}


module.exports = {
    generateDailyReport,
    getPageReport,
    // getReports,
    getPolicyTrends // Export the new method
};
