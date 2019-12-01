const fs = require('fs');
const path = require('path');
const createId = require('./id.js');
const CredentialWrapper = require('./credentialWrapper.js');

class Storage extends Map {
  constructor() {
    super();
  }
  async initialize() {
    return new Promise((resolve, reject) => {
      const credentialIds = fs.readdirSync(path.join(path.dirname(__dirname), 'data')).map(x => x.slice(0, -5));
      credentialIds.forEach(x => {
        const read = require('../data/' + x + '.json');
        this.set(x, new CredentialWrapper({
          name: read.name,
          id: read.id,
          credentials: Object.entries(read.creds),
        }));
      });
      resolve(this);
    })
  }
  write() {
    let writtenIDS = [];
    this.forEach((value, key) => {
      const data = JSON.stringify({
        name: value.name,
        id: value.id,
        creds: value.credentials.toJSON(),
      });
      fs.writeFileSync(path.join(path.dirname(__dirname), 'data', key + '.json'), data);
      writtenIDS.push(key);
    });
    return writtenIDS;
  }
  newCredential(options) {
    if (!options) options = {};
    const id = options.id || createId();
    options.id = id;
    this.set(id, new CredentialWrapper(options));
    return this.get(id);
  }
}

module.exports = Storage;