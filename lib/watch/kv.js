'use strict';

const EventEmitter = require('../util/EventEmitter');

const kv = function ({ key }) {
  if (!key) {
    throw new Error('Key is missing.');
  }

  const eventEmitter = new EventEmitter();

  const watch = this.consul.watch({
    method: this.consul.kv.keys,
    options: {
      key,
      recurse: true,
      separator: '/'
    }
  });

  watch.on('change', (keylist) => {
    eventEmitter.emit('change', keylist);
  });

  watch.on('error', (err) => {
    eventEmitter.emit('error', err);
  });

  return eventEmitter;
};

module.exports = kv;
