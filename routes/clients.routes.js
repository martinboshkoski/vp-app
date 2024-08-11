const express = require('express');
const clientController = require('../controllers/client.controller');
const policiesController = require('../controllers/policies.controller')
const paymentsController = require('../controllers/payments.controller')
const invoiceController = require('../controllers/invoice.controller');
const agentController = require('../controllers/agent.controller');
const announcementController = require('../controllers/announcmentController');

const router = express.Router();

//to do:
//the controller functions must be transfered to a new file in the controllers folder

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Payments
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Single payment managment
router.get('/new-payment', function(req, res){
    res.render('agents/payment/new-payment')
})
router.post('/edit-payment', paymentsController.editPayment)
router.post('/delete-payment', paymentsController.deletePayment);
router.post('/new-payment', paymentsController.insertPayment)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Group of payments
router.get('/all-payments', paymentsController.getPayments)
router.post('/lawsuit-payment', paymentsController.insertLawsuitPayment)
router.post('/payments-per-date', paymentsController.generatePerDate)
router.post('/get-by-date', paymentsController.getByDate)

//to be finished/idea or other
// router.post('/dailyPaymentsReport', paymentsController.generatePaymentsReport)
// router.post('/debtClient/clients/:id', debtController.getNewDebtClient)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Policies
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Single policy managment 
router.post('/new-policy', policiesController.insertNewPolicy)
router.get('/new-policy', function(req, res){
    res.render('agents/policy/new-policy')
})
router.post('/agents/clients/deletePolicy', policiesController.deleteSinglePolicy)

//quick mode - single policy
router.post('/find-policy', policiesController.findPolicy)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Group of policies 
router.get('/all-policies', policiesController.getPolicies)
router.get('/for-court', function(req, res){
    res.render('agents/toCourt/to-court')
})
router.get('/at-court', function(req, res){
    res.render('agents/atCourt/at-court')
})
router.post('/policy-by-date', policiesController.getByDateTypeAgent)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Clients
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/agents/clients/:id', clientController.getUpdateClient)
router.get('/agents/clients/')
router.get('/all-clients', clientController.getClient)

router.post('/update-client/:id', clientController.updateClient)
router.post('/find-by-policy', clientController.findByPolicy)

router.post('/find-client-by-pin', clientController.findByClientId)


router.get('/enforcement-agent', clientController.getEnforcementClients)
router.post('/annex/:id', clientController.getAnnex)
router.get('/new-client', function(req, res){
    res.render('agents/clients/new-client')
})
//////Daily report (generate)

//////withdraw lawsuit/enforcement agent
router.post('/withdraw-lawsuit/:id', clientController.withdrawLawsuit)
router.post('/enforcment-procedure/:id', clientController.enforcementAgent)
router.get('/clients', clientController.getHomepage)
    
router.post('/new-client', clientController.getNewClient)
router.post('/agents/clients/delete/:id', clientController.deleteClient)
router.post('/agents/clients/deletePayment', clientController.deleteSinglePayment)

//////////////////debt section
router.get('/debt-clients', clientController.getDebtClients)
router.post('/debt-client/:id', clientController.startLawsut)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Agents
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/outside-agent', agentController.getAgent)

module.exports = router;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Announcements
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/new-announcement', announcementController.newAnnouncement);

router.post('/delete-announcement', announcementController.deleteAnnouncement);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Invoices
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// router.get('/all-invoices', invoiceController.getInvoices)
// router.post('/invoice/:id', invoiceController.getInvoice)
// router.post('/single-invoice/client', invoiceController.findInvoice)
// router.get('/invoice/:id', invoiceController.viewInvoice)