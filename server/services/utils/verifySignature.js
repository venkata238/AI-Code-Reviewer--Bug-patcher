const crypto = require("crypto");

function verifySignature(signature, payload, secret) {
  const sigHash = signature.split("=")[1];

  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const sigBuffer = Buffer.from(sigHash, "hex");
  const digestBuffer = Buffer.from(expectedHash, "hex");

  if (sigBuffer.length !== digestBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, digestBuffer);
}

module.exports = verifySignature;