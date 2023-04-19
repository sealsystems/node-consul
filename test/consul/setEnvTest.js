/* eslint-disable no-process-env */
'use strict';

const assert = require('assertthat');
const host = require('docker-host')().host;
const { v4: uuid } = require('uuid');

const consul = require('../../lib/consul');

const setEnv = require('../../lib/consul/setEnv');

suite('consul.setEnv', () => {
  let options;

  suiteSetup(async () => {
    await consul.connect({
      consulUrl: `http://${host}:8500`,
      serviceName: 'test',
      serviceUrl: `http://${host}:3000`,
      status: 'pass'
    });

    options = {
      consulUrl: 'https://localhost:8500',
      serviceName: 'test',
      serviceTags: 'myTag',
      basePath: `${uuid()}/`
    };

    await consul.consul.kv.set({ key: `${options.basePath}dc/home/env/service/any/tag/any/X_BLA`, value: 'bla' });
    await consul.consul.kv.set({
      key: `${options.basePath}dc/home/env/service/any/tag/any/X_SUB/SUBBLA`,
      value: 'subsubbla'
    });
    await consul.consul.kv.set({ key: `${options.basePath}dc/home/env/service/any/tag/myTag/X_BLA2`, value: 'bla2' });
    await consul.consul.kv.set({
      key: `${options.basePath}dc/home/env/service/test/tag/any/X_BLUB`,
      value: 'blub'
    });
    await consul.consul.kv.set({
      key: `${options.basePath}dc/home/env/service/test/tag/myTag/X_BLUB2`,
      value: 'blub2'
    });
  });

  setup(async () => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('X_')) {
        delete process.env[key];
      }
    }
  });

  teardown(async () => {
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('X_')) {
        delete process.env[key];
      }
    }
  });

  suiteTeardown(async () => {
    await consul.consul.kv.del({ key: options.basePath, recurse: true });
  });

  test('is a function.', async () => {
    assert.that(setEnv).is.ofType('function');
  });

  test('throws an error if options are missing.', async () => {
    try {
      await consul.setEnv();
    } catch (err) {
      assert.that(err.message).is.equalTo('Options are missing.');
    }
  });

  test('throws an error if consul methods throw error', async () => {
    const orig = consul.consul.kv.keys;
    consul.consul.kv.keys = async () => {
      throw new Error('Kv error');
    };

    try {
      await consul.setEnv(options);
    } catch (err) {
      assert.that(err.message).is.equalTo('Kv error');
    }

    consul.consul.kv.keys = orig;
  });

  test('sets the keys', async () => {
    await consul.setEnv(options);
    assert.that(process.env.X_BLA).is.equalTo('bla');
    assert.that(process.env.X_BLA2).is.equalTo('bla2');
    assert.that(process.env.X_BLUB).is.equalTo('blub');
    assert.that(process.env.X_BLUB2).is.equalTo('blub2');
    assert.that(process.env.X_SUB_SUBBLA).is.equalTo('subsubbla');
  });

  test('initializes consul', async () => {
    const origC = consul.consul;
    const origI = consul.initialize;
    let initCalled = false;

    delete consul.consul;
    consul.initialize = async () => {
      consul.consul = origC;
      consul.initialize = origI;
      initCalled = true;
    };
    await consul.setEnv(options);

    assert.that(initCalled).is.true();
  });
});
