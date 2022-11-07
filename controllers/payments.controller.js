const Payment = require("../models/payment.model");
const Policy = require("../models/policy.model");
const Client = require("../models/client.model");

const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");

async function getPayments(req, res, next) {
  try {
    const payments = await Payment.findAll();
    res.render("agents/payment/all-payments", { payments: payments });
  } catch (error) {
    next(error);
    return;
  }
}

async function getByDate(req, res, next){
  try {
    const payments = await Payment.findByDate(req.body.date);
    res.render("agents/payment/all-payments", { payments: payments });
  
  } catch (error) {
    next(error);
    return;
  }
}

async function insertPayment(req, res, next) {

  try {
    const policy = await Policy.findById(req.body.policyId);
    const policyNumber = req.body.policyNumber
let agentCommision;
if (policy.policyAmount > +req.body.payment ) {
  agentCommision = +req.body.payment * 0.15
}
if (policy.policyAmount === +req.body.payment ) {
  agentCommision = +req.body.payment * 0.2
}

const thePayment = {
  amount: +req.body.payment, 
  agentCommision: Math.round(agentCommision),
  agent: req.body.agentName,
  date: moment().format('YYYY-MM-DD')
}

await db.getDb().collection("policies").updateOne({ policyNumber: policyNumber }, {$push: {"thePayment": thePayment}});//needs to go into the model 

    //going to the same client page
    const clientPin = req.body.pin;
    const client = await Client.findByPin(clientPin)
    const clientName = client.name

    //registering payment in the paymentcs collection
    const payment = new Payment(clientName, clientPin, policy.policyNumber, thePayment.amount, thePayment.agent);
    try {
      await payment.save(clientName, clientPin, thePayment.amount, policy.policyNumber, thePayment.agent);
    } catch (error) {
      next(error);
      return;
    }

    //total paid for one policy (result)
    const allPayments = policy.thePayment
    let totalPaymentAmounts = [];
    for (singlePayment of allPayments) {
      totalPaymentAmounts.push(singlePayment.amount)
    } 
    let totalPaid = totalPaymentAmounts.reduce(function (x, y) {
      return x + y;
  }, 0);
  const finalResult = totalPaid + thePayment.amount;

  await db.getDb().collection("policies").updateOne({ policyNumber: policyNumber }, {$set: {"totalPaid": finalResult}});//needs to go into the model 

    const clientThroughPayment = await Payment.findByPin(clientPin.toString());
    const objectId = clientThroughPayment._id;
    const theClientPage = '/agents/clients/' + objectId
    res.redirect(theClientPage);  
  } catch (error) {
    next(error);
    return;
  }
}

async function generatePerDate(req, res, next) {
  try {
    let payments = await Payment.findAll();
    let todayPayments = [];
    for (todayPayment of payments) {
      if (
        moment(req.body.date).format("MM/DD/YYYY") ==
        moment(todayPayment.date).format("DD/MM/YYYY")
      ) {
        todayPayments.push(todayPayment);
      }
    }
    res.render("agents/payment/all-payments", { payments: payments });
  } catch (error) {
    next(error);
    return;
  }
}

module.exports = {
  getPayments: getPayments,
  insertPayment: insertPayment,
  generatePerDate: generatePerDate,
  getByDate:getByDate,
  // getByPin: getByPin
};
