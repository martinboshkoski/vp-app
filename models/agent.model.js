const bcrypt = require('bcryptjs')

const mongodb = require('mongodb')

const { ObjectId } = require('mongodb');
const db = require('../data/database')

class Agent {
    constructor(email, password, fullname, uid) {
        this.email = email;
        this.password = password;
        this.name = fullname;
        this.uid = uid
    }

    getAgentWithSameEmail() {
        return db.getDb().collection('agents').findOne({ email: this.email })
    }

    static async getAgentWithSameUid(uid) {
      return db.getDb().collection('agents').findOne({ _id: new ObjectId(uid) });
    }

        static async getAgentWithSameId(agentId) {
            let theAgentId;
            try {
                theAgentId = new mongodb.ObjectId(agentId);
            } catch (error) {
              error.code = 404;
              throw error;
            }
            const agent = await db
              .getDb()
              .collection("agents")
              .findOne({ _id: theAgentId });
            if (!agent) {
              const error = new Error(" Не може да се најде агентот");
              error.code = 404;
              throw error;
            }
            return agent;
          }

    async existsAlready() {
      const existingAgent = await this.getAgentWithSameEmail();
      if (existingAgent) {
          return true;
      } 
      return false;
    }

   async signup() {
       const hashedPassword = await bcrypt.hash(this.password, 12)

        await db.getDb().collection('agents').insertOne({
            email: this.email,
            password: hashedPassword,
            name: this.name
        })
    }
    hasMatchingPassword(hashedPassword) {
       return bcrypt.compare(this.password, hashedPassword)
    }

    static async findAll() {
      const agents = await db.getDb().collection("agents").find().toArray();
      return agents.map(function (agentsDocument) {
        return new Agent(agentsDocument);
      });
    }
  
  }

module.exports = Agent;