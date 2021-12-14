'use strict';

const os = require('os');

const getConsulId = function ({ name, port, tags = [] }) {
  if (!name) {
    throw new Error('Name is missing.');
  }

  let portSuffix = '',
    tagPrefix = '';

  if (tags.length > 0) {
    tagPrefix = `[${tags.toString()}].`;
  }
  if (port) {
    portSuffix = `:${port}`;
  }

  return `${tagPrefix}${name}@${os.hostname()}${portSuffix}`;
};

module.exports = getConsulId;
