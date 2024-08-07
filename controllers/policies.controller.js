const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");
const Agent = require("../models/agent.model");
const moment = require("moment");
const db = require('../data/database')

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getPolicies(req, res, next) {
  try {
    let policies = await Policy.findAll();
    const policiesNumber = await Policy.countAll();

    const loggedAgent = await Agent.getAgentWithSameUid(req.session.uid)

    if (!loggedAgent.isEditor) {
      policies = policies.filter(policy => policy.policyNumber.agentSeller == loggedAgent.name);
    }

    //Calculates the total paid amount
    let paidAmounts = [];
    const payments = await Payment.findAll();
    for (payment of payments) {
      paidAmounts.push(payment.paymentAmount);
    }
    let totalPaidAmounts = paidAmounts.reduce(function (x, y) {
      return x + y;
    }, 0);

    //Calculates the total amount of the premium
    let totalPremium = [];
    for (policy of policies) {

      totalPremium.push(policy.policyNumber.policyAmount);

      const policyDate = moment(policy.policyNumber.policyDate);
      const threeMonthsAgo = moment().subtract(3, 'months');

      const paymentPercentage = (policy.policyNumber.totalPaid || 0) / policy.policyNumber.policyAmount;
      // Determine policy status based on payment percentage
      if (paymentPercentage >= 1) {
          // Policy is fully paid
          policy.isUnpaid = false;
          policy.discount = false;
      } else if (paymentPercentage >= 0.79) {
          // Policy is paid 80% or more but less than 100%
          policy.discount = true;
          policy.isUnpaid = false;
      } else {
          // Policy is paid less than 80%
          policy.isUnpaid = true;
          policy.discount = false;
      }
    }
    let totalAmountsPremium = totalPremium.reduce(function (x, y) {
      return x + y;
    }, 0);
    
    const percentagePayment = (
      (totalPaidAmounts / totalAmountsPremium) *
      100
    ).toFixed(2);

    totalAmountsPremium = totalAmountsPremium.toLocaleString('de-DE');
    totalPaidAmounts = totalPaidAmounts.toLocaleString('de-DE');

    res.render("agents/policies/policies", {
      policies: policies,
      policiesNumber: policiesNumber,
      totalAmountsPremium: totalAmountsPremium,
      totalPaidAmounts: totalPaidAmounts,
      percentagePayment: percentagePayment,
      moment:moment
    });
  } catch (error) {
    next(error);
    return;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function insertNewPolicy(req, res, next) {
  const clientPin = req.body.pin;
  const clientName = req.body.name;
  const policyNumber = req.body.insurancePolicy;
  const policyType = req.body.insurancePolicyType;
  const registrationNumber = req.body.registrationNumber;
  const policyAmount = req.body.amount;
  const installmentsNumber = req.body.installmentsNumber;
  const policyDate = req.body.insurancePolicyDate;
  const agentSeller = req.body.agentSeller;
  const thePayment = [];
  
//Validation: Checking of the policy number already exists 
  const thePolicyNumber = policyNumber.toString()
  const policyByNumber = await db.getDb().collection('policies').findOne({policyNumber:thePolicyNumber})
  if (policyByNumber) {
    res.status(400).send(`<h1> Веќе постои полиса со број ${policyNumber}. Само врати се назад на back (односно "←" на пребарувачот) и смени го бројот на полиса</h1>`);
    return;
    }

  //
  const policy = new Policy(
    policyNumber,
    policyType,
    registrationNumber,
    policyAmount,
    installmentsNumber,
    policyDate,
    clientPin, 
    clientName,
    agentSeller,
    thePayment,
  );
  try {
    await policy.save(
      policyNumber,
      policyType,
      policyAmount,
      installmentsNumber,
      policyDate,
      clientPin, 
      clientName,
      agentSeller,
      thePayment,
    );
  } catch (error) {
    next(error);
    return;
  }

  //finding the url for the concrete client that has made the payment (to transfer to his/her page)
  const clientThroughPayment = await Payment.findByPin(clientPin.toString());
  const objectId = clientThroughPayment._id;
  const theClientPage = "/agents/clients/" + objectId;
  res.redirect(theClientPage);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getByDate(req, res, next) {
const startDate = req.body.startDate
const endDate = req.body.endDate

let requiredPoliciesByDate = await Policy.findByDate(startDate, endDate)

let totalPolicyAmount = 0
let totalUnPaidPolicyAmount = 0;

requiredPoliciesByDate.forEach(policy => {
  const policyDate = moment(policy.policyDate);
  const threeMonthsAgo = moment().subtract(3, 'months');

  const paymentPercentage = (policy.totalPaid || 0) / policy.policyAmount;
  // Determine policy status based on payment percentage
  if (paymentPercentage >= 1) {
      // Policy is fully paid
      policy.isUnpaid = false;
      policy.discount = false;
  } else if (paymentPercentage >= 0.79) {
      // Policy is paid 80% or more but less than 100%
      policy.discount = true;
      policy.isUnpaid = false;
  } else {
      // Policy is paid less than 80%
      policy.isUnpaid = true;
      policy.discount = false;
      totalUnPaidPolicyAmount += policy.policyAmount;
  }
    //
  totalPolicyAmount += policy.policyAmount
})

const loggedAgent = await Agent.getAgentWithSameUid(req.session.uid)

if (!loggedAgent.isEditor) {
  requiredPoliciesByDate = requiredPoliciesByDate.filter(policy => policy.agentSeller == loggedAgent.name);
}
totalPolicyAmount = requiredPoliciesByDate.reduce((total, policy) => total + policy.policyAmount, 0);

res.render("agents/policies/policies-by-date", {
  requiredPoliciesByDate: requiredPoliciesByDate,
  startDate: startDate, 
  endDate: endDate, 
  moment: moment, 
  totalPolicyAmount:totalPolicyAmount,
  totalUnPaidPolicyAmount:totalUnPaidPolicyAmount.toLocaleString("de-DE")
});
} 

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function deleteSinglePolicy(req, res, next) {
  const policyNumber = req.body.policyNumber;
  const deletePolicyId = req.body.policyId;
  try {
    await Policy.removePolicy(deletePolicyId);
    await Payment.deletePaymentsByPolicyNumber(policyNumber);
    res.redirect(`/agents/clients/${req.body.clientId}`);
  } catch (error) {
    next(error);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  getPolicies: getPolicies,
  insertNewPolicy: insertNewPolicy,
  getByDate:getByDate, 
  deleteSinglePolicy:deleteSinglePolicy
};
