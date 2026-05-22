require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const connectDatabase = require("./config/database");

const webhookRoutes = require("./routes/webhook");

const app = express();

// Middleware (run top → bottom)
app.use(express.json());
app.use(helmet());
app.use(cors());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Webhook routes
app.use("/webhook", webhookRoutes);

// Error handler (must be last)
app.use(errorHandler);

const port = process.env.PORT || 3000;

async function bootstrap() {
  await connectDatabase();

  app.listen(port, () => {
    logger.info(`GitGuard AI server listening on port ${port}`);
  });
}

bootstrap().catch((err) => {
  logger.error(`Bootstrap failed: ${err.message}`);
  process.exit(1);
});