const Storage = require('./storage.js');

class Client {
  constructor() {
    this.storage = new Storage();
  }
  displayCredential(id) {
    console.log('display credential', id);
  }
}

module.exports = new Client();