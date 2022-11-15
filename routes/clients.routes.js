const express = require('express');
const clientController = require('../controllers/client.controller');
const policiesController = require('../controllers/policies.controller')
const paymentsController = require('../controllers/payments.controller')
const invoiceController = require('../controllers/invoice.controller');
const agentController = require('../controllers/agent.controller');

const router = express.Router();

//to do:
//the controller functions must be transfered to a new file in the controllers folder

router.post('/payments-per-date', paymentsController.generatePerDate)

router.get('/all-invoices', invoiceController.getInvoices)

router.get('/all-policies', policiesController.getPolicies)

router.get('/all-payments', paymentsController.getPayments)

router.get('/all-clients', clientController.getClient)

router.get('/for-court', function(req, res){
    res.render('agents/toCourt/to-court')
})

router.get('/at-court', function(req, res){
    res.render('agents/atCourt/at-court')
})

router.get('/enforcement-agent', clientController.getEnforcementClients)

router.post('/annex/:id', clientController.getAnnex)

router.post('/invoice/:id', invoiceController.getInvoice)

router.post('/single-invoice/client', invoiceController.findInvoice)

router.get('/invoice/:id', invoiceController.viewInvoice)

router.get('/new-client', function(req, res){
    res.render('agents/clients/new-client')
})

router.post('/new-policy', policiesController.insertNewPolicy)

router.get('/new-policy', function(req, res){
    res.render('agents/policy/new-policy')
})

router.get('/new-payment', function(req, res){
    res.render('agents/payment/new-payment')
})

router.post('/new-payment', paymentsController.insertPayment)

router.get('/agents/clients/:id', clientController.getUpdateClient)

router.post('/update-client/:id', clientController.updateClient)

//////withdraw lawsuit/enforcement agent

router.post('/withdraw-lawsuit/:id', clientController.withdrawLawsuit)

router.post('/enforcment-procedure/:id', clientController.enforcementAgent)


router.get('/clients', function(req, res){
    res.render('homepage')
})
router.post('/new-client', clientController.getNewClient)

router.post('/agents/clients/delete/:id', clientController.deleteClient)

router.post('/agents/clients/deletePayment', clientController.deleteSinglePayment)


//////////////////debt section

// router.post('/debtClient/clients/:id', debtController.getNewDebtClient)

router.get('/debt-clients', clientController.getDebtClients)

router.post('/debt-client/:id', clientController.startLawsut)

/////////
router.post('/get-by-date', paymentsController.getByDate)

//// agents

router.post('/outside-agent', agentController.getAgent)


module.exports = router;


