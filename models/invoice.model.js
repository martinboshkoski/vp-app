const mongodb = require('mongodb')

const moment = require('moment')

const db = require('../data/database')

class Invoice {
    constructor(invoiceData) {
        this.clientName = invoiceData.clientName,
        this.clientAddress = invoiceData.clientAddress,
        this.clinetPin = invoiceData.clinetPin
        this.policyNumber = invoiceData.policyNumber,
        this.policyAmount = invoiceData.policyAmount,
        this.policyDate = invoiceData.policyDate,
        this.invoicesNumber = invoiceData.invoicesNumber
    }

////////////////////////////////////////////////////////////////////////////////
static async findByPolicy(policyNumber) {

    const invoice =  await db.getDb()
    .collection('invoices')
    .findOne({policyNumber: policyNumber})    

    return invoice;
}
//////////
static async findById(invoiceId) {
    let theInvoiceId;
    try {
      theInvoiceId = new mongodb.ObjectId(invoiceId);
    } catch (error) {
      error.code = 404;
      throw error;
    }
    const invoice = await db
      .getDb()
      .collection("invoices")
      .findOne({ _id: theInvoiceId });
    if (!invoice) {
      const error = new Error(" Не може да се најде фактурата");
      error.code = 404;
      throw error;
    }
    return invoice;
  }
///////////
static async countAll() {
    const invoicesNumber = await db.getDb().collection('invoices').find().count()
    return invoicesNumber
}
////////////////////////////////////////////////////////////////////////////////
  static async findAll() {
    const invoices = await db.getDb().collection('invoices').find().toArray()
return invoices
}
////////////////////////////////////////////////////////////////////////////////
    async save(invoiceDataS) {
        const invoiceDataG = {
            clinetName: invoiceDataS.clientName,
            clinetAddress: invoiceDataS.clientAddress,
            clinetPin: invoiceDataS.clientPin,
            policyNumber: invoiceDataS.policyNumber,
            policyAmount: invoiceDataS.policyAmount,
            policyDate: invoiceDataS.policyDate, 
            invoicesNumber: invoiceDataS.invoicesNumber
        }

await db.getDb().collection('invoices').insertOne(invoiceDataG)
    }

    remove() {
        const invoiceId = new mongodb.ObjectId(this.id);
        return db.getDb().collection('invoices').deleteOne({ _id: invoiceId });
      }
}
module.exports = Invoice;
   
