require("dotenv").config();

const express = require("express");

const app = express();

app.use(express.json());


// Home Route
app.get("/", (req, res) => {
  res.send("GitGuard AI Backend Running");
});


// Webhook Route
app.post("/webhook", (req, res) => {
  console.log(req.body);

  res.status(200).send("Webhook received");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});