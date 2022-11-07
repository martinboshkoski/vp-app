const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");

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
    }
    let totalAmountsPremium = totalPremium.reduce(function (x, y) {
      return x + y;
    }, 0);

    //Calculates the percentage of premium vs paid

    const percentagePayment = (
      (totalPaidAmounts / totalAmountsPremium) *
      100
    ).toFixed(2);

    res.render("agents/policies/policies", {
      policies: policies,
      policiesNumber: policiesNumber,
      totalAmountsPremium: totalAmountsPremium,
      totalPaidAmounts: totalPaidAmounts,
      percentagePayment: percentagePayment,
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

module.exports = {
  getPolicies: getPolicies,
  insertNewPolicy: insertNewPolicy,
};
