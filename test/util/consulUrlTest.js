'use strict';

const assert = require('assertthat');
const proxyquire = require('proxyquire');

let readError;
let consulFile;
const consulUrl = proxyquire('../../lib/util/consulUrl', {
  'fs/promises': {
    async readFile() {
      if (readError) {
        throw readError;
      }
      return consulFile;
    }
  }
});

suite('util.consulUrl', () => {
  setup(async () => {
    readError = null;
    consulFile = null;
  });

  test('is a function', async () => {
    assert.that(consulUrl).is.ofType('function');
  });

  test('throws an error if options are missing', async () => {
    try {
      await consulUrl();
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Options are missing.');
    }
  });

  test('throws an error if url is missing', async () => {
    try {
      await consulUrl({});
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('returns given consulUrl', async () => {
    const options = {
      consulUrl: 'https://consul.example.com'
    };

    const result = await consulUrl(options);

    assert.that(result.consulUrl).is.equalTo('https://consul.example.com');
  });

  test('returns given defaultUrl', async () => {
    const options = {
      defaultUrl: 'https://consul.example.com'
    };

    const result = await consulUrl(options);

    assert.that(result.consulUrl).is.equalTo('https://consul.example.com');
  });

  test('throws error if reading config fails', async () => {
    const options = {
      consulConfig: 'bla'
    };
    readError = new Error('Failed to read file.');

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('throws error if config is no json', async () => {
    const options = {
      consulConfig: 'bla'
    };
    consulFile = 'not a json';

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('throws error if config contains no address', async () => {
    const options = {
      consulConfig: 'bla'
    };
    consulFile = '{}';

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('returns address from file', async () => {
    const options = {
      consulConfig: 'bla'
    };
    consulFile = '{"consul": {"address": "address.from.file"}}';

    const result = await consulUrl(options);

    assert.that(result.consulUrl).is.equalTo('https://address.from.file');
  });
});
