const lowdDB = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

// Database Setup
const adapter = new FileSync('db.json');
const db = lowdDB(adapter);

// Seed Data
const seedData = require('./seed.const');

// Seed Database
// db.defaults(seedData).write();
db.setState(seedData).write();

console.log('Database has been seeded');
