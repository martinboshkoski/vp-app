const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");
const Agent = require("../models/agent.model");
const Client = require("../models/client.model");

const moment = require("moment");
const db = require('../data/database')

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function getPolicies(req, res, next) {
  try {

    const loggedAgent = await Agent.getAgentWithSameUid(req.session.uid);
    // console.log(loggedAgent)
    
    // if (!loggedAgent.isEditor) {


    // }
    // res.render("agents/policies/policies", {
    //   moment:moment,
    //   loggedAgent:loggedAgent
    // });
            // Assuming you have a method to get the current logged-in agent
            const agent = await Agent.getAgentWithSameUid(req.session.uid);

            // List of all agents
            const allAgents = [
                "", "БРАЦО ДООЕЛ", "Борче ЕУРОАГЕНТ", "БОШКОСКИ", 
                "Васе Стефаноска", "Пеце Мицакоски", "Ана Марија Димоска",
                "Дејан Петровски", "Лумјан Крензи", "Билјана Мирческа",
                "Александра Цуцулоска", "Владимир Ѓорѓимајкоски", "Анита Бошева",
                "Далиборка Башеска Јорданоска", "Ненад Митиќ", "Оливер Бузлески",
                "Слаѓана Николоска", "Маре Петреска", "Денис Трајчески",
                "Виктор Митрески", "Владимир Мандароски", "Бране Јованоски",
                "СН Брокер", "Ана Видеска", "Нури Мустафа",
                "Дино Ташкоски", "Алмир Хаjро", "Џеват Дајтоски",
                "Фатмир Демоски", "Филип Трајкоски", "Коле Јовески",
                "Мартин Димоски", "Борче Јосифоски", "Недзми Јусуфи",
                "АЛМА БЕЈЗ", "Севџан Османоски", "Изабела Цуцулоска"
            ];
    
            // Rendering the EJS template with the necessary data
    res.render("agents/policies/policies", {
      agentName: agent.name, // The name of the currently logged-in agent
                allAgents: allAgents, // All agents available
                isAdmin: agent.isAdmin, // Boolean flag to check if the user is an Admin
                isEditor: agent.isEditor // Boolean flag to check if the user is an Editor
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
async function getByDateTypeAgent(req, res, next) {
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  let insurancePolicyType = req.body.insurancePolicyType;
  let agentSeller = req.body.agentSeller;

  // Fetch policies based on date range
  let requiredPoliciesByDate = await Policy.findByDate(startDate, endDate);

  // Filter policies based on insurancePolicyType and agentSeller, if provided
  if (insurancePolicyType) {
      requiredPoliciesByDate = requiredPoliciesByDate.filter(policy => policy.policyType === insurancePolicyType);
  }

  if (agentSeller) {
      requiredPoliciesByDate = requiredPoliciesByDate.filter(policy => policy.agentSeller === agentSeller);
  }

  let totalPolicyAmount = 0;
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
          policy.isUnpaid = true;
      } else {
          // Policy is paid less than 80%
          policy.isUnpaid = true;
          policy.discount = false;
          totalUnPaidPolicyAmount += policy.policyAmount;
      }

      totalPolicyAmount += policy.policyAmount;
  });

  const loggedAgent = await Agent.getAgentWithSameUid(req.session.uid);

  if (!loggedAgent.isEditor) {
      requiredPoliciesByDate = requiredPoliciesByDate.filter(policy => policy.agentSeller === loggedAgent.name);
  }

  // Update totalPolicyAmount after filtering
  totalPolicyAmount = requiredPoliciesByDate.reduce((total, policy) => total + policy.policyAmount, 0);


  if (!insurancePolicyType) {
    insurancePolicyType = "Сите класи"
  } 

  if (!agentSeller) {
    agentSeller = "Сите агенти"
  } 

  const percentagePayment = Math.round((totalUnPaidPolicyAmount / totalPolicyAmount) * 100);

  res.render("agents/policies/policies-by-date", {
      requiredPoliciesByDate: requiredPoliciesByDate,
      startDate: startDate,
      endDate: endDate,
      moment: moment,
      totalPolicyAmount: totalPolicyAmount,
      totalUnPaidPolicyAmount: totalUnPaidPolicyAmount.toLocaleString("de-DE"), 
      insurancePolicyType:insurancePolicyType, 
      agentSeller:agentSeller, 
      percentagePayment:percentagePayment
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
async function findPolicy(req, res, next) {
  try {
    const policy = await Policy.findByPolicy(req.body.policyNumber);
    const client = await Client.findByPin(policy.clinetPin);

    const policies = await Policy.findAll();
    const payments = await Payment.findAll();

    const clientId = client._id.toString();    
////calculating total debt for the client
    let clientPolicies = [];
    let clientPoliciesPremiums = [];
    for (individualPolicy of policies) {
      if (individualPolicy.policyNumber.clinetPin == client.pin) {
        clientPolicies.push(individualPolicy);
        clientPoliciesPremiums.push(individualPolicy.policyNumber.policyAmount)
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
    }    let totalPaid = clientPaymentAmounts.reduce(function (x, y) {
      return x + y;
  }, 0);
  let debt = totalPremium - totalPaid

  const agent = await Agent.getAgentWithSameId(req.session.uid)
  const agentName = agent.name;
  
    res.render("agents/policies/single-policy", {
      policy: policy, 
      debt:debt,
      moment:moment, 
      clientId:clientId,
      client:client, 
      agentName:agentName

    });
  } catch (error) {
    next(error);
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function findPolicyOld(req, res, next) {
  try {
    const policy = await Policy.findByPolicyOld(req.body.policyNumber);

    const agent = await Agent.getAgentWithSameId(req.session.uid)
    const agentName = agent.name;


    res.render("agents/policies/single-policy-old", {
      policy: policy, 
      agentName:agentName,
      moment:moment
    });
  } catch (error) {
    next(error);
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function get2021(req, res, next) {

  try {
    res.render("agents/policies/policies-by-date", {
    });
  } catch (error) {
    next(error);
    return;
  }
}
//////
async function get2022(req, res, next) {
  try {
    const policies2022 = await db.getDb().collection('policies2022').find().toArray();
    
    let startDate = "01.01.2022";
    let endDate = "31.12.2022";
    
    let totalPolicyAmount = 0;
    let totalUnPaidPolicyAmount = 0;    
    policies2022.forEach(policy => {
        totalPolicyAmount += policy.policyAmount;
        totalUnPaidPolicyAmount += (policy.policyAmount - policy.totalPaid);
    });

    let percentagePaid = (totalUnPaidPolicyAmount / totalPolicyAmount) * 100;
    percentagePaid = Math.round(percentagePaid);
    
    res.render("agents/policies/policies-by-date-old", {
      requiredPoliciesByDate: policies2022, 
      startDate:startDate,
      endDate:endDate,
      totalPolicyAmount:totalPolicyAmount,
      totalUnPaidPolicyAmount:totalUnPaidPolicyAmount,
      percentagePaid:percentagePaid,
      moment:moment
    });
  } catch (error) {
    next(error);
    return;
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  getPolicies: getPolicies,
  insertNewPolicy: insertNewPolicy,
  getByDateTypeAgent:getByDateTypeAgent, 
  deleteSinglePolicy:deleteSinglePolicy, 
  findPolicy:findPolicy, 
  findPolicyOld:findPolicyOld, 
  get2021:get2021, 
  get2022:get2022
};
