const crypto = require("crypto");

function verifySignature(req, res, next) {
  const signature = req.headers["x-hub-signature-256"];

  const hmac = crypto.createHmac(
    "sha256",
    process.env.GITHUB_WEBHOOK_SECRET
  );

  const digest = "sha256=" + hmac.update(req.rawBody).digest("hex");

  if (!signature || signature !== digest) {
    return res.status(401).send("Invalid signature");
  }

  console.log("Webhook verified successfully");

  next();
}

module.exports = verifySignature;