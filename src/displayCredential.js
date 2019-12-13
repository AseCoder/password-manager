module.exports = (id) => {
  const credential = this.storage.get(id);
  console.log('display credential', id);
  $('li.active').removeAttr('class')
  $('#li' + id).attr('class', 'active');
  $('#credentialName').text(credential.name);
}