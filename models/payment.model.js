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
    
    // remove() {
    //     const policyId = new mongodb.ObjectId(this.id);
    //     return db.getDb().collection('policies').deleteOne({ _id: policyId });
    //   }
}
module.exports = Payment;
   
