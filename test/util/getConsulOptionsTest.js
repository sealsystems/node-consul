'use strict';

const assert = require('assertthat');
const { nodeenv } = require('nodeenv');
const proxyquire = require('proxyquire');

let keystore;
const getConsulOptions = proxyquire('../../lib/util/getConsulOptions', {
  '@sealsystems/tlscert': {
    async get() {
      return keystore;
    }
  }
});

suite('util.getConsulOptions', () => {
  setup(async () => {
    keystore = null;
  });

  test('is a function', async () => {
    assert.that(getConsulOptions).is.ofType('function');
  });

  test('throws an error if Consul url is missing', async () => {
    await assert
      .that(async () => {
        await getConsulOptions({});
      })
      .is.throwingAsync('Consul url is missing.');
  });

  test('returns an error if protocol of Consul url is unknown', async () => {
    await assert
      .that(async () => {
        await getConsulOptions({ consulUrl: 'foo://localhost:8500' });
      })
      .is.throwingAsync('Wrong protocol in consul url provided.');
  });

  suite("TLS parameter 'secure'", () => {
    test("is set if TLS_UNPROTECTED is 'none'.", async () => {
      const restore = nodeenv('TLS_UNPROTECTED', 'none');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      const options = await getConsulOptions({ consulUrl: 'https://foo' });

      assert.that(options.secure).is.true();
      restore();
    });

    test("is set if TLS_UNPROTECTED is 'loopback'.", async () => {
      const restore = nodeenv('TLS_UNPROTECTED', 'loopback');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      const options = await getConsulOptions({ consulUrl: 'https://foo' });

      assert.that(options.secure).is.true();
      restore();
    });

    test("is not set if TLS_UNPROTECTED is 'world'.", async () => {
      const restore = nodeenv('TLS_UNPROTECTED', 'world');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      const options = await getConsulOptions({ consulUrl: 'https://foo' });

      assert.that(options.secure).is.undefined();
      restore();
    });
  });

  // eslint-disable-next-line mocha/no-async-describe
  suite('a given CA certificate is added.', async () => {
    const restore = nodeenv('TLS_UNPROTECTED', 'none');

    keystore = {
      ca: 'ca',
      cert: 'cert',
      key: 'key'
    };

    const options = await getConsulOptions({ consulUrl: 'https://foo' });

    assert.that(options.ca).is.equalTo(['ca']);
    assert.that(options.secure).is.true();
    restore();
  });
});
