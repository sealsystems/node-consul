'use strict';

const path = require('path');

const appRootPath = require('app-root-path');

const packageJson = require(path.join(appRootPath.path, 'package.json'));

const getServiceVersion = function () {
  // Dots are not allowed in domain name, replace it with dash.
  return packageJson.version.replace(/\./g, '-');
};

module.exports = getServiceVersion;
