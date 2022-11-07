const mongodb = require("mongodb");

const moment = require("moment");

const db = require("../data/database");

class Client {
  constructor(clientData) {
    this.name = clientData.name;
    this.address = clientData.address;
    this.pin = clientData.pin;
    this.phone = clientData.phone;
    // this.insurancePolicy = clientData.insurancePolicy,
    // this.insurancePolicyType = clientData.insurancePolicyType,
    // this.amount = +clientData.amount,
    // this.insurancePolicyDate = clientData.insurancePolicyDate,
    // this.installmentsNumber = +clientData.installmentsNumber;
    this.payment = +clientData.payment;
    if (clientData._id) {
      this.id = clientData._id.toString();
    }
    this.startedLawsuit = clientData.startedLawsuit;
    this.agentName = clientData.agentName;
    this.debt = clientData.debt
  }

  ///////////////////////////////////////////////////////////////
  static async findById(clientId) {
    let theClientId;
    try {
      theClientId = new mongodb.ObjectId(clientId);
    } catch (error) {
      error.code = 404;
      throw error;
    }
    const client = await db
      .getDb()
      .collection("clients")
      .findOne({ _id: theClientId });
    if (!client) {
      const error = new Error(" Не може да се најде клиентот");
      error.code = 404;
      throw error;
    }
    return client;
  }
////////

static async findByPin(clientPin) {

  const client = await db
    .getDb()
    .collection("clients")
    .findOne({ pin: clientPin });
  if (!client) {
    const error = new Error(" Не може да се најде клиентот");
    error.code = 404;
    throw error;
  }
  return client;
}
  ///////////////////////////////////////////////////////////////
  static async findAll() {
    const clients = await db.getDb().collection("clients").find().toArray();
    return clients.map(function (clientDocument) {
      return new Client(clientDocument);
    });
  }

  ///////////////////////////////////////////////////////////////
  async save(agentName, startedLawsuit, debt) {
    const clinetData = {
      name: this.name,
      address: this.address,
      pin: this.pin,
      phone: this.phone,
      startedLawsuit: startedLawsuit,
      agentName: agentName, 
      debt: +debt
    };

    if (this.id) {
      const clientId = new mongodb.ObjectId(this.id);
      await db
        .getDb()
        .collection("clients")
        .updateOne({ _id: clientId }, { $set: clinetData });
    } else {
      await db.getDb().collection("clients").insertOne(clinetData);
    }
  }

// async withdrawLawsuit (clientId) {
//   await db.getDb().collection("clients").updateOne({ _id: clientId }, { $set: {"startedLawsuit":false} });
// }

///////////////////////////////////////////////////////////////
  remove() {
    const clientId = new mongodb.ObjectId(this.id);
    return db.getDb().collection("clients").deleteOne({ _id: clientId });
  }
}
module.exports = Client;
