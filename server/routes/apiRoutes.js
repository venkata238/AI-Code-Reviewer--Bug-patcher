const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// -------------------- FILE PATHS --------------------
const reviewsPath = path.join(__dirname, "../storage/reviews.json");
const settingsPath = path.join(__dirname, "../storage/settings.json");

// -------------------- HELPER --------------------
const readJSON = (filePath, fallback) => {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

// -------------------- 1. GET ALL REVIEWS --------------------
router.get("/reviews", (req, res) => {
  const reviews = readJSON(reviewsPath, []);

  res.json({
    success: true,
    data: reviews,
  });
});

// -------------------- 2. GET SINGLE REVIEW --------------------
router.get("/reviews/:id", (req, res) => {
  const reviews = readJSON(reviewsPath, []);
const review = reviews.find(
  (r) => r.pr === Number(req.params.id)
);
  if (!review) {
    return res.status(404).json({
      success: false,
      message: "Review not found",
    });
  }

  res.json({
    success: true,
    data: review,
  });
});

// -------------------- 3. SAVE SETTINGS --------------------
router.post("/settings", (req, res) => {
  try {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify(req.body, null, 2)
    );

    res.json({
      success: true,
      message: "Settings saved",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;