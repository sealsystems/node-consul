'use strict';

const getenv = require('@sealsystems/seal-getenv');

const port = getenv.int('SERVICE_DISCOVERY_PORT', 3000);

module.exports = port;
