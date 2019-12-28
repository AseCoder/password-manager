const fs = require('fs');
const path = require('path');
const createId = require('./id.js');
const CredentialWrapper = require('./credentialWrapper.js');
const client = require('./client.js');

class Storage extends Map {
  constructor() {
    super();
    this.ids = [];
  }
  some(func) {
    this.forEach(x => { 
      if (func(x)) return true;
    });
    return false;
  }
  filter(func) {
    const filtered = [];
    this.forEach(x => { 
      if (func(x)) filtered.push(x);
    });
    return filtered;
  }
  initialize() {
    const credentialIds = fs.readdirSync(path.join(path.dirname(__dirname), 'data')).map(x => x.slice(0, -5));
    this.ids = credentialIds;
    credentialIds.forEach(x => {
      const read = require('../data/' + x + '.json');
      this.set(x, new CredentialWrapper({
        name: read.name,
        id: read.id,
        credentials: Object.entries(read.creds),
      }));
      this.listCredential(x);
    });
    return this;
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
    if (!options.id) options.id = createId();
    if (!options.name) {
      const unnamed = this.filter(x => x.name.split(' ').slice(0, -1).join('') === 'UnnamedCredential').map(x => parseInt(x.name.split(' ').slice(-1)));
      options.name = 'Unnamed Credential ' + (unnamed[unnamed.length - 1] + 1 || 1);
    }
    this.set(options.id, new CredentialWrapper(options));
    this.listCredential(options.id);
    this.displayCredential(options.id);
    return this.get(options.id);
  }
  listCredential(id) {
    const li = document.createElement('li');
    $(li).attr({
      'onclick': `client.storage.displayCredential('${id}')`,
      'id': `li${id}`,
    }).text(this.get(id).name);
    $('#credlist').append(li);
  }
  displayCredential(id) {
    const credential = this.get(id);
    console.log('display credential', id);
    $('li.active').removeAttr('class')
    $('#li' + id).attr('class', 'active');
    $('#credentialName').text(credential.name);
  }
}

module.exports = Storage;