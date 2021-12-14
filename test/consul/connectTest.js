'use strict';

const assert = require('assertthat');

const consul = require('../../lib/consul');

const host = require('docker-host')().host;

suite('consul.connect', () => {
  setup(async () => {
    consul.retryOptions = {
      retries: 5,
      minTimeout: 0.1 * 1000,
      maxTimeout: 0.2 * 1000,
      factor: 2,
      randomize: true
    };
  });

  test('is a function.', async () => {
    assert.that(consul.connect).is.ofType('function');
  });

  test('throws an error if options are missing.', async () => {
    await assert
      .that(async () => {
        await consul.connect();
      })
      .is.throwingAsync('Options are missing.');
  });

  test('throws an error if service name is missing.', async () => {
    await assert
      .that(async () => {
        await consul.connect({
          consulUrl: 'http://foo:8500',
          serviceUrl: 'http://bar:1234'
        });
      })
      .is.throwingAsync('Service name is missing.');
  });

  test('throws an error if service url is missing.', async () => {
    await assert
      .that(async () => {
        await consul.connect({
          consulUrl: 'http://foo:8500',
          serviceName: 'bar'
        });
      })
      .is.throwingAsync('Service url is missing.');
  });

  test('throws an error if consul url is missing.', async () => {
    await assert
      .that(async () => {
        await consul.connect({
          serviceName: 'foo',
          serviceUrl: 'http://bar:1234'
        });
      })
      .is.throwingAsync('Consul url is missing.');
  });

  test('stores the host and port of the service as provided in options.serviceUrl.', async function () {
    this.timeout(10000);

    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'foo',
      serviceUrl: `http://${host}:3000`
    });

    const checkHost = function () {
      // Special treatment for localhost
      if (host === 'localhost') {
        return consul.options.address === '127.0.0.1';
      }

      return consul.options.address === host;
    };

    assert.that(checkHost()).is.true();
  });

  test('stores given service tags.', async () => {
    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'foo',
      serviceTags: ['tag1', 'tag2'],
      serviceUrl: `bar://${host}:3000`
    });

    assert.that(consul.options.tags.length).is.equalTo(3);
    assert.that(consul.options.tags[0]).is.equalTo('tag1');
    assert.that(consul.options.tags[1]).is.equalTo('tag2');
    // eslint-disable-next-line global-require
    assert.that(consul.options.tags[2]).is.equalTo(require('../../package.json').version.replace(/\./g, '-'));
  });

  test('ignores empty service tags.', async () => {
    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'foo',
      serviceTags: ['tag', ''],
      serviceUrl: `bar://${host}:3000`
    });

    assert.that(consul.options.tags.length).is.equalTo(2);
    assert.that(consul.options.tags[0]).is.equalTo('tag');
    // eslint-disable-next-line global-require
    assert.that(consul.options.tags[1]).is.equalTo(require('../../package.json').version.replace(/\./g, '-'));
  });

  test('does not set address if there is no hostname in "serviceUrl".', async function () {
    this.timeout(60 * 1000);

    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'foo',
      serviceUrl: 'http://:3000'
    });

    assert.that(consul.options.address).is.undefined();
    assert.that(consul.options.port).is.equalTo(3000);
  });
});
