'use strict';

const fs = require('fs/promises');

const consulUrl = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (options.consulUrl) {
    return options;
  }
  if (options.consulConfig) {
    try {
      const config = JSON.parse(await fs.readFile(options.consulConfig, 'utf8'));
      const consulAddress = config?.consul?.address;
      if (consulAddress) {
        options.consulUrl = `https://${consulAddress}`;
        return options;
      }
    } catch (ex) {
      // Ignore.
    }
  }
  if (options.defaultUrl) {
    options.consulUrl = options.defaultUrl;
    return options;
  }

  throw new Error('Consul url is missing.');
};

module.exports = consulUrl;
