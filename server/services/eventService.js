const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../storage/processedEvents.json");

// Read processed events
function getProcessedEvents() {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Check if already processed
function isProcessed(eventId) {
  const events = getProcessedEvents();
  return events.includes(eventId);
}

// Save processed event
function saveProcessedEvent(eventId) {
  const events = getProcessedEvents();

  events.push(eventId);

  fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
}

module.exports = {
  isProcessed,
  saveProcessedEvent,
};