'use strict';

const cloudServicePort = require('./cloudServicePort');

const resolveService = async function (serviceName) {
  if (!serviceName) {
    throw new Error('Service name is missing.');
  }

  return [
    {
      port: cloudServicePort,
      name: serviceName
    }
  ];
};

module.exports = resolveService;
