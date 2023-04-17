'use strict';

const assert = require('assertthat');
const mockery = require('mockery');
const nodeenv = require('nodeenv');

suite('cloud.index', () => {
  let cloud;
  let restore;

  setup(async () => {
    mockery.enable({
      useCleanCache: true,
      warnOnUnregistered: false
    });
    restore = nodeenv('SERVICE_DISCOVERY', 'cloud');
    // eslint-disable-next-line global-require
    cloud = require('../../lib/consul');
  });

  teardown(async () => {
    restore();
    mockery.deregisterAll();
    mockery.disable();
  });

  test('is a cloud instance because getKv throws an error', async () => {
    try {
      await cloud.getKvs();
      throw new Error('X');
    } catch (err) {
      assert.that(err.message).is.equalTo('Function "getKvs" not supported in cloud environment.');
    }
  });

  test('setEnv never throws an error', async () => {
    await cloud.setEnv();
  });
});
