'use strict';

const assert = require('assertthat');
const mockery = require('mockery');
const { nodeenv } = require('nodeenv');

suite('cloud.cloudServicePort', () => {
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

  test('returns default port if not set', async () => {
    // eslint-disable-next-line global-require
    const cloudServicePort = require('../../lib/cloud/cloudServicePort');

    assert.that(cloudServicePort).is.equalTo(3000);
  });

  test('returns port from SERVICE_DISCOVERY_PORT', async () => {
    const restore = nodeenv('SERVICE_DISCOVERY_PORT', '1234');
    // eslint-disable-next-line global-require
    const cloudServicePort = require('../../lib/cloud/cloudServicePort');

    assert.that(cloudServicePort).is.equalTo(1234);

    restore();
  });
});
