'use strict';

const flatten = require('lodash/flatten');

const filterByStatus = function ({ status }, nodes, checks) {
  if (!status) {
    throw new Error('Status is missing.');
  }
  if (!nodes) {
    throw new Error('Nodes are missing.');
  }
  if (!checks) {
    throw new Error('Checks are missing.');
  }

  status = flatten([status]);

  const serviceIdsFilteredByStatus = checks
    .filter((check) => status.includes(check.Status))
    .map((check) => check.ServiceID);

  const nodesFilteredByStatus = nodes.filter((node) => serviceIdsFilteredByStatus.includes(node.ServiceID));

  return nodesFilteredByStatus;
};

module.exports = filterByStatus;
