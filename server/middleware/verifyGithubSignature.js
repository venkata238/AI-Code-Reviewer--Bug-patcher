const crypto = require("crypto");
const config = require("../config");
function verifyGithubSignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];

  const hmac = crypto.createHmac(
    "sha256",
config.githubWebhookSecret
  );

  const digest =
    "sha256=" +
    hmac.update(JSON.stringify(req.body)).digest("hex");

  if (signature !== digest) {
    return res.status(401).send("Invalid signature");
  }

  next();
}

module.exports = verifyGithubSignature;