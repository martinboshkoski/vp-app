const Client = require("../models/client.model");
const Agent = require("../models/agent.model");
const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");

const mongodb = require("mongodb");
const moment = require("moment");
const db = require("../data/database");
const { ObjectID } = require("bson");

////////////////////////////////////////////////////////////////////////////////

async function getClient(req, res, next) {
  try {
    const clients = await Client.findAll();
    // send the total amount
    //https://stackoverflow.com/questions/23247859/better-way-to-sum-a-property-value-in-an-array
    let total = clients.reduce((n, { amount }) => n + amount, 0);
    let totalPaid = clients.reduce((n, { payment }) => n + payment, 0);
    let percantagePaid = ((totalPaid / total) * 100).toFixed(2);
  
    const agent = await Agent.getAgentWithSameId(req.session.uid)
    const agentName = agent.name;
    const userId = req.session.uid;
    // const finalUser = getUser(userId);

//////////////Calculates the total paid amount
const payments = await Payment.findAll();
let paidAmounts = []
for (payment of payments) {
    paidAmounts.push(+payment.paymentAmount)
}
let totalPaidAmounts = paidAmounts.reduce(function (x, y) {
    return x + y;
}, 0);

//Calculates the total amount of the premium
const policies = await Policy.findAll();   
let totalPremium = []
for (policy of policies) {
totalPremium.push(policy.policyNumber.policyAmount)
}
let totalAmountsPremium = totalPremium.reduce(function (x, y) {
return x + y;
}, 0);
/////
const year = 2023
const policies23 = await Policy.findPoliciesByYear(year);
    const policyNumbers = policies23.map(policy => policy.policyNumber);
    // Get all payments for those policies
    const payments23 = await Payment.findPaymentsByPolicyNumbers(policyNumbers);

    // Calculate totals
    const totalPremiums23 = policies23.reduce((sum, policy) => sum + policy.policyAmount, 0);
    const totalPayments23 = payments23.reduce((sum, payment) => sum + payment.paymentAmount, 0);
    const percentagePayment23 = ((totalPayments23 / totalPremiums23) * 100).toFixed(2);

    // Format for response
    const totals23 = {
      totalPremiums23: totalPremiums23.toLocaleString('de-DE'),
      totalPayments23: totalPayments23.toLocaleString('de-DE'),
      percentagePayment23
    };
///2024
const year24 = 2024
const policies24 = await Policy.findPoliciesByYear(year24);
    const policyNumbers24 = policies24.map(policy => policy.policyNumber);
    // Get all payments for those policies
    const payments24 = await Payment.findPaymentsByPolicyNumbers(policyNumbers24);

    // Calculate totals
    const totalPremiums24 = policies24.reduce((sum, policy) => sum + policy.policyAmount, 0);
    const totalPayments24 = payments24.reduce((sum, payment) => sum + payment.paymentAmount, 0);
    const percentagePayment24 = ((totalPayments24 / totalPremiums24) * 100).toFixed(2);

    // Format for response
    const totals24 = {
      totalPremiums24: totalPremiums24.toLocaleString('de-DE'),
      totalPayments24: totalPayments24.toLocaleString('de-DE'),
      percentagePayment24
    };

//Calculates the percentage of premium vs paid
const percentagePayment = ((totalPaidAmounts / totalAmountsPremium)*100).toFixed(2)

totalPaidAmounts = totalPaidAmounts.toLocaleString('de-DE');
totalAmountsPremium = totalAmountsPremium.toLocaleString('de-DE');

    res.render("agents/clients/all-clients", {
      clients: clients,
      total: total,
      totalPaid: totalPaid,
      percantagePaid: percantagePaid,
      // finalUser: finalUser,
      agentName: agentName, 
      totalAmountsPremium: totalAmountsPremium,
      totalPaidAmounts: totalPaidAmounts,
      percentagePayment: percentagePayment,
      totals23:totals23,
      totals24:totals24

    });
  } catch (error) {
    next(error);
    return;
  }
}
////////////////////////////////////////////////////////////////////////////////
async function getNewClient(req, res, next) {
  
  const agent = await Agent.getAgentWithSameId(req.session.uid)
  const agentName = agent.name;

  const client = new Client({
    ...req.body,
  });

  let startedLawsuit = false;

  try {
    const existingUser = await db.getDb().collection("clients").findOne({ pin: req.body.pin });
    if (existingUser) {
      // A user with the same name already exists
      // Return an error response
      res.status(400).send({ error: `Веќе постои ваков матичен број ${req.body.pin}. Вратете се назад (Back - стрекла) и побарајте го по матичен број клиентот, па таму внесете нова полиса` });
      return
    }
    await client.save(agentName, startedLawsuit);
  } catch (error) {
    next(error);
    return;
  }

  clientByPin = await Client.findByPin(req.body.pin);

  let theClientId = clientByPin._id.toHexString();

  res.redirect(`/agents/clients/${theClientId}`);
}
////////////////////////////////////////////////////////////////////////////////
async function getUpdateClient(req, res, next) {
  const agent = await Agent.getAgentWithSameId(req.session.uid)
  const agentName = agent.name;

  try {
    const client = await Client.findById(req.params.id);
    const policies = await Policy.findAll();
    const payments = await Payment.findAll();
    const clientId = req.params.id;
////
    let clientPolicies = [];
    let clientPoliciesPremiums = [];
    for (policy of policies) {
      if (policy.policyNumber.clinetPin == client.pin) {
        clientPolicies.push(policy);
        clientPoliciesPremiums.push(policy.policyNumber.policyAmount)
      }
    }
    let totalPremium = clientPoliciesPremiums.reduce(function (x, y) {
      return x + y;
  }, 0);

    let clientPayments = [];
    let clientPaymentAmounts = [];
    for (payment of payments) {
      if (payment.clientPin == client.pin) {
        clientPayments.push(+payment);
        clientPaymentAmounts.push(+payment.paymentAmount)//
      }
    }

    let totalPaid = clientPaymentAmounts.reduce(function (x, y) {
      return x + y;
  }, 0);

  let debt = totalPremium - totalPaid
  let courtFee;
  let courtFeeDecision;
  let attorneyFee;
  let totalDebt

// ////// Function to calculate penal interest for a single policy// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////
// Function to calculate penal interest for a single policy

// Define reference rates for each half-year
const referenceRates = [
  { start: '2023-01-01', end: '2023-06-30', rate: 12.75 },
  { start: '2023-07-01', end: '2023-12-31', rate: 14.00 },
  { start: '2024-01-01', end: '2024-06-30', rate: 14.30 },
  // Add more half-year periods as needed
];

// Function to calculate interest for a single period
function calculateInterestForPeriod(debt, start, end, rate) {
  const periodStart = moment(start);
  const periodEnd = moment(end);
  const daysInPeriod = periodEnd.diff(periodStart, 'days') + 1; // Including both start and end date
  const dailyRate = rate / 100 / 365;
  const interest = debt * dailyRate * daysInPeriod;
  return interest;
}

// Function to calculate total interest across all periods for a single policy
function calculateTotalInterest(debt, startDate, endDate) {
  let totalInterest = 0;
  let currentStartDate = moment(startDate);

  for (const period of referenceRates) {
    if (currentStartDate.isBefore(moment(period.end))) {
      // If the debt spans into the current period
      const currentEndDate = moment.min(endDate, moment(period.end));
      const interestForPeriod = calculateInterestForPeriod(debt, currentStartDate.format('YYYY-MM-DD'), currentEndDate.format('YYYY-MM-DD'), period.rate);
      totalInterest += interestForPeriod;

      // Move to the next period
      currentStartDate = moment(period.end).add(1, 'days');
      if (endDate.isBefore(currentStartDate)) {
        break; // If the debt is settled before the next period starts, we are done
      }
    }
  }

  return totalInterest;
}

const filteredPolicies = clientPolicies.filter(policy => {
  return (policy.policyNumber.totalPaid || 0) <= policy.policyNumber.policyAmount * 0.8;
});

// Calculate interest for each policy and accumulate the total interest
let grandTotalInterest = 0;
const interestDetailsPerPolicy = filteredPolicies.map(policy => {
  const endDate = moment(); // The current date, replace with actual date as needed
  const totalInterestAmount = calculateTotalInterest((policy.policyNumber.policyAmount - (policy.policyNumber.totalPaid || 0 )), policy.policyNumber.policyDate, endDate);
  grandTotalInterest += totalInterestAmount;
  return {
    Број: policy.policyNumber.policyNumber,
    Камата: totalInterestAmount.toFixed(2)
  };
});

totalInterestAll = grandTotalInterest.toFixed(2);

// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////// /////

if (startLawsut) {
  
  if (debt<10000) {
       totalDebt = debt + 480 + 1300 + 800
       courtFee = 480
       courtFeeDecision = 800
       attorneyFee = 1300
      } else if (debt>10000 && debt<20000) {
        totalDebt = debt + 800 + 4680 + 800
        courtFee = 800
        courtFeeDecision = 800
        attorneyFee = 4680
      }
}
    res.render("agents/clients/update-client", {
      client: client,
      clientPolicies: clientPolicies,
      clientPayments: clientPayments,
      clientId: clientId,
      totalPaid: totalPaid,
      totalPremium: totalPremium,
      debt:debt, 
      agentName:agentName, 
 courtFee:courtFee,
 courtFeeDecision:courtFeeDecision,
 attorneyFee:attorneyFee,
 totalDebt:totalDebt,
 moment:moment, 
 interestDetailsPerPolicy:interestDetailsPerPolicy, 
 totalInterestAll: totalInterestAll

    });
  } catch (error) {
    next(error);
  }
}
////////////////////////////////////////////////////////////////////////////////
async function updateClient(req, res, next) {

  const client = new Client({
    ...req.body,
    _id: req.params.id,
  });

  //to find all policies that have that client name 
  //to find all payments that have that client name

  //update all policies that have that client name
  //update all payments that have that client name

  try {
    await client.save();
  } catch (error) {
    next(error);
    return;
  }
  res.redirect("/all-clients");
}
////////////////////////////////////////////////////////////////////////////////
async function deleteClient(req, res, next) {
  let theClientId;
  try {
    theClientId = new mongodb.ObjectId(req.body.theClientId);
    await db.getDb().collection("clients").deleteOne({ _id: theClientId });
  } catch (error) {
    error.code = 404;
    return next(error);
  }

  const policyNumber = req.body.policyNumber;
  try {
    await Payment.deletePaymentsByPolicyNumber(policyNumber);
    await Policy.deletePoliciesByClient(req.body.theClientName);
  } catch (error) {
    return next(error);
  }

  res.redirect("/all-clients");
}


