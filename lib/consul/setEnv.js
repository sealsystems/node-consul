/* eslint-disable no-process-env */
'use strict';

const { EventEmitter } = require('events');

const getenv = require('getenv');

const log = require('@sealsystems/log').getLogger();

const consulUrl = require('../util/consulUrl');

class Watcher extends EventEmitter {
  watchList = [];
  stopWatching() {
    for (const watch of this.watchList) {
      watch.end();
    }
  }
}

const watchEnv = async function (paths, options) {
  const watcher = new Watcher();

  for (const path of paths) {
    const watch = this.consul.watch({
      method: this.consul.kv.keys,
      options: {
        key: path,
        recurse: true,
        separator: '/'
      },
      backoffFactor: 1000,
      backoffMax: 5000
    });
    watch.listenOnChange = false;
    watch.on('change', () => {
      if (watch.listenOnChange) {
        log.info('Configuration changed, reloading...', {
          service: options.serviceName
        });
        process.kill(process.pid, 'SIGINT');
      }
      watch.listenOnChange = true;
    });
    watch.on('error', (err) => {
      if (err.statusCode === 404) {
        watch.listenOnChange = true;
        return;
      }
      log.error('Consul error', { err, service: options.serviceName });
      watcher.emit('error', err);
    });
    watcher.watchList.push(watch);
  }

  return watcher;
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
  options.serviceTags =
    options.serviceTags ||
    getenv('SERVICE_TAGS', '')
      .split(' ')
      .filter((tag) => tag);
  const base = options.basePath || '';

  const paths = [
    `${base}dc/home/env/service/any/tag/any/`,
    `${base}dc/home/env/service/${options.serviceName}/tag/any/`
  ];

  for (const tag of options.serviceTags) {
    paths.push(`${base}dc/home/env/service/any/tag/${tag}/`);
    paths.push(`${base}dc/home/env/service/${options.serviceName}/tag/${tag}/`);
  }

  for (const path of paths) {
    await getEnv.call(this, path);
  }

  return await watchEnv.call(this, paths, options);
};

module.exports = setEnv;
