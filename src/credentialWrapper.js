const Credentials = require('./credentials.js');

class CredentialWrapper {
  constructor(options) {
    this.name = options.name || '';
    this.id = options.id;
    this.credentials = new Credentials(options.credentials);
  }
  setName(newName) {
    if (!newName) throw new TypeError('newName is not defined');
    this.name = newName;
    return this;
  }
}

module.exports = CredentialWrapper;