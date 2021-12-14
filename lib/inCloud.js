'use strict';

const getenv = require('getenv');

const SealError = require('@sealsystems/error');

const serviceDiscovery = getenv('SERVICE_DISCOVERY', 'consul');

const inCloud = function () {
  switch (serviceDiscovery) {
    case 'consul':
      return false;
    case 'cloud':
      return true;
    default:
      throw new SealError('IllegalConfiguration', { serviceDiscovery });
  }
};

module.exports = inCloud;
