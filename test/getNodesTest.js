'use strict';

const assert = require('assertthat');
const host = require('docker-host')().host;
const uuid = require('uuidv4');

const consul = require('../lib/consul');
const getNodes = require('../lib/getNodes');

suite('getNodes', () => {
  const serviceName = uuid();

  suiteSetup(async () => {
    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName,
      serviceUrl: `http://${host}:2999`
    });
  });

  test('is a function.', async () => {
    assert.that(getNodes).is.ofType('function');
  });

  test('test', async () => {
    const nodes = await consul.getNodes({ service: serviceName });

    assert.that(nodes).is.not.falsy();
    assert.that(nodes).is.ofType('array');
    assert.that(nodes.length).is.greaterThan(0);
  });
});
