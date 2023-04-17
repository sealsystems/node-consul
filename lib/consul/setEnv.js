/* eslint-disable no-process-env */
'use strict';

const getenv = require('getenv');

const consulUrl = require('../util/consulUrl');

const basename = function (path) {
  if (path.lastIndexOf('/') === path.length - 1) {
    path = path.slice(0, -1);
  }

  return path.substr(path.lastIndexOf('/') + 1);
};

const entries2Env = function (entries, prefix) {
  entries.forEach((entry) => {
    process.env[`${prefix}${basename(entry.Key)}`] = `${entry.Value}`;
  });
};

const getEnv = async (consul, basePath, prefix = '') => {
  try {
    const keyList = await consul.agent.consul.kv.keys({
      key: basePath,
      separator: '/'
    });
    for (const key of keyList) {
      if (key.endsWith('/')) {
        await getEnv(consul, key, `${prefix}${basename(key)}_`);
      } else {
        const entries = await consul.agent.consul.kv.get({
          key,
          recurse: true
        });
        entries2Env(entries, prefix);
      }
    }
  } catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
  }
};

const setEnv = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!this.agent) {
    await this.initialize(await consulUrl(options));
  }
  options.serviceName = options.serviceName || getenv('SERVICE_NAME');
  options.serviceTags = options.serviceTags || getenv('SERVICE_TAGS', '');

  await getEnv(this, 'dc/home/env/service/any/tag/any/');
  await getEnv(this, `dc/home/env/service/${options.serviceName}/tag/any/`);

  const tags = options.serviceTags.split(' ').filter((tag) => tag);
  for (const tag of tags) {
    await getEnv(this, `dc/home/env/service/any/tag/${tag}/`);
    await getEnv(this, `dc/home/env/service/${options.serviceName}/tag/${tag}/`);
  }
};

module.exports = setEnv;
