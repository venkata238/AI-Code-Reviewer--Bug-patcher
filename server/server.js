require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const apiRoutes = require("./routes/apiRoutes");
const errorHandler = require("./middleware/errorHandler");
const { addJob } = require("./queue/reviewQueue");

const app = express();

//const Review = require("./models/Review");

app.use(morgan("dev"));
app.use(cors({
  origin: "*"
}));
app.use(express.json({
  limit: "2mb",
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));

// Routes
app.use("/api", (req, res, next) => {
  console.log("API HIT:", req.method, req.url);
  next();
}, apiRoutes);
// Home
app.get("/", (req, res) => {
  res.send("GitGuard AI Backend Running");
});

// Webhook
app.post("/webhook", async (req, res, next) => {
  try {
    console.log("🔥 WEBHOOK HIT");
console.log("Event Type:", req.headers["x-github-event"]);
console.log("Delivery ID:", req.headers["x-github-delivery"]);
    const repo = req.body?.repository?.name;
    const owner = req.body?.repository?.owner?.login;
    const pull_number = req.body?.pull_request?.number;

    if (!repo || !owner || !pull_number) {
      return res.status(400).send("Invalid webhook payload");
    }

    await addJob({ owner, repo, pull_number });

    console.log("✅ Job added to queue");

    res.status(200).send("Webhook queued successfully");

  } catch (error) {
    console.log("❌ ERROR:", error.message);
    next(error);
  }
});

// Error handler
app.use(errorHandler);

const config = require("./config");

app.listen(config.port, () => {
  console.log(
    `🚀 GitGuard AI running in ${config.environment} mode on port ${config.port}`
  );
});