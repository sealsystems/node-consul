'use strict';

const connect = require('./connect');
const delKvs = require('../kv/del');
const getConfiguration = require('./getConfiguration');
const getHostname = require('./getHostname');
const getKvs = require('../kv/get');
const getMember = require('./getMember');
const getNodes = require('./getNodes');
const heartbeat = require('./heartbeat');
const inCloud = require('../inCloud');
const initialize = require('./initialize');
const lookup = require('../util/lookup');
const resolveService = require('./resolveService');
const setEnv = require('./setEnv');
const setKv = require('../kv/set');
const watchKv = require('../watch/kv');
const watchService = require('../watch/service');

const consul = {
  connect,
  getConfiguration,
  getHostname,
  getMember,
  getNodes,
  heartbeat,
  inCloud,
  initialize,
  lookup,
  resolveService,

  setEnv,

  setKv,
  getKvs,
  delKvs,

  watchService,
  watchKv
};

['pass', 'warn', 'fail'].forEach((status) => {
  consul[status] = async () => {
    consul.status = status;

    return await consul.heartbeat();
  };
});

module.exports = consul;
