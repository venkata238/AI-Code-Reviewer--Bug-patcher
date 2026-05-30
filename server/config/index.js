require("dotenv").config();

module.exports = {
  environment: process.env.NODE_ENV || "development",

  port: process.env.PORT || 3000,

  githubToken: process.env.GITHUB_TOKEN,

  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
};