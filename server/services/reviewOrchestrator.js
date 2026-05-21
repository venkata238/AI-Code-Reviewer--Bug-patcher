const logger = require('../config/logger');
const githubService = require('../services/githubService');
const diffAnalyzer = require('../services/diffAnalyzer');
const aiService = require('../services/aiService');
const commentService = require('../services/commentService');
const repoSettingsService = require('../services/repoSettingsService');
const rulesEngine = require('../services/rulesEngine');
const reviewRunService = require('../services/reviewRunService');
const reviewInsights = require('../services/reviewInsights');

async function processPR({ headers, body }) {
  let runContext = null;
  const totalStart = Date.now();

  try {
    // ----------------------------
    // 1. Validate GitHub event
    // ----------------------------
    const event = headers['x-github-event'];
    const payload = body;

    if (event !== 'pull_request') {
      return { ok: true, message: 'ignored event' };
    }

    const action = payload.action;
    if (!['opened', 'synchronize', 'reopened'].includes(action)) {
      return { ok: true, message: 'no-op for action' };
    }

    // ----------------------------
    // 2. Extract PR context
    // ----------------------------
    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const prNumber = payload.number;

    const headSha = payload.pull_request?.head?.sha || 'unknown-sha';
    const prTitle = payload.pull_request?.title || '';
    const prAuthor = payload.pull_request?.user?.login || '';

    const prOpenedAtRaw = payload.pull_request?.created_at;
    const prOpenedAt =
      prOpenedAtRaw && !Number.isNaN(new Date(prOpenedAtRaw).getTime())
        ? new Date(prOpenedAtRaw)
        : null;

    runContext = { owner, repo, prNumber, headSha };

    logger.info(`Processing PR ${owner}/${repo}#${prNumber}`);

    // ----------------------------
    // 3. Load repo settings
    // ----------------------------
    const teamSettings = await repoSettingsService.getOrCreateRepoSettings({
      owner,
      repo,
    });

    // ----------------------------
    // 4. Duplicate prevention
    // ----------------------------
    if (teamSettings.rules.enableReplayGuard) {
      const alreadyProcessed = await reviewRunService.hasProcessedHeadSha({
        owner,
        repo,
        prNumber,
        headSha,
      });

      if (alreadyProcessed) {
        await reviewRunService.skipRun({
          owner,
          repo,
          prNumber,
          headSha,
          reason: 'duplicate_head_sha',
        });

        return { ok: true, message: 'skipped duplicate head sha' };
      }
    }

    // ----------------------------
    // 5. Start run tracking
    // ----------------------------
    await reviewRunService.startRun({
      owner,
      repo,
      prNumber,
      action,
      headSha,
      prTitle,
      prAuthor,
      prOpenedAt,
    });

    // ----------------------------
    // 6. Fetch diff
    // ----------------------------
    const diffStart = Date.now();

    const rawDiff = await githubService.fetchPullRequestDiff({
      owner,
      repo,
      pull_number: prNumber,
    });

    const fetchDiffMs = Date.now() - diffStart;

    const diffs = diffAnalyzer.extractChangedHunks(rawDiff);

    // ----------------------------
    // 7. AI + Rules analysis
    // ----------------------------
    const commentsToPost = [];
    const findings = [];
    const seenFingerprints = new Set();

    const llmStart = Date.now();

    const maxHunks = rulesEngine.getMaxHunksPerPR(teamSettings);
    const maxComments = rulesEngine.getMaxCommentsPerPR(teamSettings);

    let analyzedHunks = 0;

    for (const file of diffs) {
      if (!rulesEngine.shouldAnalyzeFile(file.filename, teamSettings)) continue;

      for (const hunk of file.hunks) {
        if (analyzedHunks >= maxHunks || commentsToPost.length >= maxComments) break;

        if (!rulesEngine.shouldAnalyzeHunk(hunk, teamSettings)) continue;

        analyzedHunks++;

        let analysis;

try {
  analysis = await aiService.analyzeHunk({
    filePath: file.filename,
    hunk,
    repo,
    owner,
    teamSettings,
    rulesContext: rulesEngine.buildAiRuleContext(teamSettings),
  });
} catch (err) {
  logger.warn(`AI failed for ${file.filename}: ${err.message}`);
  continue; // skip this hunk and move to next one
}

        if (!rulesEngine.shouldKeepSuggestion(analysis, teamSettings)) continue;

        const fingerprint = reviewInsights.buildFindingFingerprint({
          owner,
          repo,
          prNumber,
          filePath: file.filename,
          title: analysis.title,
          suggestion: analysis.suggestion,
        });

        if (seenFingerprints.has(fingerprint)) continue;
        seenFingerprints.add(fingerprint);

        const severity = analysis.severity || 'medium';

        const riskScore = reviewInsights.computeRiskScore({
          filePath: file.filename,
          severity,
          category: analysis.category || 'correctness',
          changedLines: hunk.changedLines,
        });

        findings.push({
          filePath: file.filename,
          severity,
          category: analysis.category,
          confidence: analysis.confidence ?? 0.65,
          title: analysis.title,
          explanation: analysis.explanation,
          suggestion: analysis.suggestion,
          riskScore,
          fingerprint,
        });

        commentsToPost.push({
          path: file.filename,
          hunk,
          suggestion: analysis.suggestion,
          explanation: analysis.explanation,
          severity,
          riskScore,
        });
      }
    }

    const llmCompletedAt = new Date();
    const llmAnalysisMs = Date.now() - llmStart;

    // ----------------------------
    // 8. Post comments
    // ----------------------------
    const commentStart = Date.now();

    if (commentsToPost.length > 0) {
      await commentService.postComments({
        owner,
        repo,
        pull_number: prNumber,
        comments: commentsToPost,
      });
    }

    const commentPostMs = Date.now() - commentStart;
    const totalMs = Date.now() - totalStart;

    // ----------------------------
    // 9. Final summary
    // ----------------------------
    const summary = reviewInsights.summarizeRun(findings);

    await reviewRunService.completeRun({
      owner,
      repo,
      prNumber,
      headSha,
      payload: {
        timingsMs: {
          fetchDiff: fetchDiffMs,
          llmAnalysis: llmAnalysisMs,
          commentPost: commentPostMs,
          total: totalMs,
        },
        llmCompletedAt,
        filesChanged: diffs.length,
        hunksAnalyzed: analyzedHunks,
        commentsPosted: commentsToPost.length,
        avgRiskScore: summary.avgRiskScore,
        findings,
      },
    });

    // ----------------------------
    // 10. Response
    // ----------------------------
    return {
      ok: true,
      comments: commentsToPost.length,
      metrics: {
        filesChanged: diffs.length,
        hunksAnalyzed: analyzedHunks,
        avgRiskScore: summary.avgRiskScore,
        timingsMs: {
          fetchDiff: fetchDiffMs,
          llmAnalysis: llmAnalysisMs,
          commentPost: commentPostMs,
          total: totalStart ? Date.now() - totalStart : 0,
        },
      },
    };
  } catch (err) {
    if (runContext?.owner) {
      await reviewRunService
        .failRun({
          owner: runContext.owner,
          repo: runContext.repo,
          prNumber: runContext.prNumber,
          headSha: runContext.headSha,
          errorMessage: err.message || 'unknown_error',
          timingsMs: { total: Date.now() - totalStart },
        })
        .catch(() => null);
    }

    throw err;
  }
}

module.exports = { processPR };