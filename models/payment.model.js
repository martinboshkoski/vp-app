const mongodb = require('mongodb')
const moment = require('moment')

const db = require('../data/database')

class Payment {
    constructor(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
        this.clientName = clientName,
        this.clientPin = clientPin;
        this.paymentAmount = +paymentAmount;
        this.policyNumber = policyNumber;
        this.agentName = agentName; 
        this.date = moment().format('DD/MM/YYYY');
    }
////////////////////////////////////////////////////////////////////////
  static async findAll() {
    const payments = await db.getDb().collection('payments').find().toArray()
    return payments.map(function(paymentDocument){
        return new Payment(paymentDocument);
    })
}
////////////////////////////////////////////////////////////////////////
static async findPaymentByPolicyNumberAndDate(policyNumber, paymentDateOld) {
  const payment = await db
    .getDb()
    .collection("payments")
    .findOne({ policyNumber: policyNumber, date: paymentDateOld });
  return payment;
}

////////////////////////////////////////////////////////////////////////
static async findByDateAndAgent(date, agentName) {
const theDate = moment(date).format('DD/MM/YYYY').toString()
  const paymentsOnDate = await db
      .getDb()
      .collection("payments")
      .find({date: theDate, agentName: agentName,paidCash: "paidCash"  }).toArray();
    if (!paymentsOnDate) {
      const error = new Error(" Не може да се најде уплати на тој датум");
      error.code = 404;
      throw error;
    }
    console.log('im here')
    console.log(paymentsOnDate)
    return paymentsOnDate;
  }
////////////////////////////////////////////////////////////////////////
  static async findByPin(pin) {
    const thePin = pin;
    const theWantedClient = await db
          .getDb()
          .collection("clients")
          .findOne({pin: thePin });
        if (!theWantedClient) {
          const error = new Error(" Не може да се најде");
          error.code = 404;
          throw error;
        }
        return theWantedClient;
      }
  ////////////////////////////////////////////////////////////////////////
  static async deletePaymentsByPolicyNumber(policyNumber) {
    try {
      const deleteResult = await db.getDb().collection('payments').deleteMany({ policyNumber:policyNumber });
      return deleteResult;
    } catch (err) {
      console.error(err);
    }
  }
//////////////////////////////////////////////////////////////////////
    async save(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
        const paymentData = {
            clientName:clientName,
            clientPin: clientPin,
            policyNumber: policyNumber,
            paymentAmount: +paymentAmount,
            agentName: agentName, 
            date: moment().format('DD/MM/YYYY'), 
            paidCash: paidCash
        }
            await db.getDb().collection('payments').insertOne(paymentData)
    }
//////////////////////////////////////////////////////////////////////
static async updatePayment(paymentId, paymentAmount, paymentDate, paidCash) {

console.log(paymentId)
  ///da go nosi i paidinCash tuka od user, vo hidden forma
  const updatedPaymentData = {
    paymentAmount: +paymentAmount,
    date: paymentDate, 
    paidCash: paidCash
  };

  const result = await db
    .getDb()
    .collection('payments')
    .updateOne(
      { _id: paymentId},
      { $set: updatedPaymentData }
    );
  if (result.modifiedCount === 0) {
    throw new Error('Payment not found or not updated');
  }
}
}
    
    module.exports = Payment;
    
