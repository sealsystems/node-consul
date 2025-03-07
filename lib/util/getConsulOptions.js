'use strict';

const url = require('url');

const getenv = require('@sealsystems/seal-getenv');

const tlscert = require('@sealsystems/tlscert');

const getTlsOptions = async function () {
  const consulForceTls = getenv.boolish('CONSUL_FORCE_TLS', false);
  const tlsUnprotected = getenv('TLS_UNPROTECTED', 'loopback');
  const tlsOptions = {};

  if (!consulForceTls && tlsUnprotected !== 'none' && tlsUnprotected !== 'loopback') {
    return tlsOptions;
  }

  tlsOptions.secure = true;

  const keystore = await tlscert.get();

  if (keystore.ca) {
    tlsOptions.ca = [keystore.ca];
  }

  return tlsOptions;
};

const getConsulOptions = async function ({ consulUrl, token = '' }) {
  if (!consulUrl) {
    throw new Error('Consul url is missing.');
  }

  const urlObj = url.parse(consulUrl);

  if (!['https:', 'http:'].includes(urlObj.protocol)) {
    throw new Error('Wrong protocol in consul url provided.');
  }

  const consulOptions = {
    defaults: { token },
    host: urlObj.hostname,
    promisify: true
  };

  if (urlObj.port) {
    consulOptions.port = urlObj.port - 0;
  }

  const tlsOptions = await getTlsOptions(consulOptions);

  return Object.assign({}, consulOptions, tlsOptions);
};

module.exports = getConsulOptions;
