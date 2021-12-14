'use strict';

const EventEmitter = require('../util/EventEmitter');

const service = function ({ dc, serviceName, serviceTag }) {
  if (!serviceName) {
    throw new Error('Service name is missing.');
  }

  const eventEmitter = new EventEmitter();

  const watch = this.consul.watch({
    method: this.consul.health.service,
    options: {
      dc,
      passing: true,
      service: serviceName,
      tag: serviceTag
    }
  });

  watch.on('change', (data) => {
    const nodes = data.map((item) => ({
      host: item.Node.Address,
      node: item.Node.Node.toLowerCase(),
      port: item.Service.Port
    }));

    eventEmitter.emit('change', nodes);
  });

  watch.on('error', (err) => {
    eventEmitter.emit('error', err);
  });

  return eventEmitter;
};

module.exports = service;
