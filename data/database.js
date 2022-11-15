const monbodb = require('mongodb')

const MongoClient = monbodb.MongoClient;

let database;

const MONGODB_URI = 
// `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}cluster0.o8vyshm.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`
'mongodb+srv://martinboshkoski:Mart1n990@cluster0.o8vyshm.mongodb.net/?retryWrites=true&w=majority'

async function connectToDatabase() {
    // const client = await MongoClient.connect('mongodb://localhost:27017');
    const client = await MongoClient.connect(MONGODB_URI);
    database = client.db('vp-clients');
}

function getDb() {
    if (!database) {
        throw new Error('Не е уште конектирана ДБ!')
    }
    return database
}

module.exports = {
    connectToDatabase: connectToDatabase,
    getDb: getDb
}
