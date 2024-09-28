const Client = require("../models/client.model");
const Agent = require("../models/agent.model");
const Policy = require("../models/policy.model");
const Payment = require("../models/payment.model");
const Announcement = require('../models/announcement.model'); 

const mongodb = require("mongodb");
const moment = require("moment-timezone");
const db = require("../data/database");
const { ObjectID } = require("bson");

const sgMail = require('@sendgrid/mail')

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
async function getHomepage(req, res, next) {
  try {
    const allAnnouncements = await db.getDb().collection('announcements').find().toArray();
    res.render('homepage', {
        allAnnouncements: allAnnouncements // Pass any other data needed in the view
    });
} catch (error) {
    next(error); // Pass error to the error handling middleware
}
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
////////////////////////////////////////////////////////////////////////////////
async function getAnnex(req, res, next) {

const policyId = new ObjectID(req.body.policyId) 

  client = await Client.findById(req.body.clientId);
  policy = await Policy.findById(policyId.toHexString());

let installments = policy.installments

  res.render("agents/clients/annex", {client:client, policy:policy, installments: installments});
}
////////////////////////////////////////////////////////////////////////////////
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
////////////////////////////////////////////////////////////////////////////////
async function withdrawLawsuit(req, res, next) {
      //1. Find client by pin
  client = await Client.findByPin(req.body.pin);
    //2. Change the started lawsuit to false
  // await Client.withdrawLawsuit(client._id)
  await db.getDb().collection("clients").updateOne({ _id: client._id }, { $set: {"startedLawsuit":false, "enforcement":false} }); //to be moved in the model
  res.redirect("/all-clients");
    //3. Make it only avaliable to the admin in ejs
}
////////////////////////////////////////////////////////////////////////////////
  async function enforcementAgent(req, res, next) {
    //1. find client by pin
    client = await Client.findByPin(req.body.pin);
    await db.getDb().collection("clients").updateOne({ _id: client._id }, { $set: {"enforcement":true} });//to be moved in the model
    const clients = await Client.findAll();
    res.redirect("/enforcement-agent");
  }
  ////////////////////////////////////////////////////////////////////////////////
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

////////////////////////////////////////////////////////////////////////////////
async function findByPolicy(req, res, next) {

  const policyNumber = req.body.policyNumber
  thePolicy = await Policy.findByPolicy(policyNumber);

  client = await Client.findByPin(thePolicy.clinetPin);
  
  res.redirect(`/agents/clients/${client._id.toString()}`)  
}

////////////////////////////////////////////////////////////////////////////////
async function findByClientId(req, res, next) {

  const clientPin = req.body.clientPin
  
  const client = await Client.findByPin(req.body.clientPin);
  if (!client) {
    return res.status(404).render('error-page', { message: 'Клиентот не е најден' });
  }

  res.redirect(`/agents/clients/${client._id.toString()}`)  
}
////////////////////////////////////////////////////////////////////////////////

const VPapi = process.env.SENDGRID_API_KEY;
sgMail.setApiKey(VPapi);

const cron = require('node-cron');

// Define the list of recipient emails
const recipients = [
  // 'info@vashprijatel.mk',
  'vash.prijatel@yahoo.com',
  'vash.prijatel1@yahoo.com',
  'insubroker_zarko@yahoo.com',
  'martinboshkoskilaw@gmail.com'
];

/**
 * Schedules a daily email at 18:30 EET containing a list of unpaid policies.
 */
function scheduleUnpaidPoliciesEmail() {
  // Cron expression for 18:30 every day
  // const cronExpression = '21 22 * * *'; // Minute Hour Day Month DayOfWeek - every day
  const cronExpression = '55 07 * * 2'; // Every Tuesday at 17:05

  // Schedule the task
  cron.schedule(cronExpression, async () => {
    try {
      // Define the timezone
      const timezone = 'Europe/Skopje'; // EET timezone

      // Calculate the cutoff date (330 days ago)
      const cutoffDate = moment().tz(timezone).subtract(330, 'days').format('YYYY-MM-DD');

        // Query the database for unpaid policies
        const policies = await db.getDb().collection('policies').find({
          policyDate: { $lte: cutoffDate },
          $expr: { $lt: ['$totalPaid', '$policyAmount'] }
        }).toArray();

        if (policies.length === 0) {
          console.log('No unpaid policies found for today.');
          return;
        }

        // Initialize the total unpaid amount
        let totalUnpaid = 0;

        // Construct the email HTML content with a styled table
        let emailContent = `
          <h2 style="color: #333333;">Листа на ненаплатени полиси (кои се направени повеќе од 330 денови)</h2>
          <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="text-align: left;">#</th>
                <th style="text-align: left;">Број на полиса</th>
                <th style="text-align: left;">Клиент</th>
                <th style="text-align: left;">Премија</th>
                <th style="text-align: left;">Платена премија</th>
                <th style="text-align: left;">Ненаплатена премија</th>
                <th style="text-align: left;">Агент</th>
              </tr>
            </thead>
            <tbody>
        `;

        // Iterate over each policy to populate the table rows
        policies.forEach((policy, index) => {
          const totalToPay = policy.policyAmount - policy.totalPaid;
          totalUnpaid += totalToPay; // Accumulate the total unpaid amount

          emailContent += `
            <tr>
              <td>${index + 1}</td>
              <td>${policy.policyNumber}</td>
              <td>${policy.clientName}</td>
              <td>${policy.policyAmount},00 денари</td>
              <td>${policy.totalPaid},00 денари</td>
              <td>${totalToPay},00 денари</td>
              <td>${policy.agentSeller}</td>
            </tr>
          `;
        });

        // Add a summary row for the total unpaid amount
        emailContent += `
              <tr>
                <td colspan="6" style="text-align: right;"><strong>Вкупно ненаплатена премија:</strong></td>
                <td><strong>${totalUnpaid},00 денари</strong></td>
              </tr>
            </tbody>
          </table>
        `;

const todayDate = moment().format('DD.MM.YYYY')

      // Prepare the email message
      const msg = {
        to: 'info@vashprijatel.mk', // Primary recipient
        bcc: recipients.filter(email => email !== 'info@vashprijatel.mk'), // BCC other recipients
        from: 'online@vashprijatel.mk', // Verified sender
        subject:`Дневен извештај за ненаплатени полиси - ВАШ ПРИЈАТЕЛ АД Прилеп - датум: ${todayDate}`,
        html: emailContent,
      };

      // Send the email
      await sgMail.send(msg);
      console.log('Unpaid policies email sent successfully.');

    } catch (error) {
      console.error('Error sending unpaid policies email:', error);
      if (error.response && error.response.body && error.response.body.errors) {
        console.error('SendGrid errors:', error.response.body.errors);
      }
    }
  }, {
    scheduled: true,
    timezone: 'Europe/Skopje' // Ensure the cron job uses EET timezone
  });

  console.log('Scheduled unpaid policies email at 18:30 EET daily.');
}

scheduleUnpaidPoliciesEmail();


      // // Query the database for unpaid policies
      // const policies = await db.getDb().collection('policies').find({
      //   policyDate: { $lte: cutoffDate },
      //   $expr: { $lt: ['$totalPaid', '$policyAmount'] }
      // }).toArray();

      // if (policies.length === 0) {
      //   console.log('No unpaid policies found for today.');
      //   return;
      // }

   
      // // Construct the email HTML content with a styled table
      // let emailContent = `
      //   <h2 style="color: #333333;">Листа на ненаплатени полиси</h2>
      //   <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
      //     <thead>
      //       <tr style="background-color: #f2f2f2;">
      //         <th style="text-align: left;">Број на полиса</th>
      //         <th style="text-align: left;">Клиент</th>
      //         <th style="text-align: left;">Премија</th>
      //         <th style="text-align: left;">Платена премија</th>
      //         <th style="text-align: left;">Ненаплатена премија</th>
      //         <th style="text-align: left;">Агент</th>
      //       </tr>
      //     </thead>
      //     <tbody>
      // `;

      // policies.forEach(policy => {
      //   const totalToPay = policy.policyAmount - policy.totalPaid;
      //   emailContent += `
      //     <tr>
      //       <td>${policy.policyNumber}</td>
      //       <td>${policy.clientName}</td>
      //       <td>${policy.policyAmount},00 денари</td>
      //       <td>${policy.totalPaid},00 денари</td>
      //       <td>${totalToPay},00 денари</td>
      //       <td>${policy.agentSeller}</td>
      //     </tr>
      //   `;
      // });

      // emailContent += `
      //     </tbody>
      //   </table>
      // `;
////////////////////////////////////////////////////////////////////////////////
async function newHomeInsurance(req, res, next) {

  const newPolicy = {
  clientName: req.body.clientName,
  clientEmail: req.body.email,
  clientAddress: req.body.clientAddress,
  clientEmbg: req.body.embg,
  propertyType: req.body.propertyType,
  sheetNumber: req.body.sheetNumber,
  propertySize: req.body.propertySize
}

const policyPremium = newPolicy.propertySize * 250;

const vpStuff = ['insubroker_zarko@yahoo.com', "info@vashprijatel.mk"];

try {
  const msg = {
    to: req.body.email, // Change to your recipient
    from: 'online@vashprijatel.mk', // Change to your verified sender
    bcc: vpStuff,
    subject: `Домаќинско осигурување - барање за полиса од клиент: ${newPolicy.clientName}`,
    text: 'Про - Фактура за домаќинско осигурување',
    html: `
    <div class="policy-details">
      <table class="policy-table">
        <tbody>
          <tr><td><strong>Име на клиент:</strong></td><td>${newPolicy.clientName}</td></tr>
          <tr><td><strong>Адреса на клиент:</strong></td><td>${newPolicy.clientAddress}</td></tr>
          <tr><td><strong>ЕМБГ на клиент:</strong></td><td>${newPolicy.clientEmbg}</td></tr>
          <tr><td><strong>Тип на имот:</strong></td><td>${newPolicy.propertyType}</td></tr>
          <tr><td><strong>Број на лист:</strong></td><td>${newPolicy.sheetNumber}</td></tr>
          <tr><td><strong>Големина на имот:</strong></td><td>${newPolicy.propertySize} m²</td></tr>
        </tbody>
      </table>
      <div style="text-align: justify;">
        <p>Цената на Вашата полиса изнесува ${policyPremium},00 денари.</p>
        <p>При исплата на банкарска сметка со број: 200002894248065 при Стопанска Банка АД Скопје, назначете „премија за полиса за осигурување бр. ___".</p>
        <p>Полисата е во важност 24 часа по првиот работен ден кој следи на денот на Вашата уплата.</p>
        <p>Полисата во оригинал ќе Ви биде испратена на адреса ${newPolicy.clientAddress}, а преку пошта на адреса ${newPolicy.clientEmail}</p>
        <h3>Ви благодариме на довербата</h3>
      </div>
    </div>
  `,
  };
  
  sgMail
  .send(msg)
  .then(() => {
    console.log('Email sent');
  })
  .catch((error) => {
    console.error('Error sending email:', error);
    console.error('SendGrid response:', error.response.body.errors); // Logs detailed error messages
  });

    res.render("agents/online/home-policy",{newPolicy:newPolicy, policyPremium:policyPremium});
} catch (error) {
  console.error('Error sending email:', error);
}
}

////////////////////////////////////////////////////////////////////////////////
async function getNewHomeInsurance(req, res, next) {

  try {
  } catch (error) {
    next(error);
    return;
  }

  const clients = await Client.findAll();
  res.render("agents/online/online");
}
////////////////////////////////////////////////////////////////////////////////
module.exports = {
  getClient: getClient,
  getNewClient: getNewClient,
  getUpdateClient: getUpdateClient,
  getHomepage:getHomepage,
  getDebtClients: getDebtClients,
  updateClient: updateClient,
  deleteClient: deleteClient,
  startLawsut: startLawsut,
  getAnnex: getAnnex, 
  withdrawLawsuit: withdrawLawsuit, 
  enforcementAgent: enforcementAgent, 
  getEnforcementClients:getEnforcementClients,
  deleteSinglePayment: deleteSinglePayment,
  findByPolicy:findByPolicy, 
  findByClientId:findByClientId, 

  getNewHomeInsurance:getNewHomeInsurance,
  newHomeInsurance:newHomeInsurance
};
