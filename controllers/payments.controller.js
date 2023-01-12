const Payment = require("../models/payment.model");
const Policy = require("../models/policy.model");
const Client = require("../models/client.model");
const Agent = require("../models/agent.model");

const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");

async function getPayments(req, res, next) {
  try {
    const agent = await Agent.getAgentWithSameId(req.session.uid);
    const agentName = agent.name;
    const payments = await Payment.findAll();
    let sum = 0;
    let pickedDate = '___/___/______'
    res.render("agents/payment/all-payments", { payments: payments, agentName:agentName, sum:sum, pickedDate:pickedDate });
  } catch (error) {
    next(error);
    return;
  }
}

async function getByDate(req, res, next) {
  try {
    const agent = await Agent.getAgentWithSameId(req.session.uid);
    const agentName = agent.name;

//da se generiraat samo tie uplati sto se povrzani/primeni od konkretniot

    const payments = await Payment.findByDateAndAgent(req.body.date, agentName);

/// Sum of all payments
let allPayments = []
for (payment of payments) {
  allPayments.push(payment.paymentAmount)
}
/////
let sum = allPayments.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
////
const pickedDate = moment(req.body.date).format('DD/MM/YYYY')

res.render("agents/payment/all-payments", {
      payments: payments,
      agentName:agentName, 
      sum:sum, 
      pickedDate:pickedDate
    });
  } catch (error) {
    next(error);
    return;
  }
}

async function insertPayment(req, res, next) {
  try {
    const policy = await Policy.findById(req.body.policyId);
    const policyNumber = req.body.policyNumber;

//Different percentage for different agents:
// console.log(req.body.agentSeller)
// let percentage;
// if (req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// req.body.agentSeller == "Канцеларија Кузман Јосифоски" || 
// ) else {
//   percentage = 0.15;
// }

    let agentCommision;
    if (policy.policyAmount > +req.body.payment) {
      agentCommision = +req.body.payment * 0.15;
    }
    if (policy.policyAmount === +req.body.payment) {
      agentCommision = +req.body.payment * 0.20;
    }

    const thePayment = {
      amount: +req.body.payment,
      agentCommision: Math.round(agentCommision),
      agent: req.body.agentName,
      date: moment().format("YYYY-MM-DD"),
      paidCash: req.body.paidCash
    };

    await db
      .getDb()
      .collection("policies")
      .updateOne(
        { policyNumber: policyNumber },
        { $push: { thePayment: thePayment } }
      ); //needs to go into the model

    //going to the same client page
    const clientPin = req.body.pin;
    const client = await Client.findByPin(clientPin);
    const clientName = client.name;

    //registering payment in the paymentcs collection
    const payment = new Payment(
      clientName,
      clientPin,
      policy.policyNumber,
      thePayment.amount,
      thePayment.agent, 
      thePayment.paidCash
    );
    try {
      await payment.save(
        clientName,
        clientPin,
        thePayment.amount,
        policy.policyNumber,
        thePayment.agent,
        thePayment.paidCash
      );
    } catch (error) {
      next(error);
      return;
    }

    //total paid for one policy (result)
    const allPayments = policy.thePayment;
    let totalPaymentAmounts = [];
    for (singlePayment of allPayments) {
      totalPaymentAmounts.push(singlePayment.amount);
    }
    let totalPaid = totalPaymentAmounts.reduce(function (x, y) {
      return x + y;
    }, 0);
    const finalResult = totalPaid + thePayment.amount;

    await db
      .getDb()
      .collection("policies")
      .updateOne(
        { policyNumber: policyNumber },
        { $set: { totalPaid: finalResult } }
      ); //needs to go into the model

    const clientThroughPayment = await Payment.findByPin(clientPin.toString());
    const objectId = clientThroughPayment._id;
    const theClientPage = "/agents/clients/" + objectId;
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
  getByDate: getByDate,
  // generatePaymentsReport: generatePaymentsReport
  // getByPin: getByPin
};

// async function generatePaymentsReport(req, res, next) {
//     const theDate = req.body.date;
//     try {
//       let payments = await Payment.findAll();
//       let todayPayments = [];

//       // for (todayPayment of payments) {
//       //   if (
//       //     moment(req.body.date).format("DD/MM/YYYY") == moment(todayPayment.date).format("DD/MM/YYYY")
//       //   ) {
//       //     todayPayments.push(todayPayment);
//       //   }
//       // }

//     res.render("agents/payment/by-date", { theDate: theDate });
//   } catch (error) {
//     next(error);
//     return;
//   }
// }
