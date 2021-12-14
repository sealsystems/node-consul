'use strict';

const dns = require('dns');
const url = require('url');
const util = require('util');

const parse = require('parse-duration');

const getConsulId = require('./getConsulId');
const serviceVersionAsTag = require('./serviceVersionAsTag');

const lookup = util.promisify(dns.lookup);
const sleep = util.promisify(setTimeout);

const connect = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.serviceName) {
    throw new Error('Service name is missing.');
  }
  if (!options.serviceUrl) {
    throw new Error('Service url is missing.');
  }
  if (!options.consulUrl) {
    throw new Error('Consul url is missing.');
  }

  await this.initialize(options);

  const serviceUrlObj = url.parse(options.serviceUrl);

  this.retryOptions = {
    retries: (options.connectionRetries = options.connectionRetries >= 0 ? options.connectionRetries : 5),
    minTimeout: options.waitTimeBetweenRetries || 0.5 * 1000,
    maxTimeout: options.waitTimeBetweenRetries || 60 * 1000,
    factor: options.waitFactor || 2,
    randomize: true
  };

  let tags = options.serviceTags || [];

  // Remove empty tags to work around a bug in getenv
  tags = tags.filter((tag) => tag.length > 0);

  tags.push(serviceVersionAsTag());

  const id = getConsulId({
    name: options.serviceName,
    port: serviceUrlObj.port,
    tags
  });

  const serviceAddress = await lookup(serviceUrlObj.hostname);

  this.options = {
    id,
    name: options.serviceName,
    port: serviceUrlObj.port - 0,
    tags,
    check: {
      id: `service:${id}`,
      deregistercriticalserviceafter: '1h',
      notes: 'Service Heartbeat',
      ttl: options.ttl || '10s'
    }
  };

  if (serviceAddress && serviceAddress.address) {
    this.options.address = serviceAddress.address;
  }

  const consulAddress = await lookup(url.parse(options.consulUrl).hostname);

  await this.agent.service.register(this.options);
  dns.setServers([consulAddress.address]);

  const status = options.status || 'warn';

  try {
    await this[status]();
  } catch (ex) {
    // Intentionally ignore errors here.
  }

  const ttl = Math.floor(parse(this.options.check.ttl) / 2);

  (async () => {
    for (;;) {
      try {
        await this.heartbeat();
      } catch (ex) {
        if (ex.message.indexOf('CheckID') !== -1) {
          throw ex;
        }

        // Intentionally ignore errors here.
      }

      await sleep(ttl);
    }
  })();
};

module.exports = connect;
