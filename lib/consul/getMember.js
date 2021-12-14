'use strict';

let member;

const getMember = async function () {
  if (!this.agent) {
    throw new Error('Agent not initialized.');
  }

  if (member) {
    return member;
  }

  const data = await this.agent.self();

  member = data.Member;

  return member;
};

module.exports = getMember;
