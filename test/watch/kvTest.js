'use strict';

const assert = require('assertthat');
const host = require('docker-host')().host;
const uuid = require('uuid/v4');

const consul = require('../../lib/consul');

const kvTree = require('../../lib/watch/kv');

suite('watch.kv', () => {
  test('is a function.', async () => {
    assert.that(kvTree).is.ofType('function');
  });

  test('throws an error if service name is missing.', async () => {
    await assert
      .that(async () => {
        await kvTree({});
      })
      .is.throwingAsync('Key is missing.');
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
  });
});
