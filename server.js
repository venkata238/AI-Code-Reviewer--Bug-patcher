require("dotenv").config();

const express = require("express");
const verifySignature = require("./middleware/verifyGithubSignature");
const app = express();


// Parse JSON
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Home Route
app.get("/", (req, res) => {
  res.send("GitGuard AI Backend Running");
});


// Secure Webhook Route
app.post("/webhook", verifySignature, (req, res) => {
  console.log("Webhook verified successfully");
  console.log(req.body);

  res.status(200).send("Webhook received securely");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});