/* eslint-disable no-process-env */
'use strict';

const assert = require('assertthat');

const setEnv = require('../../lib/consul/setEnv');

const basename = function (path) {
  if (path.lastIndexOf('/') === path.length - 1) {
    path = path.slice(0, -1);
  }

  return path.substr(path.lastIndexOf('/') + 1);
};

suite('consul.setEnv', () => {
  let me;
  let options;
  let kvEntries;
  let kvKeyList;
  let kvError;

  setup(async () => {
    kvError = null;
    me = {
      initialize: async () => {
        me.agent = {
          consul: {
            kv: {
              async keys({ key }) {
                if (kvError) {
                  throw kvError;
                }
                if (kvKeyList[key]) {
                  return kvKeyList[key];
                }
                return [];
              },
              async get({ key }) {
                return [
                  {
                    Key: basename(key),
                    Value: kvEntries[basename(key)]
                  }
                ];
              }
            }
          }
        };
      }
    };

    options = {
      consulUrl: 'https://localhost:8500',
      serviceName: 'myService',
      serviceTags: 'myTag'
    };

    kvEntries = {
      X_BLA: 'bla',
      X_BLA2: 'bla2',
      X_BLUB: 'blub',
      X_BLUB2: 'blub2',
      SUBBLA: 'subsubbla'
    };
    kvKeyList = {
      'dc/home/env/service/any/tag/any/': ['X_BLA', 'X_SUB/'],
      'X_SUB/': ['SUBBLA'],
      'dc/home/env/service/any/tag/myTag/': ['X_BLA2'],
      'dc/home/env/service/myService/tag/any/': ['X_BLUB'],
      'dc/home/env/service/myService/tag/myTag/': ['X_BLUB2']
    };

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

  test('is a function.', async () => {
    assert.that(setEnv).is.ofType('function');
  });

  test('throws an error if options are missing.', async () => {
    try {
      await setEnv.call(me);
    } catch (err) {
      assert.that(err.message).is.equalTo('Options are missing.');
    }
  });

  test('throws an error if consul methods throw error', async () => {
    kvError = new Error('Kv error');
    try {
      await setEnv.call(me, options);
    } catch (err) {
      assert.that(err.message).is.equalTo('Kv error');
    }
  });

  test('sets the keys', async () => {
    await setEnv.call(me, options);
    assert.that(process.env.X_BLA).is.equalTo('bla');
    assert.that(process.env.X_BLA2).is.equalTo('bla2');
    assert.that(process.env.X_BLUB).is.equalTo('blub');
    assert.that(process.env.X_BLUB2).is.equalTo('blub2');
    assert.that(process.env.X_SUB_SUBBLA).is.equalTo('subsubbla');
  });

  test('uses initialized agent', async () => {
    await me.initialize();
    me.initialize = async () => {
      throw new Error('Should not be called.');
    };
    await setEnv.call(me, options);
  });
});
