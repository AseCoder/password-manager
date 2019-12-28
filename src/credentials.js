const createId = require('./id.js');

class Credentials extends Map {
  constructor(iterable) {
    super();
    if (iterable) {
      iterable.forEach(x => {
        this.set(x[0], {
          type: x[1].type,
          value: x[1].value,
          id: x[0],
        });
      });
    }
  }
  add(type, value) {
    if (typeof type === 'object' && !value) {
      value = type[1];
      type = type[0];
    }
    this.set(createId(), {
      type,
      value,
    });
    return this;
  }
  remove(id) {
    this.delete(id);
  }
  edit(id, newType, newValue) {
    if (newType) this.get(id).type = newType;
    if (newValue) this.get(id).value = newValue;
  }
  toJSON() {
    const obj = {};
    this.forEach((value, id) => {
      obj[id] = {
        type: value.type,
        value: value.value,
        id,
      };
    });
    return obj;
  }
}

module.exports = Credentials;