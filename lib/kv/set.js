'use strict';

const set = async function ({ key, value, token = this.token }) {
  if (!key) {
    throw new Error('Key is missing.');
  }
  if (!value) {
    throw new Error('Value is missing.');
  }

  if (!key.startsWith('dc/home/env')) {
    key = `dc/home/env/${key}`;
  }

  const result = await this.agent.consul.kv.set({ key, value, token });

  return result;
};

module.exports = set;
