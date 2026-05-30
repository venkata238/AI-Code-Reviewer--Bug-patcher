const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  repo: String,
  prNumber: Number,
  review: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);