'use strict';

const assert = require('assertthat');
const host = require('docker-host')().host;
const { v4: uuid } = require('uuid');

const consul = require('../../lib/consul');

const kvTree = require('../../lib/watch/kv');

suite('watch.kv', () => {
  test('is a function.', async () => {
    assert.that(kvTree).is.ofType('function');
  });

  test('emits changed event when a key is changing', async function () {
    this.timeout(10000);

    const key = `dc/home/${uuid()}/`;

    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'test',
      serviceUrl: `http://${host}:3000`,
      status: 'pass'
    });

    const result = await consul.consul.kv.set({ key, value: '' });

    assert.that(result).is.true();

    const watch = consul.watchKv({ key });
    let subKeyChanged = false;

    await Promise.all([
      new Promise((resolve) => {
        watch.on('change', (data) => {
          if (!subKeyChanged) {
            return;
          }

          assert.that(data).is.ofType('array');
          resolve();
        });
      }),

      (async () => {
        const result2 = await consul.consul.kv.set({ key: `${key}sub/yy`, value: 'huhu' });

        assert.that(result2).is.true();
        subKeyChanged = true;
      })()
    ]);
    watch.stopWatching();
  });

  test('emits error for unknown path', async function () {
    this.timeout(10000);

    const key = `dc/home/${uuid()}/bla/${uuid()}/`;

    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'test',
      serviceUrl: `http://${host}:3000`,
      status: 'pass'
    });

    const result = await consul.consul.kv.set({ key: 'dc/home/', value: '' });
    assert.that(result).is.true();

    const watch = consul.watchKv({ key });

    await new Promise((resolve, reject) => {
      watch.on('change', async () => {
        reject(new Error('Should not happen.'));
      });

      watch.on('error', (err) => {
        assert.that(err.statusCode).is.equalTo(404);
        watch.stopWatching();
        resolve();
      });
    });
  });

  test('waits for path to exist', async function () {
    this.timeout(10000);

    const key = `dc/home/${uuid()}/`;

    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'test',
      serviceUrl: `http://${host}:3000`,
      status: 'pass'
    });

    const watch = consul.watchKv({ key, backoffFactor: 100, backoffMax: 500 });

    const start = Date.now();
    let errCount = 0;
    await new Promise((resolve) => {
      watch.on('change', async (data) => {
        assert.that(data[0]).is.equalTo(`${key}bla`);
        watch.stopWatching();
        resolve();
      });

      watch.on('error', (err) => {
        assert.that(err.statusCode).is.equalTo(404);
        errCount++;
      });

      setTimeout(() => {
        consul.consul.kv.set({ key: `${key}bla`, value: 'huhu' });
      }, 1000);
    });
    const stop = Date.now();
    assert.that(stop - start).is.between(1000, 1600);
    assert.that(errCount).is.atLeast(1);
  });
});
