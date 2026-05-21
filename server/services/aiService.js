const groqClient = require('./clients/groqClient');

const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const DEPRECATED_GROQ_MODELS = new Set(['mixtral-8x7b-32768']);

async function analyzeHunk({
  filePath,
  hunk,
  owner,
  repo,
  teamSettings = {},
  rulesContext = {},
}) {
  const prompt = `You are GitGuard AI reviewing ${owner}/${repo}.

Find bugs/security flaws in this added code.

Return ONLY valid JSON with keys:
- title: string
- severity: low|medium|high|critical
- category: security|performance|correctness|maintainability
- confidence: number 0-1
- suggestion: string (must include corrected code block)
- explanation: markdown bullets

Rules:
- ${rulesContext.strictInstruction || 'Focus on practical issues.'}
- ${rulesContext.securityInstruction || 'Include security guidance only when relevant.'}
- Tone: ${rulesContext.tone || 'human'}

Repo settings:
${JSON.stringify(teamSettings)}

File: ${filePath}
Hunk: ${hunk.header}

Added code:
${hunk.changedLines.join('\n') || '(none)'}

Patch:
${hunk.patchLines.join('\n')}`;

  try {
    const res = await groqClient.post('/openai/v1/chat/completions', {
      model: getGroqModel(),
      messages: [
        { role: 'system', content: 'You are a helpful code reviewer.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const text = res.data.choices?.[0]?.message?.content || '';
    const parsed = safeJsonParse(text);

    if (parsed) return normalize(parsed);

    return normalize({
      suggestion: text,
      explanation: '',
    });
  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      console.error('⏱ Groq timeout for:', filePath);
    } else {
      console.error('❌ Groq error:', err.message);
    }

    return null; // important: fail safely
  }
}