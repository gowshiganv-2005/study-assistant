const express = require('express');
const router = express.Router();
const { callOpenRouter } = require('../openrouter');

router.post('/', async (req, res) => {
  const { messages, moduleContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  const systemPrompt = `You are an expert, friendly study assistant helping a student learn.
${moduleContext ? `The student is currently studying: ${moduleContext}` : ''}
Provide clear, concise, and accurate answers. Use examples when helpful. Format your responses with markdown for readability. DO NOT USE ANY EMOJIS in your replies.`;

  // Build messages — inject system prompt as first user turn (compatible with all models)
  const openRouterMessages = [
    { role: 'user', content: systemPrompt + '\n\n---\n\n' + (messages[0]?.content || '') },
    ...messages.slice(1).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  try {
    // Set SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const { response } = await callOpenRouter(openRouterMessages, {
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') { res.write(`data: ${JSON.stringify({ done: true })}\n\n`); break; }
        try {
          const parsed = JSON.parse(raw);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
        } catch { /* skip malformed */ }
      }
    }

    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
