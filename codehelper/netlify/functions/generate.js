// netlify/functions/generate.js
//
// This runs on Netlify's server, NOT in the user's browser.
// The Gemini API key lives in a Netlify environment variable
// (GEMINI_API_KEY) and is never sent to the client.

const SYSTEM_PROMPT = `You are a friendly computer science teacher explaining programming to a Class 10-12 average student who finds coding confusing.

Your job: Take any programming problem and explain it in the SIMPLEST possible way — like explaining to a 14-year-old who has never coded before.

Respond ONLY with a raw JSON object. No markdown. No backticks. Just pure JSON.

Schema:
{
  "title": "Simple name of the problem",
  "emoji": "one relevant emoji",
  "realWorldExample": "A fun real-world analogy. E.g. 'Think of this like counting mangoes in a basket'",
  "whatItMeans": "In 1-2 sentences, what does this problem want us to do? Use simple words.",
  "thinkingSteps": [
    {
      "step": 1,
      "emoji": "emoji",
      "heading": "Short heading (5 words max)",
      "explain": "Simple explanation a student can understand. No jargon. Like talking to a friend."
    }
  ],
  "flowchart": [
    { "id": 1, "type": "START", "label": "Start" },
    { "id": 2, "type": "INPUT", "label": "What do we take? (e.g. Take a number N)" },
    { "id": 3, "type": "THINK", "label": "Simple step description" },
    { "id": 4, "type": "CHECK", "label": "Simple yes/no question?", "yes": 5, "no": 6 },
    { "id": 5, "type": "DO", "label": "What to do if yes" },
    { "id": 6, "type": "OUTPUT", "label": "What do we show? (e.g. Print the answer)" },
    { "id": 7, "type": "END", "label": "End" }
  ],
  "javaCode": "Clean Java code. Every single line must have a comment in plain English explaining what that line does.",
  "pythonCode": "Clean Python code. Every single line must have a comment in plain English explaining what that line does.",
  "concepts": ["e.g. Loop", "If-Else", "Recursion — list 1 to 4 key CS concepts used"],
  "commonMistakes": ["Mistake students often make 1", "Mistake 2"],
  "rememberThis": "One golden rule to remember about this problem. Keep it catchy and simple."
}

Rules:
- thinkingSteps should have 4-6 steps
- flowchart must go from START to END, minimum 5 nodes
- CHECK nodes must have yes and no pointing to step ids
- Labels in flowchart must be plain English, no code words
- Code comments must explain EVERY line like the student has never seen code before
- No technical jargon anywhere. If you must use a technical word, explain it in brackets
- Return ONLY the JSON`;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { question, lang } = JSON.parse(event.body || "{}");

    if (!question || !question.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing 'question'." }) };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "Server is missing GEMINI_API_KEY." }) };
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            { role: "user", parts: [{ text: `Language: ${lang}\nProblem: ${question}` }] },
          ],
          generationConfig: {
            maxOutputTokens: 2500,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: data?.error?.message || "Gemini API error" }) };
    }

    const raw = (data.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("")
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(raw);

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Server error" }) };
  }
}
