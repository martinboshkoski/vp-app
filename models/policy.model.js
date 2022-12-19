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

    remove() {
        const policyId = new mongodb.ObjectId(this.id);
        return db.getDb().collection('policies').deleteOne({ _id: policyId });
      }
}
module.exports = Policy;
   
