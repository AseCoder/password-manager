const client = require('./src/client.js');
const moment = require('moment')
const $ = require('jquery');

client.storage.initialize().displayCredential(client.storage.ids[0]);

setInterval(() => {
  const now = moment();
  $('#hours').text(now.format('HH'));
  $('#mins').text(now.format('mm'));
}, 2000);