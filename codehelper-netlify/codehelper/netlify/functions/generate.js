// netlify/functions/generate.js
//
// Runs on Netlify's server, NOT in the browser. GEMINI_API_KEY lives in
// Netlify's environment variables and is never sent to the client.
//
// One click from the user = ONE call to this function = this function makes
// exactly TWO Gemini requests internally (not repeated, not duplicated):
//   Request 1: title, real-world example, thinking steps, flowchart, concepts, mistakes, golden rule
//   Request 2: the actual Java/Python code (kept separate because code is long,
//              and splitting keeps each individual Gemini request short and reliable)
//
// This also fixes the earlier "unterminated string" JSON bug: code is returned
// as an ARRAY of line-strings, not one giant string with embedded raw newlines.

const MODEL = "gemini-2.5-flash";

const EXPLANATION_PROMPT = `You are a friendly computer science teacher explaining programming to a Class 10-12 average student who finds coding confusing.

Explain the given problem in the SIMPLEST possible way — like explaining to a 14-year-old who has never coded before.

Respond ONLY with a raw JSON object. No markdown, no backticks, just pure JSON. Schema:
{
  "title": "Simple name of the problem",
  "emoji": "one relevant emoji",
  "realWorldExample": "A fun real-world analogy",
  "whatItMeans": "In 1-2 sentences, what does this problem want us to do? Simple words.",
  "thinkingSteps": [
    { "step": 1, "emoji": "emoji", "heading": "Short heading (5 words max)", "explain": "Simple explanation, no jargon" }
  ],
  "flowchart": [
    { "id": 1, "type": "START", "label": "Start" },
    { "id": 2, "type": "INPUT", "label": "What do we take?" },
    { "id": 3, "type": "THINK", "label": "Simple step description" },
    { "id": 4, "type": "CHECK", "label": "Simple yes/no question?", "yes": 5, "no": 6 },
    { "id": 5, "type": "DO", "label": "What to do if yes" },
    { "id": 6, "type": "OUTPUT", "label": "What do we show?" },
    { "id": 7, "type": "END", "label": "End" }
  ],
  "concepts": ["1 to 4 key CS concepts used"],
  "commonMistakes": ["Mistake 1", "Mistake 2"],
  "rememberThis": "One catchy golden rule about this problem"
}

Rules:
- thinkingSteps: 4-6 steps
- flowchart: START to END, minimum 5 nodes, CHECK nodes need yes/no ids
- No technical jargon anywhere without a plain-English explanation in brackets
- Return ONLY the JSON, nothing else`;

const CODE_PROMPT = `You are a friendly computer science teacher writing beginner-friendly code for a Class 10-12 student.

Respond ONLY with a raw JSON object. No markdown, no backticks, just pure JSON. Schema:
{
  "javaCode": ["one line of Java code per array element, each ending with a plain-English comment explaining that line"],
  "pythonCode": ["one line of Python code per array element, each ending with a plain-English comment explaining that line"]
}

Rules:
- javaCode and pythonCode MUST be arrays of strings, one line of code per element — never one big multi-line string
- Every single line needs a comment in plain English (no jargon)
- Only include the language(s) requested
- Return ONLY the JSON, nothing else`;

async function callGemini(apiKey, systemPrompt, userText) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userText }] }],
        generationConfig: { maxOutputTokens: 4096, responseMimeType: "application/json" },
      }),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `Gemini error ${res.status}`);
  }

  const finishReason = data.candidates?.[0]?.finishReason;
  const raw = (data.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(raw);
  } catch (e) {
    if (finishReason === "MAX_TOKENS") {
      throw new Error("Response got cut off (too long). Try again or pick a simpler/shorter problem.");
    }
    throw new Error("Could not read Gemini's response as JSON.");
  }
}

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

    const userText = `Language needed: ${lang}\nProblem: ${question.trim()}`;

    // Exactly two Gemini requests per user click — run sequentially, not in a loop, not repeated.
    const explanation = await callGemini(apiKey, EXPLANATION_PROMPT, userText);
    const code = await callGemini(apiKey, CODE_PROMPT, userText);

    const combined = { ...explanation, ...code };

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(combined),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Server error" }) };
  }
}
