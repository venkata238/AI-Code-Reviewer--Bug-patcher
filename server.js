const octokit = require("./services/githubService");
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
app.post("/webhook", verifySignature, async (req, res) => {
  try {
    const repo = req.body.repository.name;
    const owner = req.body.repository.owner.login;
    const pull_number = req.body.pull_request.number;

    const files = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    console.log("Repo:", repo);
    console.log("Owner:", owner);
    console.log("PR Number:", pull_number);
    console.log(files.data);

    res.status(200).send("Webhook received securely");
  } catch (error) {
    console.error("Error fetching PR files:", error);
    res.status(500).send("Internal Server Error");
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});