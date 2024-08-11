const Payment = require("../models/payment.model");
const Policy = require("../models/policy.model");
const Client = require("../models/client.model");
const Agent = require("../models/agent.model");

const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");

////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////
async function getByDate(req, res, next) {
  try {
    const agent = await Agent.getAgentWithSameId(req.session.uid);
    const inputAgent = req.body.agentName;
    const agentName = inputAgent || agent.name;

    const payments = await Payment.findByDateAndAgent(req.body.date, agentName);

/// Sum of all payments
let allPayments = []
for (payment of payments) {
  allPayments.push(+payment.paymentAmount)
}
let unformatedSum = (allPayments.reduce((accumulator, currentValue) => accumulator + currentValue, 0))

let sum = unformatedSum.toLocaleString('de-DE');

////
const pickedDate = moment(req.body.date).format('DD/MM/YYYY')

res.render("agents/payment/by-date", {
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function insertPayment(req, res, next) {

  try {
    const policy = await Policy.findById(req.body.policyId);
    const policyNumber = req.body.policyNumber;

    let agentCommision;
    if (policy.policyAmount > +req.body.payment) {
      agentCommision = +req.body.payment * 0.15;
    }
    if (policy.policyAmount === +req.body.payment) {
      agentCommision = +req.body.payment * 0.20;
    }

    // Determine paidCash and additional element based on paymentMethod
    let paidCash;
    let paymentMethodDetail;
    
    switch (req.body.paymentMethod) {
      case 'paidCash1':
        paidCash = 'paidCash';
        paymentMethodDetail = 'Благајна - готовина';
        break;
      case 'paidCash2':
        paidCash = 'paidCash';
        paymentMethodDetail = 'Благајна - картичка';
        break;
      case 'bankTransfer':
        paidCash = null; // Not considered as paidCash
        paymentMethodDetail = 'Банкарска уплата (извод)';
        break;
      default:
        throw new Error('Invalid payment method selected');
    }

    const thePayment = {
      amount: +req.body.payment,
      agentCommision: Math.round(agentCommision),
      agent: req.body.agentName,
      date: moment().format("YYYY-MM-DD"),
      paidCash: paidCash,
      paymentMethodDetail: paymentMethodDetail  // Storing the payment method detail in the document
    };

    await db.getDb().collection("policies").updateOne(
      { policyNumber: policyNumber },
      { $push: { thePayment: thePayment } }
    ); 

    const clientPin = req.body.pin;
    const client = await Client.findByPin(clientPin);
    const clientName = client.name;

    const payment = new Payment(
      clientName,
      clientPin,
      thePayment.amount,
      policy.policyNumber,
      thePayment.agent,
      thePayment.paidCash, 
      paymentMethodDetail
    );
    try {
      await payment.save(
        clientName,
        clientPin,
        thePayment.amount,
        policy.policyNumber,
        thePayment.agent,
        thePayment.paidCash, 
        paymentMethodDetail
      );
    } catch (error) {
      next(error);
      return;
    }

    const allPayments = policy.thePayment;
    let totalPaymentAmounts = [];
    for (let singlePayment of allPayments) {
      totalPaymentAmounts.push(singlePayment.amount);
    }
    let totalPaid = totalPaymentAmounts.reduce((x, y) => x + y, 0);
    const finalResult = totalPaid + thePayment.amount;

    await db.getDb().collection("policies").updateOne(
      { policyNumber: policyNumber },
      { $set: { totalPaid: finalResult } }
    );

    const clientThroughPayment = await Payment.findByPin(clientPin.toString());
    const objectId = clientThroughPayment._id;
    const theClientPage = "/agents/clients/" + objectId;
    res.redirect(theClientPage);
  } catch (error) {
    next(error);
    return;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function insertPaymentOld(req, res, next) {
  try {
    const policy = await Policy.findById(req.body.policyId);
    const policyNumber = req.body.policyNumber;
    const agentName = req.body.paymentPlace;

    let agentCommision;
    if (policy.policyAmount > +req.body.payment) {
      agentCommision = +req.body.payment * 0.15;
    } else if (policy.policyAmount === +req.body.payment) {
      agentCommision = +req.body.payment * 0.20;
    }

    // Determine paidCash and additional element based on paymentMethod
    let paidCash;
    let paymentMethodDetail;

    switch (req.body.paymentMethod) {
      case 'paidCash1':
        paidCash = 'paidCash';
        paymentMethodDetail = 'Благајна - готовина';
        break;
      case 'paidCash2':
        paidCash = 'paidCash';
        paymentMethodDetail = 'Благајна - картичка';
        break;
      case 'bankTransfer':
        paidCash = null; // Not considered as paidCash
        paymentMethodDetail = 'Банкарска уплата (извод)';
        break;
      default:
        throw new Error('Invalid payment method selected');
    }

    const thePayment = {
      amount: +req.body.payment,
      agentCommision: Math.round(agentCommision),
      agentName: agentName,
      date: moment().format("YYYY-MM-DD"),  // Ensuring the correct date format
      paidCash: paidCash,
      paymentMethodDetail: paymentMethodDetail  // Storing the payment method detail in the document
    };

    // Update the policy with the new payment
    await db.getDb().collection("policies2022").updateOne(
      { policyNumber: policyNumber },
      { $push: { thePayment: thePayment } }
    );

    const newTotalPaid = (policy.totalPaid || 0) + thePayment.amount;

    // Update the `totalPaid` field in the policy
    await db.getDb().collection("policies2022").updateOne(
      { policyNumber: policyNumber },
      { $set: { totalPaid: newTotalPaid } }
    );

    // Creating a payment entry in the payments collection
    const payment = new Payment(
      req.body.clientName,
      policy.clinetPin || '',  // Use an empty string if clientPin is missing
      thePayment.amount,
      policy.policyNumber,
      agentName,
      thePayment.paidCash,
      paymentMethodDetail
    );

    await payment.save();

    // Recalculate totalPaid and update the policy
    const allPayments = policy.thePayment.concat(thePayment);  // Combine old and new payments
    const totalPaid = allPayments.reduce((total, payment) => total + payment.amount, 0);

    await db.getDb().collection("policies").updateOne(
      { policyNumber: policyNumber },
      { $set: { totalPaid: totalPaid } }
    );

    // Redirect to the correct client page if `clientPin` exists, otherwise to the home page
    const theClientPage = policy.clinetPin ? `/agents/clients/${req.body.policyId}` : '/';
    res.redirect(theClientPage);
  } catch (error) {
    next(error);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function insertLawsuitPayment(req, res, next) {
  try {
    const thePayment = {
      suedClientName: req.body.suedClientName,
      principal: +req.body.principal,
      interest: +req.body.interest,
      costs: +req.body.costs,
      date: moment().format("DD-MM-YYYY"),
      paidCash: "paidCash"
    };

    const agent = await Agent.getAgentWithSameId(req.session.uid);
    let clientPin = "/"; // Ensure this variable is correctly assigned a value
    let policyNumber = "/"; // Ensure this variable is correctly assigned a value

    // Create and save principal payment
    const principalPayment = new Payment(
      thePayment.suedClientName,
      clientPin,
      thePayment.principal, // This assumes you corrected the order of arguments in the constructor
      "Главен долг (по тужба)",
      agent.name,
      thePayment.paidCash
    );
    await principalPayment.save();

    // Create and save interest payment
    const interestPayment = new Payment(
      thePayment.suedClientName,
      clientPin,
      thePayment.interest,
      "Законска казнена камата (по тужба)",
      agent.name,
      thePayment.paidCash
    );
    await interestPayment.save();

    // Create and save costs payment
    const costsPayment = new Payment(
      thePayment.suedClientName,
      clientPin,
      thePayment.costs,
      "Судски трошоци (по тужба)",
      agent.name,
      thePayment.paidCash
    );
    await costsPayment.save();

    res.redirect("/all-payments");
  } catch (error) {
    next(error);
    return;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function editPayment(req, res, next) {
  const policyId = req.body.policyId;
  const paymentDateOld = req.body.paymentDateOld;
  const paymentAmountOld = req.body.paymentAmountOld;
  const paidCash = req.body.paidCash;

  const paymentAmount = req.body.paymentAmount;
  const paymentDate = moment(req.body.paymentDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
  const policyNumber = req.body.policyNumber;

  try {
      const payment = await Payment.findPaymentByPolicyNumberAndDate(policyNumber, paymentDateOld);
      if (!payment) {
          throw new Error('Payment not found');
      }
      const policy = await Policy.findById(policyId);
      if (!policy) {
          throw new Error('Policy not found');
      }
//updating
    // #1 total paid for one policy (result)
    const allPayments = policy.thePayment;
    let totalPaymentAmounts = [];
    for (singlePayment of allPayments) {
      totalPaymentAmounts.push(+singlePayment.amount);
    }
    let totalPaid = totalPaymentAmounts.reduce(function (x, y) {
      return x + y;
    }, 0);

    const finalResult = +totalPaid + (+paymentAmount - +payment.policyNumber);
    await db
      .getDb()
      .collection("policies")
      .updateOne(
        { policyNumber: policyNumber },
        { $set: { totalPaid: finalResult } }
      ); //this needs to go into the model

    // #2 updating the payments collection
      await Payment.updatePayment(paymentDateOld, paymentAmount, paymentDate, paidCash, policyNumber); //finished
    // #3 updating the policy and the policies collection
      await Policy.updatePolicyPayment(policyId, paymentDateOld, paymentAmountOld, paymentAmount, paymentDate, paidCash);

      //////
      // Redirect to the client page
      const clientPin = req.body.pin;
      const clientThroughPayment = await Payment.findByPin(clientPin.toString());
      if (!clientThroughPayment) {
          throw new Error('Client not found through payment');
      }

      const objectId = clientThroughPayment._id;
      const theClientPage = "/agents/clients/" + objectId;
      res.redirect(theClientPage);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while editing the payment' });
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function deletePayment(req, res, next) {
  const { policyId, paymentDate, paymentAmount } = req.body;

  const policy = await Policy.findById(req.body.policyId);
  const policyNumber = policy.policyNumber;

  try {
    const allPayments = policy.thePayment;
    let totalPaymentAmounts = [];
    for (singlePayment of allPayments) {
      totalPaymentAmounts.push(+singlePayment.amount);
    }
    let totalPaid = totalPaymentAmounts.reduce(function (x, y) {
      return x + y;
    }, 0);

    const finalResult = +totalPaid - +paymentAmount;
    await db
      .getDb()
      .collection("policies")
      .updateOne(
        { policyNumber: policyNumber },
        { $set: { totalPaid: finalResult } }
      ); //this needs to go into the model


      await Payment.deletePayment(paymentDate, policyNumber);
      await Policy.deletePolicyPayment(policyId, paymentDate);

      // Redirect to the client page
      const clientPin = req.body.pin;
      const clientThroughPayment = await Payment.findByPin(clientPin.toString());
      if (!clientThroughPayment) {
          throw new Error('Client not found through payment');
      }

      const objectId = clientThroughPayment._id;
      const theClientPage = "/agents/clients/" + objectId;
      res.redirect(theClientPage);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while deleting the payment' });
  }
}

module.exports = {
  getPayments: getPayments,
  insertPayment: insertPayment,
  insertPaymentOld:insertPaymentOld,
  insertLawsuitPayment: insertLawsuitPayment,
  generatePerDate: generatePerDate,
  getByDate: getByDate,
  editPayment:editPayment, 
  deletePayment:deletePayment
};

