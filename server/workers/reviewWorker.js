const octokit = require("../services/githubService");
const { analyzeCode } = require("../services/aiService");
const { saveReview } = require("../services/storageService");
const { postPRComment } = require("../services/commentService");
const processReviewJob = async (jobData) => {
  const { owner, repo, pull_number } = jobData;

  console.log("📦 Fetching PR files");

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  console.log("🤖 Running AI Review");

  const review = await analyzeCode(files);

  console.log("💾 Saving Review");

  await saveReview({
    owner,
    repo,
    pull_number,
    review,
  });
await postPRComment({
  owner,
  repo,
  pull_number,
  review,
});
  console.log("🎉 Review Finished");
};

module.exports = {
  processReviewJob,
};