////////////////////////////////////////////////////////////////////////////////
async function deleteSinglePayment(req, res, next) {

  // console.log(req.body)
  res.redirect("/all-clients");
}
////////////////////////////////////////////////////////////////////////////////
async function getDebtClients(req, res, next) {
  const clients = await Client.findAll();

  // let debtClients = [];
  let dateDeadline = moment().add("90", "days").format("DD/MM/YYYY");

  for (client of clients) {
    if (client.amount > client.payment) {
    }
  }

  res.render("agents/debtClients/debt-clients", {clients:clients});
}

async function getAnnex(req, res, next) {

const policyId = new ObjectID(req.body.policyId) 

  client = await Client.findById(req.body.clientId);
  policy = await Policy.findById(policyId.toHexString());

let installments = policy.installments

  res.render("agents/clients/annex", {client:client, policy:policy, installments: installments});
}


async function startLawsut(req, res, next) {
  const agent = await Agent.getAgentWithSameId(req.session.uid)
  const agentName = agent.name;

  const clientId = req.body.clientId

  let startedLawsuit = true;
  let debt = req.body.clientDebt;
  let lawsuitDate = moment().format('DD-MM-YYYY');

  try {
    client = await Client.findById(clientId);
    clientModel = await new Client(client).save(agentName, startedLawsuit, debt, lawsuitDate);
  } catch (error) {
    next(error);
    return;
  }

  const clients = await Client.findAll();
  res.render("agents/debtClients/debt-clients", {clients:clients});
}

