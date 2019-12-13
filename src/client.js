const Storage = require('./storage.js');

class Client {
  constructor() {
    this.storage = new Storage();
  }
}

module.exports = new Client();