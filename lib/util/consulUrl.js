'use strict';

const fs = require('fs/promises');
const path = require('path');

const getenv = require('@sealsystems/seal-getenv');

let defaultConsulConfig;
if (process.platform === 'win32') {
  defaultConsulConfig = path.join(getenv('ProgramData'), 'SEAL Systems', 'config', 'envconsul.json');
} else {
  defaultConsulConfig = path.join(path.sep, 'opt', 'seal', 'etc', 'envconsul.json');
}

const readFiles = async function (options, fileNames) {
  for (const fileName of fileNames) {
    try {
      const config = JSON.parse(await fs.readFile(fileName, 'utf8'));
      const consulAddress = config?.consul?.address;
      if (consulAddress) {
        options.consulUrl = `https://${consulAddress}`;
        return options;
      }
    } catch (ex) {
      // ignore
    }
  }
  return null;
};

const consulUrl = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (options.consulUrl) {
    return options;
  }

  const fileNames = [defaultConsulConfig];
  if (options.consulConfig) {
    fileNames.unshift(options.consulConfig);
  }
  const result = await readFiles(options, fileNames);
  if (result) {
    return result;
  }

  if (options.defaultUrl) {
    options.consulUrl = options.defaultUrl;
    return options;
  }

  throw new Error('Consul url is missing.');
};

module.exports = consulUrl;
