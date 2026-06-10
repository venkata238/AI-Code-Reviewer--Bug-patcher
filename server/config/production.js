module.exports = {
  port: process.env.PORT || 3000,

  githubToken: process.env.GITHUB_TOKEN,

  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,

  environment: "production",
};