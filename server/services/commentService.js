const octokit = require("./githubService");

const postPRComment = async ({
  owner,
  repo,
  pull_number,
  review,
}) => {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: `# 🤖 GitGuard AI Review\n\n${review}`,
  });

  console.log("✅ Comment posted on PR");
};

module.exports = {
  postPRComment,
};