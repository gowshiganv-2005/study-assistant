/**
 * openrouter.js
 * Shared helper — calls OpenRouter with automatic model fallback.
 * Respects retry_after_seconds from 429 responses before trying next model.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getModels() {
  const primary   = process.env.OPENROUTER_MODEL || 'openrouter/auto';
  const fallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || '')
    .split(',').map(m => m.trim()).filter(Boolean);
  return [primary, ...fallbacks];
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Parse retry-after from OpenRouter 429 body (if present).
 * Returns milliseconds to wait, or a default.
 */
function getRetryWait(body, defaultMs = 5000) {
  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const secs = parsed?.error?.metadata?.retry_after_seconds;
    if (secs && typeof secs === 'number') {
      console.log(`⏳ Retry-After: ${secs}s`);
      return Math.min(secs * 1000, 30000); // cap at 30s
    }
  } catch { /* ignore */ }
  return defaultMs;
}

/**
 * Call OpenRouter with automatic fallback across models.
 * @param {object[]} messages - OpenAI-format messages array
 * @param {object}   cfg      - { temperature, max_tokens, top_p, stream }
 * @returns {Promise<{ response: Response, model: string }>}
 */
async function callOpenRouter(messages, cfg = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in backend/.env');

  const models = getModels();
  let lastError = null;

  for (const model of models) {
    try {
      console.log(`🔄 Trying model: ${model}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        console.warn(`⏱ Model "${model}" timed out after 60s — trying next…`);
      }, 60000);

      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost',
          'X-Title': 'StudyAI Assistant',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: cfg.temperature ?? 0.7,
          top_p:       cfg.top_p       ?? 0.9,
          max_tokens:  cfg.max_tokens  ?? 1024,
          stream:      cfg.stream      ?? false,
        }),
      });

      clearTimeout(timeout);

      // ── 429 Rate Limited → respect retry_after then try next ──
      if (response.status === 429) {
        const body = await response.text();
        const waitMs = getRetryWait(body);
        console.warn(`⚠ "${model}" rate-limited. Waiting ${waitMs}ms then trying next…`);
        lastError = new Error(`${model}: 429 rate-limited`);
        await sleep(waitMs);
        continue;
      }

      // ── 404 Unavailable → skip immediately ──
      if (response.status === 404) {
        const body = await response.text();
        console.warn(`⚠ "${model}" returned 404 — skipping. ${body.slice(0, 120)}`);
        lastError = new Error(`${model}: 404 unavailable`);
        await sleep(500);
        continue;
      }

      // ── Other HTTP errors ──
      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${body}`);
      }

      console.log(`✅ Using model: ${model}`);
      return { response, model };

    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = new Error(`${model}: timed out`);
        console.warn(`⚠ "${model}" aborted — trying next…`);
        continue;
      }
      if (err.message.startsWith('OpenRouter error')) throw err; // non-retriable
      lastError = err;
      console.warn(`⚠ "${model}" failed: ${err.message} — trying next…`);
      await sleep(500);
    }
  }

  throw lastError || new Error('All models failed or are rate-limited. Please try again in a moment.');
}

module.exports = { callOpenRouter, getModels };
