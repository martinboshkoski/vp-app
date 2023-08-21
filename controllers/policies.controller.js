const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");
const moment = require("moment");
const db = require('../data/database')

async function getPolicies(req, res, next) {
  try {
    const policies = await Policy.findAll();
    const policiesNumber = await Policy.countAll();

    //Calculates the total paid amount
    let paidAmounts = [];
    const payments = await Payment.findAll();
    for (payment of payments) {
      paidAmounts.push(payment.clientName.paymentAmount);
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

      policy.isUnpaid = (policy.policyNumber.totalPaid || 0) < policy.policyNumber.policyAmount);

      // policy.isUnpaid = (policy.policyNumber.totalPaid || 0) < policy.policyNumber.policyAmount && policyDate.isBefore(threeMonthsAgo);
      // policy.isUnpaid = policy.policyNumber.totalPaid < policy.policyNumber.policyAmount && policyDate.isBefore(threeMonthsAgo);
      // policy.isUnpaid = policy.policyNumber.totalPaid < policy.policyNumber.policyAmount;
    }
    let totalAmountsPremium = totalPremium.reduce(function (x, y) {
      return x + y;
    }, 0);

    //Calculates the percentage of premium vs paid

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

async function getByDate(req, res, next) {
const startDate = req.body.startDate
const endDate = req.body.endDate

const requiredPoliciesByDate = await Policy.findByDate(startDate, endDate)

let totalPolicyAmount = 0
requiredPoliciesByDate.forEach(policy => {
  const policyDate = moment(policy.policyDate);
  const threeMonthsAgo = moment().subtract(3, 'months');
  policy.isUnpaid = policy.totalPaid < policy.policyAmount && policyDate.isBefore(threeMonthsAgo);
  //
  totalPolicyAmount += policy.policyAmount
})

console.log(requiredPoliciesByDate)
res.render("agents/policies/policies-by-date", {
  requiredPoliciesByDate: requiredPoliciesByDate,
  startDate: startDate, 
  endDate: endDate, 
  moment: moment, 
  totalPolicyAmount:totalPolicyAmount
});
} 

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

module.exports = {
  getPolicies: getPolicies,
  insertNewPolicy: insertNewPolicy,
  getByDate:getByDate, 
  deleteSinglePolicy:deleteSinglePolicy
};
