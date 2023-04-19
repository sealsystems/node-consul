/* eslint-disable no-empty-function */
'use strict';

const os = require('os');

const inCloud = require('../inCloud');
const lookup = require('./lookup');
const resolveService = require('./resolveService');

const cloud = {
  async connect() {},
  async getHostname() {
    return os.hostname();
  },
  inCloud,
  lookup,
  resolveService
};

['heartbeat', 'pass', 'warn', 'fail'].forEach((status) => {
  cloud[status] = async () => {};
});

cloud.setEnv = async () => {
  return null;
};

[
  'getConfiguration',
  'getMember',
  'getNodes',
  'initialize',
  'setKv',
  'getKvs',
  'delKvs',
  'watchService',
  'watchKv'
].forEach((obsoleteFunction) => {
  cloud[obsoleteFunction] = async () => {
    throw new Error(`Function "${obsoleteFunction}" not supported in cloud environment.`);
  };
});

module.exports = cloud;
