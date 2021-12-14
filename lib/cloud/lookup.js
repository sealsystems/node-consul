'use strict';

const lookup = async function (hostname) {
  if (!hostname) {
    throw new Error('Hostname is missing.');
  }

  return hostname;
};

module.exports = lookup;