async function withdrawLawsuit(req, res, next) {
      //1. Find client by pin
  client = await Client.findByPin(req.body.pin);
    //2. Change the started lawsuit to false
  // await Client.withdrawLawsuit(client._id)
  await db.getDb().collection("clients").updateOne({ _id: client._id }, { $set: {"startedLawsuit":false, "enforcement":false} }); //to be moved in the model
  res.redirect("/all-clients");
    //3. Make it only avaliable to the admin in ejs
}

  async function enforcementAgent(req, res, next) {
    //1. find client by pin
    client = await Client.findByPin(req.body.pin);
    await db.getDb().collection("clients").updateOne({ _id: client._id }, { $set: {"enforcement":true} });//to be moved in the model
    const clients = await Client.findAll();
    res.redirect("/enforcement-agent");
  }
  async function getDebtClients(req, res, next) {

    const policies = await Policy.findAll();
    
    let unPaidSixMonths = []
    let unPaidThreeMonths = []
    
    for (policy of policies) {
      const policyDate = moment(policy.policyNumber.policyDate);
      const threeMonthsAgo = moment().subtract(3, 'months');
      const sixMonthsAgo = moment().subtract(6, 'months');
    
      if(policy.policyNumber.totalPaid < policy.policyNumber.policyAmount && policyDate.isBefore(threeMonthsAgo)) {
        unPaidThreeMonths.push(policy)
      };
    
      if(policy.policyNumber.totalPaid < policy.policyNumber.policyAmount && policyDate.isBefore(sixMonthsAgo)) {
        unPaidSixMonths.push(policy)
      };
    }
      const clients = await Client.findAll();
      res.render("agents/debtClients/debt-clients", {clients:clients, unPaidSixMonths:unPaidSixMonths, unPaidThreeMonths:unPaidThreeMonths, moment:moment});
    }

async function getEnforcementClients(req, res, next) {
  const clients =  await db.getDb().collection("clients").find().toArray();//to be moved in the model
  res.render("agents/enforcementAgent/enforcement-agent", {clients:clients});
}

async function findByPolicy(req, res, next) {

  const policyNumber = req.body.policyNumber
  thePolicy = await Policy.findByPolicy(policyNumber);

  client = await Client.findByPin(thePolicy.clinetPin);
  
  res.redirect(`/agents/clients/${client._id.toString()}`)  
}

module.exports = {
  getClient: getClient,
  getNewClient: getNewClient,
  getUpdateClient: getUpdateClient,
  getDebtClients: getDebtClients,
  updateClient: updateClient,
  deleteClient: deleteClient,
  startLawsut: startLawsut,
  getAnnex: getAnnex, 
  withdrawLawsuit: withdrawLawsuit, 
  enforcementAgent: enforcementAgent, 
  getEnforcementClients:getEnforcementClients,
  deleteSinglePayment: deleteSinglePayment,
  findByPolicy:findByPolicy
};
