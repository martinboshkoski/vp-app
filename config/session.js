const expressSession = require('express-session');
const mongoDbStore = require('connect-mongodb-session');

function createSessionStore() {
    const MongoDBStore = mongoDbStore(expressSession);
  
    const store = new MongoDBStore({
      uri: 'mongodb+srv://martinboshkoski:Mart1n990@cluster0.mo2jilq.mongodb.net/?retryWrites=true&w=majority',
      databaseName: 'vp-clients',
      collection: 'sessions'
    });
  
    return store;
  }

function createSessionConfig() {
    return {
        secret: "super-secret",
        resave: false,
        saveUninitialized: false,
        store: createSessionStore(),
        cookie: {
            maxAge: 2 * 24 * 60 * 60 * 1000
        }
    }
}

module.exports = createSessionConfig;
