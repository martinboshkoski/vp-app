const mongodb = require('mongodb')

const moment = require('moment')

const db = require('../data/database')

class Policy {
    constructor(policyNumber, policyType, registrationNumber, policyAmount, installmentsNumber, policyDate, clinetPin, clientName, agentSeller, thePayment ) {
        this.policyNumber = policyNumber;
        this.policyType = policyType;
        this.registrationNumber = registrationNumber;
        this.policyAmount = +policyAmount;
        this.installmentsNumber = +installmentsNumber;
        this.policyDate = policyDate;
        this.clinetPin = clinetPin, 
        this.clientName = clientName,
        this.thePayment = this.thePayment, 
        this.agentSeller = agentSeller,
        this.thePayment = {
                amount: +0,
                agentCommision: Math.round(0),
                agent: 'Агент',
                date: 'Определи датум'
              };
        }

static async findById(policyNumber) {
    const policy =  await db.getDb()
    .collection('policies')
    .findOne({policyNumber: policyNumber})    
    if (!policy) {
        const error = new Error(' Не може да се најде полисата')
        error.code = 404;
        throw error
    }
    return policy;
}

static async findByAgent(agentSeller) {
    const agentPolicies = await db.getDb().collection('policies').find({agentSeller:agentSeller}).toArray()
    // return agentPolicies.map(function(policyDocument){
    //     return new Policy(policyDocument);
    // })
    return agentPolicies
}

// static async findOneByPolicyNumber(policyNumber) {
// const thePolicyNumber = policyNumber.thePolicyNumber
//     try {
//         const policyByNumber = await db.getDb().collection('policies').find({policyNumber:thePolicyNumber}).toArray()
//         let thePolicyExists = true
//         return thePolicyExists
//     }
//     catch (error) {
//         error.code = 404;
//         throw error;
//     }
// }

static async findById(policyId) {
    let thePolicyId
    try {
        thePolicyId = new mongodb.ObjectId(policyId)
    }
    catch (error) {
        error.code = 404;
        throw error;
    }

    const policy =  await db.getDb()
    .collection('policies')
    .findOne({_id: thePolicyId})    
    if (!policy) {
        const error = new Error(' Не може да се најде полисата')
        error.code = 404;
        throw error
    }
    return policy;
}


static async findByClientPin(clientPin) {
    const policy =  await db.getDb()
    .collection('policies')
    .findOne({pin: clientPin})   
    if (!client) {
        const error = new Error(' Не може да се најде полисата')
        error.code = 404;
        throw error
    }
    return policy;
}


static async findByDate(startDate, endDate) {
    const requiredPoliciesByDate = await db.getDb()
      .collection('policies')
      .find({ policyDate: { $gte: startDate, $lte: endDate } });
  
    // console.log(await requiredPoliciesByDate.toArray());
    return await requiredPoliciesByDate.toArray();
  }

  static async findAll() {
    const policies = await db.getDb().collection('policies').find().toArray()
    return policies.map(function(policyDocument){
        return new Policy(policyDocument);
    })
}

static async countAll() {
    const policiesNumber = await db.getDb().collection('policies').find().count()
    return policiesNumber
}

// static async totalPremium() {
//     const totalPremium = await db.getDb().collection('policies').aggregate([{$group: {_id: null, sum_val:{$sum: "$policyAmount"}}}])
//     return totalPremium
// }
//in terminal>
// vp-clients> db.policies.aggregate([{$group: {_id: null, sum_val:{$sum: "$policyAmount"}}}])

    async save(policyNumber, policyType, policyAmount, installmentsNumber, policyDate, clinetPin, clientName, agentSeller, thePayment) {
        let installments = [];
        for (let i = 0; i < installmentsNumber; i++) {
        // vo add, brojot 1 da se zgolemuva za 1 pri sekoe vrtenje na loop-ot
        let monthlyInstallment = i;
        let instalment = Math.round(policyAmount / installmentsNumber) + ',00 денари, заклучно до: ' + moment(policyDate).add(monthlyInstallment, "M").format('DD/MM/YYYY') + " година" 
        installments.push(instalment)
        }
        const policyData = {
            policyNumber: policyNumber,
            policyType: policyType,
            registrationNumber: this.registrationNumber,
            policyAmount: +policyAmount,
            policyDate: policyDate,
            clinetPin: clinetPin,
            clientName: clientName,
            installmentsNumber: +installmentsNumber,
            installments: installments, 
            agentSeller: agentSeller, 
            thePayment: thePayment, 
        }

await db.getDb().collection('policies').insertOne(policyData)
    }

    static async removePolicy(policyId) {
        const objectId = new mongodb.ObjectId(policyId);
        return db.getDb().collection('policies').deleteOne({ _id: objectId });
      }

      static async deletePoliciesByClient(theClientName) {
        return db.getDb().collection('policies').deleteMany({ clientName:theClientName });
      }

//////////////////////////////////////////////////////////edit policy single payment
static async updatePolicyPayment(policyId, paymentDateOld, paymentAmountOld, paymentAmount, paymentDate, paidCash) {
  const policyIdObj = new mongodb.ObjectId(policyId);
  const paymentDateOldFormatted = moment(paymentDateOld, 'DD/MM/YYYY').format('YYYY-MM-DD');

  const filter = {
      _id: policyIdObj,
      'thePayment.date': paymentDateOldFormatted,
      'thePayment.amount': parseFloat(paymentAmountOld)
  };
  const update = {
      $set: {
          "thePayment.$.amount": parseFloat(paymentAmount),
          "thePayment.$.date": paymentDate, 
          "thePayment.$.paidCash": paidCash
      }
  };
  const result = await db.getDb().collection('policies').updateOne(filter, update);
  if (result.modifiedCount === 0) {
      throw new Error('Payment not found or not updated in policy.');
  }
  return result;
}
////////////////
static async deletePolicyPayment(policyId, paymentDate) {
  const paymentDateFormatted = moment(paymentDate, 'DD/MM/YYYY').format('YYYY-MM-DD');
  const result = await db.getDb().collection('policies').updateOne(
      { _id: new mongodb.ObjectId(policyId) },
      { $pull: { thePayment: { date: paymentDateFormatted } } }
  );
  if (result.modifiedCount === 0) {
      throw new Error('Payment not found or not deleted in policy.');
  }
}
///////////////////////////////////

static async findByPolicy(policyNumber) {

  const thePolicy = await db
    .getDb()
    .collection("policies")
    .findOne({ policyNumber: policyNumber });
  if (!thePolicy) {
    const error = new Error(" Не може да се најде клиентот");
    error.code = 404;
    throw error;
  }
  return thePolicy;
}


}
module.exports = Policy;
   
