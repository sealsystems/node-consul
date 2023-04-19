/* eslint-disable no-process-env */
'use strict';

const getenv = require('getenv');

const consulUrl = require('../util/consulUrl');

const watch = async function (/*consul, paths*/) {
  // const watch = consul.watchKv({});
  //   await new Promise((resolve, reject) => {
  //     watch.on('change', async (data) => {
  //       console.log('######## change', data);
  //       try {
  //         const keys = await consul.consul.kv.get({ key: 'dc/home/sub/yy' });
  //         console.log('######## keys', keys);
  //       } catch (ex) {
  //         console.log('######## ex', ex);
  //       }
  //       //reject(new Error('Should not happen.'));
  //       setTimeout(() => {
  //         consul.consul.kv.set({ key: `dc/home/sub/yy`, value: uuid() });
  //       }, 2000);
  //     });
  //     watch.on('error', (err) => {
  //       console.log('######## error', err);
  //       assert.that(err.statusCode).is.equalTo(404);
  //       watch.stopWatching();
  //       resolve();
  //     });
};

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

const getEnv = async function (basePath, prefix = '') {
  try {
    const keyList = await this.consul.kv.keys({
      key: basePath,
      separator: '/'
    });
    for (const key of keyList) {
      if (key.endsWith('/')) {
        await getEnv.call(this, key, `${prefix}${basename(key)}_`);
      } else {
        const entries = await this.consul.kv.get({
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
  if (!this.consul) {
    await this.initialize(await consulUrl(options));
  }
  options.serviceName = options.serviceName || getenv('SERVICE_NAME');
  options.serviceTags = options.serviceTags || getenv('SERVICE_TAGS', '');
  const base = options.basePath || '';

  const paths = [
    `${base}dc/home/env/service/any/tag/any/`,
    `${base}dc/home/env/service/${options.serviceName}/tag/any/`
  ];
  const tags = options.serviceTags.split(' ').filter((tag) => tag);
  for (const tag of tags) {
    paths.push(`${base}dc/home/env/service/any/tag/${tag}/`);
    paths.push(`${base}dc/home/env/service/${options.serviceName}/tag/${tag}/`);
  }

  for (const path of paths) {
    await getEnv.call(this, path);
  }

  await watch(this, paths);
};

module.exports = setEnv;
