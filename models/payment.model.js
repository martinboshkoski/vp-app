const moment = require('moment');
const db = require('../data/database');
const mongodb = require('mongodb')

class Payment {
  constructor(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash, paymentMethodDetail) {
    this.clientName = clientName;
    this.clientPin = clientPin;
    this.paymentAmount = paymentAmount;
    this.policyNumber = policyNumber;
    this.agentName = agentName;
    this.date = moment().format('DD/MM/YYYY');
    this.paidCash = paidCash;
    this.paymentMethodDetail = paymentMethodDetail; // Add this line to include payment method detail
  }

  async save() {
    const paymentData = {
      clientName: this.clientName,
      clientPin: this.clientPin,
      policyNumber: this.policyNumber,
      paymentAmount: this.paymentAmount,
      agentName: this.agentName,
      date: this.date,
      paidCash: this.paidCash,
      paymentMethodDetail: this.paymentMethodDetail // Ensure this is saved in the database
    };
    await db.getDb().collection('payments').insertOne(paymentData);
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Assuming the static methods below are part of the same class

  static async findAll() {
    const payments = await db.getDb().collection('payments').find().toArray();
    return payments.map(paymentDocument => new Payment(paymentDocument.clientName, paymentDocument.clientPin, paymentDocument.paymentAmount, paymentDocument.policyNumber, paymentDocument.agentName, paymentDocument.paidCash));
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
static async findPaymentByPolicyNumberAndDate(policyNumber, paymentDateOld) {
  // const paymentDateFormatted = moment(paymentDateOld, 'DD/MM/YYYY').format('YYYY-MM-DD');
  const payment = await db.getDb().collection("payments").findOne({ policyNumber: policyNumber, date: paymentDateOld });
  if (!payment) {
      throw new Error("Payment not found");
  }
  return new Payment(payment._id, payment.clientName, payment.clientPin, payment.paymentAmount, payment.policyNumber, payment.agentName, payment.paidCash, payment.date);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  static async findByDateAndAgent(date, agentName) {
    const theDate = moment(date).format('DD/MM/YYYY').toString();
    const paymentsOnDate = await db.getDb().collection("payments").find({
      date: theDate,
      agentName: agentName,
      paidCash: "paidCash"
    }).toArray();
  
    if (!paymentsOnDate.length) {
      throw new Error("Нема уплати за избраната дата.");
    }
  
    return paymentsOnDate.map(payment => new Payment(
      payment.clientName,
      payment.clientPin,
      payment.paymentAmount,
      payment.policyNumber,
      payment.agentName,
      payment.paidCash,
      payment.paymentMethodDetail // Include this field in the constructor
    ));
  }
  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  static async findById(paymentId) {
    try {
        const payment = await db.getDb().collection("payments").findOne({ _id: new ObjectId(paymentId) });
        if (!payment) {
            throw new Error("Payment not found.");
        }
        return new Payment(payment.clientName, payment.clientPin, payment.paymentAmount, payment.policyNumber, payment.agentName, payment.paidCash);
    } catch (error) {
        throw new Error("Payment not found.");
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
static async findByPin(pin) {
  const theWantedClient = await db.getDb().collection("clients").findOne({ pin: pin });
  if (!theWantedClient) {
    throw new Error("Client not found.");
  }
  return theWantedClient; // Assuming you want to return the client document directly
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  static async deletePaymentsByPolicyNumber(policyNumber) {
    const deleteResult = await db.getDb().collection('payments').deleteMany({ policyNumber: policyNumber });
    if (!deleteResult.deletedCount) {
      throw new Error('No payments found for deletion.');
    }
    return deleteResult;
  }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
static async updatePayment(paymentDateOld, paymentAmount, paymentDate, paidCash, policyNumber) {
  // Ensure that the date is in 'DD/MM/YYYY' format for MongoDB operations
  const paymentDateFormatted = moment(paymentDate, 'DD/MM/YYYY').isValid() 
    ? moment(paymentDate, 'DD/MM/YYYY').format('DD/MM/YYYY') 
    : paymentDate;

  const theDate = moment(paymentDateFormatted).format('DD/MM/YYYY')
  
  const result = await db.getDb().collection('payments').updateOne(
      { date: paymentDateOld, policyNumber: policyNumber },
      { $set: { paymentAmount: parseFloat(paymentAmount), date: theDate, paidCash: paidCash } }
  );

  if (result.modifiedCount === 0) {
      throw new Error('Payment not found or not updated.');
  }

  return result;
}
/////////
static async deletePayment({ policyNumber, amount, date, paymentMethodDetail }) {
  // Match payment by policyNumber, amount, date, and paymentMethodDetail
  const result = await db.getDb().collection('payments').deleteOne({
    policyNumber,
    paymentAmount: amount,
    date,
    paymentMethodDetail
  });
  if (result.deletedCount === 0) {
    throw new Error('Payment not found or not deleted.');
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
static async findPaymentsByPolicyNumbers(policyNumbers) {
  return db.getDb().collection('payments').find({
    policyNumber: { $in: policyNumbers }
  }).toArray();
}
static async closeWithDiscount({ policyNumber, policyId, policyAmount, totalPaid, clientName, clientPin, agentName }) {
  const moment = require('moment');
  const db = require('../data/database');

  const unpaid = policyAmount - totalPaid;
  const maxDiscount = 0.2 * policyAmount;
  if (unpaid <= 0 || unpaid > maxDiscount) {
    throw new Error("Discount not allowed.");
  }

  // 1. Add to policies
  const discountPaymentObj = {
    amount: unpaid,
    agentCommision: 0,
    agent: agentName,
    date: moment().format("YYYY-MM-DD"),
    paidCash: false,
    paymentMethodDetail: "discount"
  };
  await db.getDb().collection("policies").updateOne(
    { policyNumber },
    {
      $push: { thePayment: discountPaymentObj },
      $set: { totalPaid: Number(policyAmount) }
    }
  );

  // 2. Add to payments
  await db.getDb().collection("payments").insertOne({
    clientName,
    clientPin,
    policyNumber,
    paymentAmount: unpaid,
    agentName,
    date: moment().format('DD/MM/YYYY'),
    paymentMethodDetail: "discount"
  });

  // 3. Add to discounts
  await db.getDb().collection("discounts").insertOne({
    policyNumber,
    discountAmount: unpaid,
    agent: agentName,
    date: moment().format("YYYY-MM-DD")
  });
}
}

module.exports = Payment;
