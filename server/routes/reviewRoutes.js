const express = require("express");

const router = express.Router();
const { addJob } = require("../queue/reviewQueue");
router.post("/review", async (req, res) => {
  try {
    const { owner, repo, pull_number, review } = req.body;

    // Check required fields
    if (!owner || !repo || !pull_number || !review) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const job = {
  owner,
  repo,
  pull_number,
  review,
};

await addJob(job);

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