const express = require("express");

const router = express.Router();

const { addJob } = require("../queue/reviewQueue");

const {
  isProcessed,
  saveProcessedEvent,
} = require("../services/eventService");

router.post("/review", async (req, res) => {
  try {
    const { owner, repo, pull_number, review } = req.body;

    const eventId =
      req.headers["x-github-delivery"] ||
      `${owner}-${repo}-${pull_number}`;

    // Check required fields
    if (!owner || !repo || !pull_number || !review) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Prevent duplicate processing
    if (isProcessed(eventId)) {
      console.log("⚠️ Duplicate webhook ignored");

      return res.status(200).json({
        success: true,
        message: "Duplicate webhook ignored",
      });
    }

    const job = {
      owner,
      repo,
      pull_number,
      review,
    };

    await addJob(job);

    // Save processed event
    saveProcessedEvent(eventId);

    console.log("✅ Job added to queue");

    // Fast response
    return res.status(200).json({
      success: true,
      message: "Job added to queue",
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;