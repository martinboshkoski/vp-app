const monbodb = require('mongodb')

const MongoClient = monbodb.MongoClient;

let database;

async function connectToDatabase() {
    // const client = await MongoClient.connect('mongodb://localhost:27017');
    const client = await MongoClient.connect('mongodb+srv://martinboshkoski:Mart1n990@cluster0.o8vyshm.mongodb.net/?retryWrites=true&w=majority');
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
