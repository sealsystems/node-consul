'use strict';

const assert = require('assertthat');
const host = require('docker-host')().host;
const { v4: uuid } = require('uuid');

const consul = require('../../lib/consul');

const service = require('../../lib/watch/service');

suite('watch.service', () => {
  test('is a function.', async () => {
    assert.that(service).is.ofType('function');
  });

  test('throws an error if service name is missing.', async () => {
    await assert
      .that(async () => {
        await service({});
      })
      .is.throwingAsync('Service name is missing.');
  });

  suite('sends notification', () => {
    test('about services that are already running at start.', async function () {
      this.timeout(10000);

      const serviceName = uuid();

      await consul.connect({
        consulUrl: `http://${host}:8500`,
        serviceName,
        serviceUrl: `http://${host}:3000`,
        status: 'pass'
      });

      const watch = consul.watchService({ consulUrl: `http://${host}:8500`, serviceName });

      await new Promise((resolve) => {
        let iteration = 0;

        watch.on('change', (nodes) => {
          iteration++;

          switch (iteration) {
            case 1: {
              assert.that(nodes.length).is.equalTo(1);
              assert.that(nodes[0].host).is.ofType('string');
              assert.that(nodes[0].node).is.ofType('string');
              assert.that(nodes[0].port).is.equalTo(3000);
              resolve();
              break;
            }
            default: {
              // Do nothing.
            }
          }
        });
      });
    });

    test('if an active service fails.', async function () {
      this.timeout(10000);

      const serviceName = uuid();

      await consul.connect({
        consulUrl: `http://${host}:8500`,
        serviceName,
        serviceUrl: `http://${host}:3000`,
        status: 'pass'
      });

      const watch = consul.watchService({ consulUrl: `http://${host}:8500`, serviceName });

      await new Promise((resolve) => {
        let iteration = 0;

        watch.on('change', (nodes) => {
          (async () => {
            iteration++;

            switch (iteration) {
              case 1: {
                assert.that(nodes.length).is.equalTo(1);
                assert.that(nodes[0].host).is.ofType('string');
                assert.that(nodes[0].node).is.ofType('string');
                assert.that(nodes[0].port).is.equalTo(3000);
                // eslint-disable-next-line no-empty-function
                await consul.warn(() => {});
                break;
              }
              case 2: {
                assert.that(nodes.length).is.equalTo(0);
                resolve();
                break;
              }
              default: {
                // Do nothing.
              }
            }
          })();
        });
      });
    });

    test('if a broken service is up again.', async function () {
      this.timeout(10000);

      const serviceName = uuid();

      await consul.connect({
        consulUrl: `http://${host}:8500`,
        serviceName,
        serviceUrl: `http://${host}:3000`
      });

      const watch = consul.watchService({ consulUrl: `http://${host}:8500`, serviceName });

      await new Promise((resolve) => {
        let iteration = 0;

        watch.on('change', (nodes) => {
          (async () => {
            iteration++;

            switch (iteration) {
              case 1: {
                assert.that(nodes.length).is.equalTo(0);
                // eslint-disable-next-line no-empty-function
                await consul.pass(() => {});
                break;
              }
              case 2: {
                assert.that(nodes.length).is.equalTo(1);
                assert.that(nodes[0].host).is.ofType('string');
                assert.that(nodes[0].node).is.ofType('string');
                assert.that(nodes[0].port).is.equalTo(3000);
                resolve();
                break;
              }
              default: {
                // Do nothing.
              }
            }
          })();
        });
      });
    });
  });
});
