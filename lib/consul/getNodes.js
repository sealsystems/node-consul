'use strict';

const filterByStatus = require('../util/filterByStatus');

const getNodes = async function (options) {
  options.token = options.token || this.token;

  const nodes = await this.agent.consul.catalog.service.nodes(options);

  if (!options.status || !nodes) {
    return nodes;
  }

  const checks = await this.agent.consul.health.checks(options);

  return filterByStatus(options, nodes, checks);
};

module.exports = getNodes;
