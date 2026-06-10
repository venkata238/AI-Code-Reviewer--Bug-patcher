const { Octokit } = require("@octokit/rest");

const config = require("../config");

const octokit = new Octokit({
  auth: config.githubToken,
});

module.exports = octokit;