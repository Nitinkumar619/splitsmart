import express from 'express';
import protect from '../middleware/auth.js';

const router = express.Router();

router.post('/parse-expense', protect, async (req, res) => {
  try {
    const { prompt, members } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const apiKey = process.env.GEMINI_API_KEY;

    const memberList = members.map((m) => m.name).join(', ');

    const systemPrompt = `You are an expense splitting assistant. Parse the user's natural language description into a structured JSON object.
Group members: ${memberList}
Rules:
1. Identify who paid (paidBy) - match to a member name
2. Identify the total amount
3. Calculate how much each member owes
4. If someone "pays half", they owe 50% of the amount
5. If split "equally among N people", divide amount by N
Return ONLY valid JSON, no markdown:
{"description":"string","amount":number,"paidBy":"name","splitType":"equal","category":"food","splits":[{"name":"member name","amount":number}],"confidence":"high","interpretation":"one sentence"}`;

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
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ message: 'AI parsing failed: ' + err.message });
  }
});

export default router;