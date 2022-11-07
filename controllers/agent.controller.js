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
  const policiesOfAgent = await Policy.findByAgent(agentSeller);

  const startDate = moment(req.body.startDate).format("YYYY-MM-DD");
  const endDate = moment(req.body.endDate).format("YYYY-MM-DD");

  // za uplati po polisi od prethoden period
  let requiredPoliciesByPayment = [];
  let totalCommission = [];
  let totalPremium = [];
  let totalPaidPremium = [];

  for (policy of policiesOfAgent) {

    // const requiredPolicyBetween = moment(policy.date).isBetween(startDate, endDate);
    // if(requiredPolicyBetween) {
    //   requiredPoliciesByPayment.push(policy);
    //   totalPremium.push(policy.policyAmount);
    // }

    for (payment of policy.thePayment) {
      const requiredPolicy = moment(payment.date).isBetween(startDate, endDate); // to filter from the DB for better performance

      if (requiredPolicy) {
        requiredPoliciesByPayment.push(policy);
// if (policy.thePayment.length > 1) {
//   requiredPoliciesByPayment.push(policy);
// }
        totalPremium.push(policy.policyAmount);
        totalPaidPremium.push(policy.totalPaid);
        const singlePayment = payment.agentCommision;
        totalCommission.push(singlePayment);
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

  res.render("admin/agent-report", {
    agentSeller: agentSeller,
    requiredPoliciesByPayment: requiredPoliciesByPayment,
    totalAgentCommission: totalAgentCommission,
    theTotalPremium: theTotalPremium,
    thetotalPaidPremium: thetotalPaidPremium,
    startDate: startDate,
    endDate: endDate,
    moment: moment,
  });
}

module.exports = {
  getAgent: getAgent,
};
