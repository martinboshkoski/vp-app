const moment = require('moment');
const db = require('../data/database');
const mongodb = require('mongodb')

class Payment {
  constructor(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
    // this._id = _id; // Add this line to store the _id
    this.clientName = clientName;
    this.clientPin = clientPin;
    this.paymentAmount = paymentAmount; // Assuming paymentAmount is already a number, no need for unary plus
    this.policyNumber = policyNumber;
    this.agentName = agentName;
    this.date = moment().format('DD/MM/YYYY'); // Ensure date format is consistent with your DB queries
    this.paidCash = paidCash;
  }

  async save() {
    const paymentData = {
      clientName: this.clientName,
      clientPin: this.clientPin,
      policyNumber: this.policyNumber,
      paymentAmount: this.paymentAmount,
      agentName: this.agentName, 
      date: this.date, 
      paidCash: this.paidCash
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
    const paymentsOnDate = await db.getDb().collection("payments").find({ date: theDate, agentName: agentName, paidCash: "paidCash" }).toArray();
    if (!paymentsOnDate.length) {
      throw new Error("Нема уплати за избраната дата.");
    }
    return paymentsOnDate.map(payment => new Payment(payment.clientName, payment.clientPin, payment.paymentAmount, payment.policyNumber, payment.agentName, payment.paidCash));
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
static async deletePayment(paymentDate, policyNumber) {
  const result = await db.getDb().collection('payments').deleteOne({
    date: paymentDate, // Assuming the date is stored as a string in 'DD/MM/YYYY' format
    policyNumber: policyNumber
  });
  
  if (result.deletedCount === 0) {
      throw new Error('Payment not found or not deleted.');
  }
}
static async findPaymentsByPolicyNumbers(policyNumbers) {
  return db.getDb().collection('payments').find({
    policyNumber: { $in: policyNumbers }
  }).toArray();
}

}

module.exports = Payment;

// const mongodb = require('mongodb')
// const moment = require('moment')

// const db = require('../data/database')

// // class Payment {
// //     constructor(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
// //         this.clientName = clientName,
// //         this.clientPin = clientPin;
// //         this.paymentAmount = +paymentAmount;
// //         this.policyNumber = policyNumber;
// //         this.agentName = agentName; 
// //         this.date = moment().format('DD/MM/YYYY');
// //     }

// // //////////////////////////////////////////////////////////////////////
// // async save(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
// //   const paymentData = {
// //       clientName:clientName,
// //       clientPin: clientPin,
// //       policyNumber: policyNumber,
// //       paymentAmount: +paymentAmount,
// //       agentName: agentName, 
// //       date: moment().format('DD/MM/YYYY'), 
// //       paidCash: paidCash
// //   }
// //       await db.getDb().collection('payments').insertOne(paymentData)
// // }

// class Payment {
//   constructor(clientName, clientPin, paymentAmount, policyNumber, agentName, paidCash) {
//       this.clientName = clientName,
//       this.clientPin = clientPin;
//       this.paymentAmount = +paymentAmount;
//       this.policyNumber = policyNumber;
//       this.agentName = agentName;
//       this.date = moment().format('DD/MM/YYYY');
//       this.paidCash = paidCash; // Make sure to use this if necessary
//   }

//   async save() {
//     const paymentData = {
//         clientName: this.clientName,
//         clientPin: this.clientPin,
//         policyNumber: this.policyNumber,
//         paymentAmount: this.paymentAmount,
//         agentName: this.agentName, 
//         date: this.date, 
//         paidCash: this.paidCash
//     }
//     await db.getDb().collection('payments').insertOne(paymentData)
//   }
// }

// ////////////////////////////////////////////////////////////////////////
// static async findAll() {
//     const payments = await db.getDb().collection('payments').find().toArray()
//     return payments.map(function(paymentDocument){
//         return new Payment(paymentDocument);
//     })
// }
// ////////////////////////////////////////////////////////////////////////
// static async findPaymentByPolicyNumberAndDate(policyNumber, paymentDateOld) {
//   const payment = await db
//     .getDb()
//     .collection("payments")
//     .findOne({ policyNumber: policyNumber, date: paymentDateOld });
//   return payment;
// }

// ////////////////////////////////////////////////////////////////////////
// static async findByDateAndAgent(date, agentName) {
// const theDate = moment(date).format('DD/MM/YYYY').toString()
//   const paymentsOnDate = await db
//       .getDb()
//       .collection("payments")
//       .find({date: theDate, agentName: agentName,paidCash: "paidCash"  }).toArray();
//     if (!paymentsOnDate) {
//       const error = new Error(" Не може да се најде уплати на тој датум");
//       error.code = 404;
//       throw error;
//     }

//     return paymentsOnDate;
//   }
// ////////////////////////////////////////////////////////////////////////
//   static async findByPin(pin) {
//     const thePin = pin;
//     const theWantedClient = await db
//           .getDb()
//           .collection("clients")
//           .findOne({pin: thePin });
//         if (!theWantedClient) {
//           const error = new Error(" Не може да се најде");
//           error.code = 404;
//           throw error;
//         }
//         return theWantedClient;
//       }
//   ////////////////////////////////////////////////////////////////////////
//   static async deletePaymentsByPolicyNumber(policyNumber) {
//     try {
//       const deleteResult = await db.getDb().collection('payments').deleteMany({ policyNumber:policyNumber });
//       return deleteResult;
//     } catch (err) {
//       console.error(err);
//     }
//   }

// //////////////////////////////////////////////////////////////////////
// static async updatePayment(paymentId, paymentAmount, paymentDate, paidCash) {
//   ///da go nosi i paidinCash tuka od user, vo hidden forma
//   const updatedPaymentData = {
//     paymentAmount: +paymentAmount,
//     date: paymentDate, 
//     paidCash: paidCash
//   };

//   const result = await db
//     .getDb()
//     .collection('payments')
//     .updateOne(
//       { _id: paymentId},
//       { $set: updatedPaymentData }
//     );
//   if (result.modifiedCount === 0) {
//     throw new Error('Payment not found or not updated');
//   }
// }
// }
    
//     module.exports = Payment;
    
