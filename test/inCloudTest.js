/* eslint-disable global-require */
'use strict';

const assert = require('assertthat');
const mockery = require('mockery');
const { nodeenv } = require('nodeenv');

suite('inCloud', () => {
  setup(async () => {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });
  });

  teardown(async () => {
    mockery.deregisterAll();
    mockery.disable();
  });

  test('is a function.', async () => {
    const inCloud = require('../lib/inCloud');

    assert.that(inCloud).is.ofType('function');
  });

  test('returns false if environment is not set', async () => {
    const inCloud = require('../lib/inCloud');

    assert.that(inCloud()).is.false();
  });

  test('returns false if environment is set to consul', async () => {
    const restore = nodeenv('SERVICE_DISCOVERY', 'consul');
    const inCloud = require('../lib/inCloud');

    assert.that(inCloud()).is.false();
    restore();
  });

  test('returns true if environment is set to cloud', async () => {
    const restore = nodeenv('SERVICE_DISCOVERY', 'cloud');
    const inCloud = require('../lib/inCloud');

    assert.that(inCloud()).is.true();
    restore();
  });

  test('throws error if environment has invalid value', async () => {
    const restore = nodeenv('SERVICE_DISCOVERY', 'buhu');
    const inCloud = require('../lib/inCloud');

    try {
      inCloud();
      throw new Error('X');
    } catch (err) {
      assert
        .that(err.message)
        .is.equalTo('Illegal configuration of SERVICE_DISCOVERY, possible values are "cloud", "consul"');
      assert.that(err.code).is.equalTo('IllegalConfiguration');
      assert.that(err.metadata.serviceDiscovery).is.equalTo('buhu');
    }

    restore();
  });
});
