const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../storage/reviews.json");

function readData() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function writeData(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function saveReview(review) {
  const data = readData();
  data.push(review);
  writeData(data);
}

module.exports = { saveReview };