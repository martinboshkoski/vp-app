const mongodb = require('mongodb');
const moment = require('moment');
const db = require('../data/database');

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

    ////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////
    static async findByAgent(agentSeller) {
        const agentPolicies = await db.getDb().collection('policies').find({agentSeller:agentSeller}).toArray()
        return agentPolicies;
    }

    ////////////////////////////////////////////////////////
    static async findById(policyId) {
        let thePolicyId;
        try {
            thePolicyId = new mongodb.ObjectId(policyId);
        }
        catch (error) {
            error.code = 404;
            throw error;
        }

        const policy =  await db.getDb()
        .collection('policies')
        .findOne({_id: thePolicyId});    
        if (!policy) {
            const error = new Error(' Не може да се најде полисата')
            error.code = 404;
            throw error;
        }
        return policy;
    }

    ////////////////////////////////////////////////////////
    static async findByClientPin(clientPin) {
        const policy =  await db.getDb()
        .collection('policies')
        .findOne({pin: clientPin});   
        if (!policy) {
            const error = new Error(' Не може да се најде полисата')
            error.code = 404;
            throw error;
        }
        return policy;
    }

    ////////////////////////////////////////////////////////
    static async findByDate(startDate, endDate) {
        const requiredPoliciesByDate = await db.getDb()
          .collection('policies')
          .find({ policyDate: { $gte: startDate, $lte: endDate } });
      
        return await requiredPoliciesByDate.toArray();
    }

    ////////////////////////////////////////////////////////
    static async findAll() {
        const policies = await db.getDb().collection('policies').find().toArray();
        return policies.map(function(policyDocument){
            return new Policy(policyDocument);
        });
    }

    ////////////////////////////////////////////////////////
    static async countAll() {
        const policiesNumber = await db.getDb().collection('policies').find().count();
        return policiesNumber;
    }

    ////////////////////////////////////////////////////////
    async save(policyNumber, policyType, policyAmount, installmentsNumber, policyDate, clinetPin, clientName, agentSeller, thePayment) {
        let installments = [];
        for (let i = 0; i < installmentsNumber; i++) {
            let monthlyInstallment = i;
            let instalment = Math.round(policyAmount / installmentsNumber) + ',00 денари, заклучно до: ' + moment(policyDate).add(monthlyInstallment, "M").format('DD/MM/YYYY') + " година"; 
            installments.push(instalment);
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
        };

        await db.getDb().collection('policies').insertOne(policyData);
    }

    static async removePolicy(policyId) {
        const objectId = new mongodb.ObjectId(policyId);
        return db.getDb().collection('policies').deleteOne({ _id: objectId });
    }

    static async deletePoliciesByClient(theClientName) {
        return db.getDb().collection('policies').deleteMany({ clientName:theClientName });
    }

    ////////////////////////////////////////////////////////edit policy single payment
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

    ////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////
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

    ////////////////////////////////////////////////////////
    static async findPoliciesByYear(year) {
        const startDate = moment(`${year}-01-01`).format('YYYY-MM-DD');
        const endDate = moment(`${year}-12-31`).format('YYYY-MM-DD');
      
        return db.getDb().collection('policies').find({
          policyDate: { $gte: startDate, $lte: endDate }
        }).toArray();
    }

    ////////////////////////////////////////////////////////
    static async getPolicyTypes() {
        const policies = await db.getDb().collection('policies').distinct('policyType');
        return policies;
    }
    ////////////////////////////////////////////////////////
    static async getMonthlyTrendsByPolicyType(policyType) {
        // Step 1: Retrieve all policies with the specified policy type
        // console.log('Policy Type:', policyType);
    
        const matchQuery = {
            policyType: policyType
        };
    
        // console.log('Match Query (Policy Type):', JSON.stringify(matchQuery, null, 2));
    
        // Retrieve the raw documents to inspect their structure
        const rawDocuments = await db.getDb().collection('policies').find(matchQuery).toArray();
        // console.log('Raw documents matching query (Policy Type):', JSON.stringify(rawDocuments, null, 2));
    
        // Proceed to next steps only if there are matching documents
        if (rawDocuments.length > 0) {
            const startDate = new Date('2023-01-01');
            const endDate = new Date('2024-12-31');
    
            console.log('Start Date:', startDate.toISOString());
            console.log('End Date:', endDate.toISOString());
    
            const dateMatchQuery = {
                policyType: policyType,
                policyDate: {
                    $gte: startDate.toISOString().split('T')[0], // Convert to string in 'YYYY-MM-DD' format
                    $lte: endDate.toISOString().split('T')[0]   // Convert to string in 'YYYY-MM-DD' format
                }
            };
    
            // console.log('Date Match Query:', JSON.stringify(dateMatchQuery, null, 2));
    
            // Retrieve the documents that match the date range
            const filteredDocuments = rawDocuments.filter(doc => {
                const policyDate = new Date(doc.policyDate);
                return policyDate >= startDate && policyDate <= endDate;
            });
    
            // console.log('Filtered documents by date:', JSON.stringify(filteredDocuments, null, 2));
    
            // Grouping and aggregation logic
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const result = {
                months: [],
                policyCounts: [],
                policyAmounts: [],
                totalPaid: []
            };
    
            filteredDocuments.forEach(doc => {
                const policyDate = new Date(doc.policyDate);
                const month = policyDate.getMonth();
                const year = policyDate.getFullYear();
                const key = `${month + 1}-${year}`;
    
                if (!result.months.includes(key)) {
                    result.months.push(key);
                    result.policyCounts.push(0);
                    result.policyAmounts.push(0);
                    result.totalPaid.push(0);
                }
    
                const index = result.months.indexOf(key);
                result.policyCounts[index]++;
                result.policyAmounts[index] += doc.policyAmount;
                result.totalPaid[index] += doc.totalPaid;
            });
    
            // console.log('Result:', JSON.stringify(result, null, 2));
            return result;
        }
    
        return rawDocuments; // Temporarily return the raw documents for inspection
    }
    
}

module.exports = Policy;