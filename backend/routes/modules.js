const express = require('express');
const router = express.Router();
const { callOpenRouter } = require('../openrouter');

router.post('/', async (req, res) => {
  const { topic, depth = 'beginner', numModules = 4 } = req.body;

  if (!topic || typeof topic !== 'string') {
    return res.status(400).json({ error: 'topic string is required' });
  }

  // ── Compact prompt — minimal wording to save tokens ──
  const prompt = `Create a ${depth}-level learning curriculum for "${topic}". DO NOT include any emojis in any of the fields.

Return ONLY valid JSON, no markdown fences, no extra text:
{"topic":"${topic}","depth":"${depth}","description":"one sentence","totalTime":"e.g. 2 hours","modules":[]}

Each module in the array must be:
{"id":"module_1","title":"short title","summary":"one sentence","estimatedTime":"e.g. 20 min","difficulty":"${depth}","content":"## Heading\\nExplain concept clearly in 3-5 paragraphs with bullet points.","keyPoints":["point 1","point 2","point 3"],"subtopics":["sub 1","sub 2"]}

Generate exactly ${numModules} modules. Keep each content field under 400 characters. Return complete, valid JSON only.`;

  try {
    const { response, model } = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      { temperature: 0.6, max_tokens: 4096 }
    );

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) throw new Error('Empty response from model');

    const curriculum = parseAndRepairJSON(rawContent, topic, depth);
    curriculum._model = model;
    res.json(curriculum);

  } catch (err) {
    console.error('Module generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Tries multiple strategies to extract valid JSON from model output.
 * Falls back to partial module extraction if JSON is truncated.
 */
function parseAndRepairJSON(raw, topic, depth) {
  // 1. Strip markdown code fences
  let text = raw.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // 2. Direct parse — happy path
  try {
    const result = JSON.parse(text);
    if (result.modules?.length) return result;
  } catch { /* fall through */ }

  // 3. Extract outermost JSON object
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const result = JSON.parse(objMatch[0]);
      if (result.modules?.length) return result;
    } catch { /* fall through */ }
  }

  // 4. JSON truncated — try to salvage complete modules
  console.warn('JSON truncated — attempting repair…');
  const modules = extractCompleteModules(text);

  if (modules.length > 0) {
    console.log(`✂ Salvaged ${modules.length} complete module(s) from truncated response`);
    return {
      topic,
      depth,
      description: `${depth}-level curriculum for ${topic}`,
      totalTime: `${modules.length * 20} min`,
      modules,
      _repaired: true,
    };
  }

  throw new Error('Model returned malformed JSON that could not be repaired. Please try again.');
}

/**
 * Extracts all complete module objects from a partial/truncated JSON string
 * by finding balanced { } pairs after the "modules": [ marker.
 */
function extractCompleteModules(text) {
  const modules = [];

  // Find start of modules array
  const arrStart = text.indexOf('"modules"');
  if (arrStart === -1) return modules;

  const slice = text.slice(arrStart);
  let depth = 0;
  let inString = false;
  let escape = false;
  let objStart = -1;

  for (let i = 0; i < slice.length; i++) {
    const ch = slice[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0 && objStart !== -1) {
        const candidate = slice.slice(objStart, i + 1);
        try {
          const mod = JSON.parse(candidate);
          if (mod.id && mod.title) modules.push(mod);
        } catch { /* skip malformed object */ }
        objStart = -1;
      }
    }
  }

  return modules;
}

module.exports = router;
