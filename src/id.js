module.exports = function (length) {
  let result = '';
  if (!length) length = 6;
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}