
require("dotenv").config();
const { analyzeCode } = require("./services/aiService");
const express = require("express");
const verifyGithubSignature = require("./middleware/verifyGithubSignature");
const octokit = require("./services/githubService");
const app = express();

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


// Webhook Route
app.post("/webhook", async (req, res) => {
  try {
    // Validate GitHub payload
    if (!req.body || !req.body.repository || !req.body.pull_request) {
      return res.status(400).json({
        error: "Invalid GitHub webhook payload",
      });
    }

    const repo = req.body.repository.name;
    const owner = req.body.repository.owner.login;
    const pull_number = req.body.pull_request.number;

    const files = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    const changedFiles = files.data.map((file) => ({
      filename: file.filename,
      patch: file.patch,
      additions: file.additions,
      deletions: file.deletions,
    }));

    console.log("Repo:", repo);
    console.log("Owner:", owner);
    console.log("PR Number:", pull_number);

    console.log("Changed Files:");
    console.dir(changedFiles, { depth: null });

    const aiResults = await analyzeCode(
      changedFiles,
      owner,
      repo
    );

    console.log("AI REVIEW RESULTS:");
    console.dir(aiResults, { depth: null });

    res.status(200).send("Webhook processed successfully");

  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});