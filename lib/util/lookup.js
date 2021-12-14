'use strict';

const droddel = require('@sealsystems/droddel');
const retry = require('async-retry');

const dnsWrapper = require('./dnsWrapper');

const droddelMap = {};

const lookup = async function (hostname) {
  if (!hostname) {
    throw new Error('Hostname is missing.');
  }

  if (!droddelMap[hostname]) {
    droddelMap[hostname] = droddel(async () => {
      return await dnsWrapper.resolve(hostname);
    });
  }

  const addresses = await retry(async () => {
    return await droddelMap[hostname]();
  }, this.retryOptions);

  if (!addresses || addresses.length === 0) {
    throw new Error('No addresses found');
  }

  return addresses[0];
};

module.exports = lookup;
