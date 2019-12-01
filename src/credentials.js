const createId = require('./id.js');

class Credentials extends Map {
  constructor(iterable) {
    super();
    if (iterable) {
      iterable.forEach(x => {
        this.set(createId(), {
          type: x[0],
          value: x[1],
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
    this.forEach((text, id) => {
      obj[id] = {
        type: text.type,
        value: text.value,
        id: id,
      };
    });
    return obj;
  }
}

module.exports = Credentials;