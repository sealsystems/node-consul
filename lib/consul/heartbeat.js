'use strict';

const heartbeat = async function () {
  const options = this.options.check;

  options.token = options.token || this.token;

  await this.agent.check[this.status](options);
};

module.exports = heartbeat;
