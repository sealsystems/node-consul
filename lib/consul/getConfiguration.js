'use strict';

let configuration;

const getConfiguration = async function () {
  if (!this.agent) {
    throw new Error('Agent not initialized.');
  }

  if (configuration) {
    return configuration;
  }

  const data = await this.agent.self();

  configuration = data.Config;

  return configuration;
};

module.exports = getConfiguration;
