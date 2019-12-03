const client = require('./src/client.js');
const moment = require('moment')
const $ = require('jquery');

client.storage.initialize();

setInterval(() => {
  const now = moment();
  $('#hours').text(now.format('HH'));
  $('#mins').text(now.format('mm'));
}, 2000);