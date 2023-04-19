'use strict';

const assert = require('assertthat');
const proxyquire = require('proxyquire');

const initialize = proxyquire('../../lib/consul/initialize', {
  consul() {
    return {};
  }
});

suite('consul.initialize', () => {
  test('is a function.', async () => {
    assert.that(initialize).is.ofType('function');
  });

  test("throws an error if Consul's url is missing.", async () => {
    await assert
      .that(async () => {
        await initialize({});
      })
      .is.throwingAsync('Consul url is missing.');
  });
});
