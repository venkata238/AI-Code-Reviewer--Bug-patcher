require("dotenv").config();
const reviewRoutes = require("./routes/reviewRoutes");
const { analyzeCode } = require("./services/aiService");
const express = require("express");
const morgan = require("morgan");
const octokit = require("./services/githubService");
const { saveReview } = require("./services/storageService");
const errorHandler = require("./middleware/errorHandler");
const { startWorker } = require("./workers/reviewWorker");
const { addJob } = require("./queue/reviewQueue");
//startWorker();
const app = express();

app.use(morgan("dev"));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Routes
app.use("/api", reviewRoutes);

// Home Route
app.get("/", (req, res) => {
  res.send("GitGuard AI Backend Running");
});


// =========================
// WEBHOOK ROUTE (FIXED)
// =========================
app.post("/webhook", async (req, res, next) => {
  try {

    console.log("🔥 WEBHOOK HIT");

    const repo = req.body.repository.name;
    const owner = req.body.repository.owner.login;
    const pull_number = req.body.pull_request.number;

    // create job
    const job = {
      owner,
      repo,
      pull_number,
    };

    // add to queue
    addJob(job);

    console.log("✅ Job added to queue");

    // immediate response
    res.status(200).send("Webhook queued successfully");

  } catch (error) {

    console.log("❌ ERROR:", error.message);

    next(error);
  }
});
// =========================
// TEST ROUTE (OPTIONAL)
// =========================
app.get("/test-save", (req, res) => {
  saveReview({
    pr: 1,
    issues: ["test issue"],
    review: "This is a test"
  });

  res.send("Saved test review");
});


// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 GitGuard AI running on port ${PORT}`);
});