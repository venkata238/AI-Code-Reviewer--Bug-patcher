const reviewOrchestrator = require('../services/reviewOrchestrator');

async function handleGithubWebhook(req, res, next) {
  try {
    const result = await reviewOrchestrator.processPR({
      headers: req.headers,
      body: req.body,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleGithubWebhook };