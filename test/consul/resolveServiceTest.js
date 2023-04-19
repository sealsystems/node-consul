'use strict';

const assert = require('assertthat');
const proxyquire = require('proxyquire');
const { v4: uuid } = require('uuid');

const consul = require('../../lib/consul');
const resolveService = require('../../lib/consul/resolveService');

let resolveResults;
let resolveResultIndex;
const mockedResolveService = proxyquire('../../lib/consul/resolveService', {
  '../util/dnsWrapper': {
    async resolveSrv() {
      if (resolveResults[resolveResultIndex]) {
        if (resolveResults[resolveResultIndex].err) {
          throw resolveResults[resolveResultIndex++].err;
        }

        return resolveResults[resolveResultIndex++].result;
      }

      return [];
    }
  }
});

suite('consul.resolveService', () => {
  const serviceName = uuid();
  const servicePort = 3000;

  setup(async () => {
    consul.retryOptions = {
      retries: 5,
      minTimeout: 0.1 * 1000,
      maxTimeout: 0.2 * 1000,
      factor: 2,
      randomize: true
    };

    resolveResults = [];
    resolveResultIndex = 0;
  });

  test('is a function.', async () => {
    assert.that(resolveService).is.ofType('function');
  });

  test('throws an error if service name is missing.', async () => {
    await assert
      .that(async () => {
        await resolveService();
      })
      .is.throwingAsync('Service name is missing.');
  });

  test('returns list of hosts', async () => {
    resolveResults = [
      {
        err: null,
        result: [
          {
            name: 'node1.node.dc1.consul',
            port: servicePort
          }
        ]
      }
    ];

    const addresses = await mockedResolveService.call(consul, serviceName);

    assert.that(addresses).is.ofType('array');
    assert.that(addresses[0].name).is.equalTo('node1.node.dc1.consul');
    assert.that(addresses[0].port).is.equalTo(servicePort);
  });

  test('returns empty array if service is not available', async () => {
    const addresses = await mockedResolveService.call(consul, 'hugo');

    assert.that(addresses).is.ofType('array');
    assert.that(addresses.length).is.equalTo(0);
  });

  test('retries after failure', async () => {
    resolveResults = [
      {
        err: new Error('resolve error')
      },
      {
        err: null,
        result: [{ address: 'localhost', port: 4712 }]
      }
    ];

    const addresses = await mockedResolveService.call(consul, 'hugo');

    assert.that(addresses).is.equalTo(resolveResults[1].result);
  });

  test('does not retry in case of ENODATA response', async () => {
    const errNoData = new Error('Service not found');

    errNoData.code = 'ENODATA';
    resolveResults = [
      {
        err: errNoData
      }
    ];

    await assert
      .that(async () => {
        await mockedResolveService.call(consul, 'hugo');
      })
      .is.throwingAsync((e) => e === errNoData);
  });

  test('gives up after 5 retries', async () => {
    resolveResults = [
      {
        err: new Error('resolve error 1')
      },
      {
        err: new Error('resolve error 2')
      },
      {
        err: new Error('resolve error 3')
      },
      {
        err: new Error('resolve error 4')
      },
      {
        err: new Error('resolve error 5')
      },
      {
        err: new Error('resolve error 6')
      }
    ];

    await assert
      .that(async () => {
        await mockedResolveService.call(consul, 'hugo');
      })
      .is.throwingAsync((e) => e === resolveResults[5].err);
  });
});
