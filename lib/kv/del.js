'use strict';

const del = async function ({ key, token = this.token }) {
  if (!key) {
    throw new Error('Key is missing.');
  }

  if (!key.startsWith('dc/home/env')) {
    key = `dc/home/env/${key}`;
  }

  await this.agent.consul.kv.del({ key, token });
};

module.exports = del;
