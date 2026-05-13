require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const app = express();
app.use(helmet());
app.use(cors());

app.get("/health", (req, res) => res.json({ status: "ok" }));

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