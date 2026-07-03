import express from 'express';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/parse-expense', protect, async (req, res) => {
  try {
    const { prompt, members } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const apiKey = process.env.GEMINI_API_KEY;

    const memberList = members.map((m) => m.name).join(', ');

    const systemPrompt = `Parse this expense into JSON only. Members: ${memberList}
Return ONLY this JSON, no extra text:
{"description":"string","amount":number,"paidBy":"name","splitType":"equal","category":"other","splits":[{"name":"member","amount":number}],"confidence":"high","interpretation":"string"}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\nUser input: "' + prompt + '"' }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2000 }
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ message: data.error?.message || 'Gemini error' });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    // Extract JSON more robustly - find the first { and last }
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(500).json({ message: 'AI did not return valid JSON' });
    }
    const clean = text.slice(jsonStart, jsonEnd + 1);
    const parsed = JSON.parse(clean);
    // Sanitize splitType
    if (!['equal', 'custom', 'percentage'].includes(parsed.splitType)) {
      parsed.splitType = 'custom';
    }

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ message: 'AI parsing failed: ' + err.message });
  }
});

export default router;