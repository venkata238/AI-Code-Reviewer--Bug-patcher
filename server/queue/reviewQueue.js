const queue = [];

function addJob(job) {
  queue.push(job);

  console.log("✅ Job added");
}

function getNextJob() {
  return queue.shift();
}

module.exports = {
  addJob,
  getNextJob,
};