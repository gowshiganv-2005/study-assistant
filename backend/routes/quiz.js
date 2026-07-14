const express = require('express');
const router = express.Router();
const { callOpenRouter } = require('../openrouter');

router.post('/', async (req, res) => {
  const { moduleTitle, content, numQuestions = 5 } = req.body;

  if (!moduleTitle || !content) {
    return res.status(400).json({ error: 'moduleTitle and content are required' });
  }

  const prompt = `You are a quiz designer. Based on the following learning module, create a quiz.

Module Title: ${moduleTitle}
Module Content (excerpt): ${content.substring(0, 2000)}

Generate exactly ${numQuestions} multiple-choice questions. Return ONLY a valid JSON array:
[
  {
    "id": "q1",
    "question": "Clear question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why the correct answer is right"
  }
]

Rules:
- correctIndex is 0-based (0=A, 1=B, 2=C, 3=D)
- Make questions that test understanding, not just memorization
- Distractors should be plausible but clearly wrong
- DO NOT USE ANY EMOJIS anywhere in the response
- Return ONLY the JSON array, no extra text`;

  try {
    const { response } = await callOpenRouter(
      [{ role: 'user', content: prompt }],
      { temperature: 0.6, max_tokens: 2048 }
    );

    const data = await response.json();
    const raw  = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from model');

    let cleaned = raw.trim()
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    let questions;
    try {
      questions = JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) questions = JSON.parse(match[0]);
      else throw new Error('Model returned invalid quiz JSON.');
    }

    res.json({ moduleTitle, questions });
  } catch (err) {
    console.error('Quiz generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
