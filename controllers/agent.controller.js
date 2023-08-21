const Client = require("../models/client.model");
const Agent = require("../models/agent.model");
const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");
const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");

////////////////////////////////////////////////////////////////////////////////

async function getAgent(req, res, next) {
  const agentSeller = req.body.agentSeller;
  const startDate = moment(req.body.startDate).format("YYYY-MM-DD");
  const endDate = moment(req.body.endDate).format("YYYY-MM-DD");
  let policiesOfAgent = await Policy.findByAgent(agentSeller);

  let allPoliciesInPeriod = [];
  let allPoliciesInPeriodPremium = [];

  //////////// Polisirana premija (polisi) ////////////
  if (agentSeller === "vp") {
    policiesOfAgent = await Policy.findAll();
    for (policy of policiesOfAgent) {
      const requiredPolicy = moment(policy.policyNumber.policyDate).isBetween(startDate, endDate);
      if (requiredPolicy) {
        allPoliciesInPeriod.push(policy);
        allPoliciesInPeriodPremium.push(policy.policyNumber.policyAmount)
      }
    }
  }

  let totalallPoliciesInPeriodPremium = allPoliciesInPeriodPremium.reduce(function (x, y) {
    return x + y;
  }, 0);

//////////// Polisi so naplatena premija ////////////////////////////////////////////////////
  let requiredPoliciesByPayment = [];
  let totalCommission = [];
  let totalPremium = [];
  let totalPaidPremium = [];

  if (agentSeller === "vp") {
    policiesOfAgent = await Policy.findAll();
    for (policy of policiesOfAgent) {
      let requiredPolicy = moment(policy.policyNumber.policyDate).isBetween(startDate, endDate);
      if (requiredPolicy) {
        for (payment of policy.policyNumber.thePayment) {
          if (payment.amount !== 0) {
            requiredPoliciesByPayment.push(policy.policyNumber);
            totalPremium.push(policy.policyNumber.policyAmount);
            totalPaidPremium.push(payment.amount);
            totalCommission.push(payment.agentCommision);
          }
        }
      }
    }
  }
  //sums of the elements of the arrays:
  let totalAgentCommission = totalCommission.reduce(function (x, y) {
    return x + y;
  }, 0);

  let theTotalPremium = totalPremium.reduce(function (x, y) {
    return x + y;
  }, 0);

  let thetotalPaidPremium = totalPaidPremium.reduce(function (x, y) {
    return x + y;
  }, 0);
////////////////////////////////////////////////////////////////////////////////
if (agentSeller !== "vp") {
  for (policy of policiesOfAgent) {
    theRequiredAgentPolicy = moment(policy.policyDate).isBetween(startDate, endDate);
    if (theRequiredAgentPolicy) {
      allPoliciesInPeriod.push(policy)
      allPoliciesInPeriodPremium.push(policy.policyAmount)
    }
  }
  totalallPoliciesInPeriodPremium = allPoliciesInPeriodPremium.reduce(function (x, y) {
    return x + y;
  }, 0);
}

if (agentSeller !== "vp") {
  for (policy of policiesOfAgent) {
    theRequiredAgentPolicy = moment(policy.policyDate).isBetween(startDate, endDate);
    if (theRequiredAgentPolicy) {
      for (payment of policy.thePayment) {
        // console.log(payment)
        if (payment.amount !== 0) {
          requiredPoliciesByPayment.push(policy);
          totalPremium.push(policy.policyAmount);
          totalPaidPremium.push(payment.amount);
          totalCommission.push(payment.agentCommision);
        }
      }
    }
  }
  totalAgentCommission = totalCommission.reduce(function (x, y) {
    return x + y;
  }, 0);
  theTotalPremium = totalPremium.reduce(function (x, y) {
    return x + y;
  }, 0);
  thetotalPaidPremium = totalPaidPremium.reduce(function (x, y) {
    return x + y;
  }, 0);
}

  res.render("admin/agent-report", {
    agentSeller: agentSeller,
    requiredPoliciesByPayment: requiredPoliciesByPayment,
    allPoliciesInPeriod: allPoliciesInPeriod,
    totalAgentCommission: totalAgentCommission,
    theTotalPremium: theTotalPremium,
    thetotalPaidPremium: thetotalPaidPremium,
    totalallPoliciesInPeriodPremium: totalallPoliciesInPeriodPremium,
    startDate: startDate,
    endDate: endDate,
    moment: moment,
  });
}

module.exports = {
  getAgent: getAgent,
};
