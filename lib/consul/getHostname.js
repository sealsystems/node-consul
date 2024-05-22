'use strict';

const getenv = require('@sealsystems/seal-getenv');

const consulDomain = getenv('CONSUL_DOMAIN', 'consul');
let hostname;

const getHostname = async function (options) {
  if (!this.agent) {
    await this.initialize(options);
  }

  if (hostname) {
    return hostname;
  }

  const data = await this.agent.self();

  hostname = `${data.Config.NodeName}.node.${data.Config.Datacenter}.${consulDomain}`;

  return hostname;
};

module.exports = getHostname;
