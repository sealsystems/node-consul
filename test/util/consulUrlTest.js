'use strict';

const path = require('path');

const assert = require('assertthat');
const getenv = require('@sealsystems/seal-getenv');
const proxyquire = require('proxyquire');

let readError;
let consulFile;
let readFileList;
const consulUrl = proxyquire('../../lib/util/consulUrl', {
  'fs/promises': {
    async readFile(filename) {
      readFileList.push(filename);
      if (readError) {
        throw readError;
      }
      return consulFile;
    }
  }
});

suite('util.consulUrl', () => {
  setup(async () => {
    readFileList = [];
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

  test('throws an error if all urls are missing and default file does not exist', async () => {
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
      defaultUrl: 'https://consul2.example.com'
    };

    const result = await consulUrl(options);

    assert.that(result.consulUrl).is.equalTo('https://consul2.example.com');
  });

  test('throws error if reading default config file fails', async () => {
    const options = {};
    readError = new Error('Failed to read file.');

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
      assert.that(readFileList.length).is.equalTo(1);
      if (process.platform === 'win32') {
        assert
          .that(readFileList[0])
          .is.equalTo(path.join(getenv('ProgramData'), 'SEAL Systems', 'config', 'envconsul.json'));
      } else {
        assert.that(readFileList[0]).is.equalTo(path.join(path.sep, 'opt', 'seal', 'etc', 'envconsul.json'));
      }
    }
  });

  test('throws error if reading config file fails', async () => {
    const options = {
      consulConfig: 'bla'
    };
    readError = new Error('Failed to read file.');

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
      assert.that(readFileList.length).is.equalTo(2);
      assert.that(readFileList[0]).is.equalTo('bla');
    }
  });

  test('throws error if config is no json', async () => {
    const options = {};
    consulFile = 'not a json';

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('throws error if config contains no address', async () => {
    const options = {};
    consulFile = '{}';

    try {
      await consulUrl(options);
      throw new Error('X');
    } catch (ex) {
      assert.that(ex.message).is.equalTo('Consul url is missing.');
    }
  });

  test('returns address from file', async () => {
    const options = {};
    consulFile = '{"consul": {"address": "address.from.file"}}';

    const result = await consulUrl(options);

    assert.that(result.consulUrl).is.equalTo('https://address.from.file');
  });
});
