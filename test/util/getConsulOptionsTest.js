'use strict';

const assert = require('assertthat');
const nodeenv = require('nodeenv');
const proxyquire = require('proxyquire');

let keystore;
const getConsulOptions = proxyquire('../../lib/util/getConsulOptions', {
  'seal-tlscert': {
    get () {
      return keystore;
    }
  }
});

suite('getConsulOptions', () => {
  setup(() => {
    keystore = null;
  });

  test('is a function', (done) => {
    assert.that(getConsulOptions).is.ofType('function');
    done();
  });

  test('throws an error if options are missing', (done) => {
    assert.that(() => {
      getConsulOptions();
    }).is.throwing('Options are missing.');
    done();
  });

  test('throws an error if Consul url is missing', (done) => {
    assert.that(() => {
      getConsulOptions({});
    }).is.throwing('Consul url is missing.');
    done();
  });

  test('returns an error if protocol of Consul url is unknown', (done) => {
    assert.that(() => {
      getConsulOptions({ consulUrl: 'foo://localhost:8500' });
    }).is.throwing('Wrong protocol in consul url provided.');
    done();
  });

  test('sets token and host.', (done) => {
    keystore = {};

    const options = getConsulOptions({
      consulUrl: 'https://foo',
      token: 'foo'
    });

    assert.that(options.defaults).is.equalTo({ token: 'foo' });
    assert.that(options.host).is.equalTo('foo');
    done();
  });

  suite('TLS parameter \'secure\'', () => {
    test('is set if TLS_UNPROTECTED is \'none\'.', (done) => {
      const restore = nodeenv('TLS_UNPROTECTED', 'none');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      assert.that(getConsulOptions({ consulUrl: 'https://foo' }).secure).is.true();
      restore();
      done();
    });

    test('is set if TLS_UNPROTECTED is \'loopback\'.', (done) => {
      const restore = nodeenv('TLS_UNPROTECTED', 'loopback');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      assert.that(getConsulOptions({ consulUrl: 'https://foo' }).secure).is.true();
      restore();
      done();
    });

    test('is not set if TLS_UNPROTECTED is \'world\'.', (done) => {
      const restore = nodeenv('TLS_UNPROTECTED', 'world');

      keystore = {
        cert: 'cert',
        key: 'key'
      };

      assert.that(getConsulOptions({ consulUrl: 'https://foo' }).secure).is.undefined();
      restore();
      done();
    });
  });

  suite('CA certificate', () => {
    test('is added.', (done) => {
      const restore = nodeenv('TLS_UNPROTECTED', 'none');

      keystore = {
        ca: 'ca',
        cert: 'cert',
        key: 'key'
      };

      const options = getConsulOptions({ consulUrl: 'https://foo' });

      assert.that(options.ca).is.equalTo(['ca']);
      assert.that(options.secure).is.true();

      restore();
      done();
    });
  });
});
