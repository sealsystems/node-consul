'use strict';

const get = async function ({ key, token = this.token }) {
  if (!key) {
    throw new Error('Key is missing.');
  }

  if (!key.startsWith('dc/home/env')) {
    key = `dc/home/env/${key}`;
  }

  const keys = await this.agent.consul.kv.get({ key, token });

  return keys;
};

module.exports = get;
