'use strict';

const dnsWrapper = require('../util/dnsWrapper');

const droddel = require('@sealsystems/droddel');
const getenv = require('@sealsystems/seal-getenv');
const retry = require('async-retry');

const consulDomain = getenv('CONSUL_DOMAIN', 'consul');
const droddelMap = {};

const resolveService = async function (serviceName) {
  if (!serviceName) {
    throw new Error('Service name is missing.');
  }

  const fullServiceName = `${serviceName}.service.${consulDomain}`;

  if (!droddelMap[fullServiceName]) {
    droddelMap[fullServiceName] = droddel(async () => {
      return await dnsWrapper.resolveSrv(fullServiceName);
    });
  }

  const services = await retry(async (bail) => {
    try {
      return await droddelMap[fullServiceName]();
    } catch (e) {
      if (e.code === 'ENODATA' || e.code === 'ENOTFOUND') {
        return bail(e);
      }
      throw e;
    }
  }, this.retryOptions);

  return services;
};

module.exports = resolveService;
