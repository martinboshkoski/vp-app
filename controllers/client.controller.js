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
    paidAmounts.push(payment.clientName.paymentAmount)
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

//Calculates the percentage of premium vs paid

const percentagePayment = ((totalPaidAmounts / totalAmountsPremium)*100).toFixed(2)

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
      if (payment.clientName.clientPin == client.pin) {
        clientPayments.push(payment);
        clientPaymentAmounts.push(payment.clientName.paymentAmount)
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
 moment:moment
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

  console.log(req.body)
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
async function getAnnex(req, res, next) {

const policyId = new ObjectID(req.body.policyId) 

  client = await Client.findById(req.body.clientId);
  policy = await Policy.findById(policyId.toHexString());

let installments = policy.installments

  res.render("agents/clients/annex", {client:client, policy:policy, installments: installments});
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
  const clients = await Client.findAll();
  res.render("agents/debtClients/debt-clients", {clients:clients});
}

async function getEnforcementClients(req, res, next) {
  const clients =  await db.getDb().collection("clients").find().toArray();//to be moved in the model
  res.render("agents/enforcementAgent/enforcement-agent", {clients:clients});
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
  deleteSinglePayment: deleteSinglePayment
};
