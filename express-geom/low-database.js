const lowdDB = require('lowdb');
const FyleSync = require('lowdb/adapters/FileSync');

let ldb;

// Database Setup
function createConnection() {
  const adapter = new FyleSync('db.json');
  ldb = lowdDB(adapter);
  ldb.defaults({ 
    files: []
  }).write();
}

const getConnection = () => {
  return ldb;
}

module.exports = {
  createConnection,
  getConnection
}
