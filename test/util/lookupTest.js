'use strict';

const assert = require('assertthat');
const proxyquire = require('proxyquire');

const lookup = require('../../lib/util/lookup');

let resolveResults;
let resolveResultIndex;
const mockedLookup = proxyquire('../../lib/util/lookup', {
  './dnsWrapper': {
    async resolve() {
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

suite('util.lookup', () => {
  let consul;

  setup(async () => {
    consul = {
      retryOptions: {
        retries: 5,
        minTimeout: 0.1 * 1000,
        maxTimeout: 0.2 * 1000,
        factor: 2,
        randomize: true
      }
    };

    resolveResults = [];
    resolveResultIndex = 0;
  });

  test('is a function.', async () => {
    assert.that(lookup).is.ofType('function');
  });

  test('throws an error if hostname is missing.', async () => {
    await assert
      .that(async () => {
        await lookup();
      })
      .is.throwingAsync('Hostname is missing.');
  });

  test('returns ip address of host', async () => {
    resolveResults = [
      {
        err: null,
        result: ['127.0.0.1']
      }
    ];
    const ip = await mockedLookup.call(consul, 'hugo.local');

    assert.that(ip).is.equalTo('127.0.0.1');
  });

  test('returns error if service is not available', async () => {
    await assert
      .that(async () => {
        await mockedLookup.call(consul, 'hugo');
      })
      .is.throwingAsync('No addresses found');
  });

  test('retries after failure', async () => {
    resolveResults = [
      {
        err: new Error('resolve error')
      },
      {
        err: null,
        result: ['127.0.0.1']
      }
    ];

    const ip = await mockedLookup.call(consul, 'hugo');

    assert.that(ip).is.equalTo('127.0.0.1');
  });

  test('gives up after 5 retries', async function () {
    this.timeout(5 * 1000);
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
        await mockedLookup.call(consul, 'hugo');
      })
      .is.throwingAsync((e) => e === resolveResults[5].err);
  });
});
