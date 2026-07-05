import { useState } from "react";

const FCOLORS = {
  START:  { bg: "#4ade80", border: "#16a34a", text: "#052e16", icon: "🟢" },
  END:    { bg: "#f87171", border: "#dc2626", text: "#450a0a", icon: "🔴" },
  INPUT:  { bg: "#60a5fa", border: "#2563eb", text: "#0c1a3a", icon: "📥" },
  OUTPUT: { bg: "#c084fc", border: "#9333ea", text: "#2e1065", icon: "📤" },
  THINK:  { bg: "#fde68a", border: "#d97706", text: "#1c0a00", icon: "💭" },
  CHECK:  { bg: "#fb923c", border: "#ea580c", text: "#1c0600", icon: "❓" },
  DO:     { bg: "#34d399", border: "#059669", text: "#022c22", icon: "✅" },
};

function FlowBox({ node, idx, active, onClick }) {
  const c = FCOLORS[node.type] || FCOLORS.THINK;
  const isDiamond = node.type === "CHECK";

  return (
    <div onClick={() => onClick(node)}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
      {idx > 0 && <div style={{ width: 3, height: 22, background: "#cbd5e1" }} />}

      {isDiamond ? (
        <div style={{ position: "relative", width: 160, height: 80, marginTop: 4 }}>
          <div style={{
            position: "absolute", top: 8, left: 20,
            width: 120, height: 60,
            background: active ? "#fff7ed" : c.bg,
            border: `3px solid ${c.border}`,
            transform: "rotate(45deg)", borderRadius: 6,
            boxShadow: active ? `0 0 0 3px ${c.border}55` : "0 2px 8px #0003",
          }} />
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 700, color: c.text,
            textAlign: "center", padding: "0 18px",
          }}>{node.label}</div>
          <div style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#16a34a", fontWeight: 800, whiteSpace: "nowrap" }}>✓ YES ↓</div>
          <div style={{ position: "absolute", top: "38%", right: -32, fontSize: 10, color: "#dc2626", fontWeight: 800, whiteSpace: "nowrap" }}>NO →</div>
        </div>
      ) : (
        <div style={{
          padding: "10px 18px",
          background: active ? "#f0f9ff" : c.bg,
          border: `2.5px solid ${c.border}`,
          borderRadius: node.type === "START" || node.type === "END" ? 50 : 10,
          minWidth: 170, maxWidth: 240,
          textAlign: "center",
          boxShadow: active ? `0 0 0 3px ${c.border}55` : "0 2px 8px #0002",
          transition: "all 0.15s",
        }}>
          <div style={{ fontSize: 13, color: c.text, fontWeight: 700 }}>
            {c.icon} {node.label}
          </div>
        </div>
      )}
    </div>
  );
}

function CodePanel({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", border: "1.5px solid #e2e8f0" }}>
      <div style={{ background: lang === "java" ? "#fff7e6" : "#f0fff4", padding: "8px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #e2e8f0" }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: lang === "java" ? "#92400e" : "#065f46" }}>
          {lang === "java" ? "☕ Java Code" : "🐍 Python Code"}
        </span>
        <button onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={{ background: copied ? "#d1fae5" : "#fff", border: `1px solid ${copied ? "#10b981" : "#d1d5db"}`, color: copied ? "#065f46" : "#6b7280", borderRadius: 6, padding: "3px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px", background: "#1e293b", overflowX: "auto", maxHeight: 400, fontSize: 12.5, lineHeight: 1.8, color: "#e2e8f0", fontFamily: "'Courier New', monospace" }}>
        {code}
      </pre>
    </div>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [lang, setLang] = useState("Both");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeNode, setActiveNode] = useState(null);
  const [tab, setTab] = useState("steps");

  const EXAMPLES = [
    { label: "Factorial", q: "Find the factorial of a number" },
    { label: "Prime Check", q: "Check if a number is prime or not" },
    { label: "Reverse String", q: "Reverse a string" },
    { label: "Largest in Array", q: "Find the largest number in an array" },
    { label: "Fibonacci", q: "Print Fibonacci series up to N terms" },
    { label: "Bubble Sort", q: "Sort an array using bubble sort" },
    { label: "Palindrome", q: "Check if a word is a palindrome" },
    { label: "Sum of Digits", q: "Find sum of digits of a number" },
  ];

  async function generate() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setActiveNode(null);

    try {
      // This calls OUR OWN Netlify function (netlify/functions/generate.js),
      // which holds the real Anthropic API key on the server and never
      // exposes it to the browser. See netlify/functions/generate.js.
      const res = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, lang }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);

      setResult(data);
      setTab("steps");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "steps", label: "🧠 How to Think" },
    { id: "flowchart", label: "📊 Flowchart" },
    { id: "code", label: "💻 Code" },
    { id: "tips", label: "💡 Tips" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1e293b" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", padding: "16px 24px", color: "#fff" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.5px", marginBottom: 3 }}>
              🖥️ CodeHelper <span style={{ background: "#fff2", borderRadius: 6, padding: "2px 10px", fontSize: 14, fontWeight: 600 }}>for Students</span>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              Type any programming problem → Get simple step-by-step explanation + flowchart + code
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, opacity: 0.65, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 2 }}>Created by</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: "0.3px" }}>✦ Kartikey Singh</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Class 10–12 CS Tool</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px" }}>

        {/* Input */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: 20, marginBottom: 20, boxShadow: "0 2px 12px #0001" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 10 }}>
            📝 What problem do you want to understand?
          </div>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.ctrlKey && e.key === "Enter") generate(); }}
            placeholder="e.g.  How to find if a number is even or odd?   or   Write a program to print tables of a number"
            rows={3}
            style={{
              width: "100%", border: "1.5px solid #cbd5e1", borderRadius: 10,
              padding: "12px 14px", fontSize: 14, lineHeight: 1.6,
              outline: "none", resize: "vertical", fontFamily: "inherit",
              boxSizing: "border-box", color: "#1e293b", background: "#f8fafc",
            }}
            onFocus={e => e.target.style.borderColor = "#3b82f6"}
            onBlur={e => e.target.style.borderColor = "#cbd5e1"}
          />

          {/* Language + Button */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Language:</span>
            {["Java", "Python", "Both"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "6px 14px", borderRadius: 8,
                border: `2px solid ${lang === l ? "#3b82f6" : "#e2e8f0"}`,
                background: lang === l ? "#eff6ff" : "#fff",
                color: lang === l ? "#1d4ed8" : "#64748b",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>{l}</button>
            ))}
            <button onClick={generate} disabled={loading || !question.trim()} style={{
              marginLeft: "auto", padding: "10px 24px", borderRadius: 10, border: "none",
              background: (!loading && question.trim()) ? "linear-gradient(135deg,#2563eb,#3b82f6)" : "#e2e8f0",
              color: (!loading && question.trim()) ? "#fff" : "#94a3b8",
              fontSize: 14, fontWeight: 800, cursor: (!loading && question.trim()) ? "pointer" : "not-allowed",
              boxShadow: (!loading && question.trim()) ? "0 3px 12px #3b82f655" : "none",
            }}>
              {loading ? "⏳ Thinking..." : "⚡ Explain It!"}
            </button>
          </div>

          {/* Examples */}
          <div style={{ marginTop: 14, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 600 }}>OR PICK AN EXAMPLE:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {EXAMPLES.map(ex => (
                <button key={ex.label} onClick={() => setQuestion(ex.q)} style={{
                  padding: "5px 13px", borderRadius: 20,
                  border: "1.5px solid #e2e8f0", background: "#fff",
                  color: "#475569", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
                  onMouseOver={e => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#1d4ed8"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                >{ex.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#9f1239", fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 12px #0001" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🤔</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e40af", marginBottom: 8 }}>Understanding your problem…</div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>Breaking it down into simple steps for you!</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              {["Thinking…", "Making flowchart…", "Writing code…"].map((txt, i) => (
                <div key={i} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#1d4ed8", fontWeight: 600, animation: `fadein 0.3s ease ${i * 0.4}s both` }}>{txt}</div>
              ))}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div>
            {/* Title card */}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f0fdf4)", border: "1.5px solid #bfdbfe", borderRadius: 16, padding: "18px 22px", marginBottom: 18, boxShadow: "0 2px 12px #0001" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#1e293b", marginBottom: 10 }}>
                {result.emoji} {result.title}
              </div>
              {result.concepts?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", alignSelf: "center" }}>🏷️ Concepts used:</span>
                  {result.concepts.map((c, i) => {
                    const palette = [
                      { bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
                      { bg: "#f0fdf4", border: "#bbf7d0", color: "#15803d" },
                      { bg: "#fef3c7", border: "#fde68a", color: "#92400e" },
                      { bg: "#fdf4ff", border: "#e9d5ff", color: "#7e22ce" },
                      { bg: "#fff1f2", border: "#fecdd3", color: "#be123c" },
                    ];
                    const p = palette[i % palette.length];
                    return (
                      <span key={i} style={{ padding: "4px 12px", borderRadius: 20, background: p.bg, border: `1.5px solid ${p.border}`, color: p.color, fontSize: 12, fontWeight: 700 }}>
                        {c}
                      </span>
                    );
                  })}
                </div>
              )}
              <div style={{ fontSize: 14, color: "#1d4ed8", fontWeight: 600, marginBottom: 10 }}>
                🎯 What does this problem want?
              </div>
              <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, marginBottom: 12 }}>
                {result.whatItMeans}
              </div>
              <div style={{ background: "#fefce8", border: "1.5px solid #fde68a", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 20 }}>🌟</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 3 }}>REAL LIFE EXAMPLE</div>
                  <div style={{ fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>{result.realWorldExample}</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 0, background: "#fff", borderRadius: "12px 12px 0 0", border: "1.5px solid #e2e8f0", borderBottom: "none", overflow: "hidden" }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, padding: "12px 6px",
                  background: tab === t.id ? "#eff6ff" : "#fff",
                  border: "none",
                  borderBottom: tab === t.id ? "3px solid #2563eb" : "3px solid transparent",
                  color: tab === t.id ? "#1d4ed8" : "#64748b",
                  fontSize: 12, fontWeight: tab === t.id ? 800 : 500,
                  cursor: "pointer",
                }}>{t.label}</button>
              ))}
            </div>

            <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 16px 16px", padding: 22, marginBottom: 20, boxShadow: "0 2px 12px #0001" }}>

              {/* HOW TO THINK */}
              {tab === "steps" && (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 16 }}>
                    🧠 How to think about this problem — step by step
                  </div>
                  {(result.thinkingSteps || []).map((s, i) => (
                    <div key={i} style={{
                      display: "flex", gap: 14, marginBottom: 14,
                      background: i % 2 === 0 ? "#f8fafc" : "#f0fdf4",
                      border: `1.5px solid ${i % 2 === 0 ? "#e2e8f0" : "#bbf7d0"}`,
                      borderRadius: 12, padding: "14px 16px",
                      alignItems: "flex-start",
                    }}>
                      <div style={{
                        minWidth: 38, height: 38,
                        background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                        borderRadius: 10,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: "#fff", fontWeight: 900, flexShrink: 0,
                      }}>{s.emoji || i + 1}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                          Step {s.step}: {s.heading}
                        </div>
                        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.75 }}>
                          {s.explain}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* FLOWCHART */}
              {tab === "flowchart" && (
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
                    📊 Flowchart — the path your program takes
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                    👆 Tap any box to understand what it does
                  </div>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    {/* Chart */}
                    <div style={{ flex: "1 1 200px", overflowY: "auto", maxHeight: 560 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingBottom: 16 }}>
                        {(result.flowchart || []).map((node, i) => (
                          <FlowBox key={node.id} node={node} idx={i} active={activeNode?.id === node.id} onClick={setActiveNode} />
                        ))}
                      </div>
                    </div>

                    {/* Detail */}
                    <div style={{ flex: "1 1 220px" }}>
                      {activeNode ? (
                        <div style={{ background: "#f8fafc", border: `2px solid ${FCOLORS[activeNode.type]?.border || "#e2e8f0"}`, borderRadius: 14, padding: 18 }}>
                          <div style={{ fontSize: 22, marginBottom: 6 }}>{FCOLORS[activeNode.type]?.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            {activeNode.type === "CHECK" ? "Decision Box" : activeNode.type === "THINK" ? "Process Box" : activeNode.type === "DO" ? "Action Box" : activeNode.type}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 10 }}>{activeNode.label}</div>
                          {activeNode.type === "START" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>This is where our program begins! Every program starts from here.</div>}
                          {activeNode.type === "END" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>Our program is done! We stop here after getting our answer.</div>}
                          {activeNode.type === "INPUT" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>📥 <b>Input means:</b> We are asking the user to give us some information to work with.</div>}
                          {activeNode.type === "OUTPUT" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>📤 <b>Output means:</b> We are showing the final answer to the user on screen.</div>}
                          {activeNode.type === "THINK" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>💭 <b>Process means:</b> The computer is doing some calculation or work here behind the scenes.</div>}
                          {activeNode.type === "DO" && <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>✅ <b>Action means:</b> We are doing something specific here — like saving a value or updating a count.</div>}
                          {activeNode.type === "CHECK" && (
                            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                              ❓ <b>Decision means:</b> The computer asks a YES or NO question here.<br /><br />
                              <span style={{ color: "#16a34a", fontWeight: 700 }}>If YES →</span> it goes to step {activeNode.yes}<br />
                              <span style={{ color: "#dc2626", fontWeight: 700 }}>If NO →</span> it goes to step {activeNode.no}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ background: "#f8fafc", border: "1.5px dashed #cbd5e1", borderRadius: 14, padding: 24, textAlign: "center", color: "#94a3b8" }}>
                          <div style={{ fontSize: 32, marginBottom: 8 }}>👆</div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>Tap any box in the flowchart to understand what it means!</div>
                        </div>
                      )}

                      {/* Simple legend */}
                      <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>WHAT DO THE COLORS MEAN?</div>
                        {[
                          ["START / END", "#4ade80", "🟢", "Where program begins or ends"],
                          ["INPUT", "#60a5fa", "📥", "Taking information from user"],
                          ["PROCESS / DO", "#fde68a", "💭", "Doing some calculation"],
                          ["DECISION", "#fb923c", "❓", "A yes/no question"],
                          ["OUTPUT", "#c084fc", "📤", "Showing result to user"],
                        ].map(([name, color, icon, desc]) => (
                          <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                            <div style={{ width: 12, height: 12, background: color, borderRadius: 3, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "#475569" }}><b>{icon} {name}</b> — {desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CODE */}
              {tab === "code" && (
                <div>
                  <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#78350f" }}>
                    💡 <b>Tip:</b> Every line has a comment (the part after <code>//</code> or <code>#</code>) that explains what that line does in plain English!
                  </div>
                  {result.javaCode && (lang === "Java" || lang === "Both") && (
                    <div style={{ marginBottom: 16 }}>
                      <CodePanel code={result.javaCode} lang="java" />
                    </div>
                  )}
                  {result.pythonCode && (lang === "Python" || lang === "Both") && (
                    <CodePanel code={result.pythonCode} lang="python" />
                  )}
                </div>
              )}

              {/* TIPS */}
              {tab === "tips" && (
                <div>
                  {/* Golden rule */}
                  {result.rememberThis && (
                    <div style={{ background: "linear-gradient(135deg, #fef3c7, #fde68a)", border: "2px solid #f59e0b", borderRadius: 14, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 32 }}>⭐</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#92400e", marginBottom: 4 }}>GOLDEN RULE TO REMEMBER</div>
                        <div style={{ fontSize: 15, color: "#78350f", fontWeight: 600, lineHeight: 1.6 }}>{result.rememberThis}</div>
                      </div>
                    </div>
                  )}

                  {/* Common mistakes */}
                  {result.commonMistakes?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 12 }}>
                        ⚠️ Common mistakes students make
                      </div>
                      {result.commonMistakes.map((m, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                          <span style={{ fontSize: 18, flexShrink: 0 }}>❌</span>
                          <div style={{ fontSize: 13, color: "#9f1239", lineHeight: 1.7 }}>{m}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e2e8f0", padding: "48px 24px", textAlign: "center", boxShadow: "0 2px 12px #0001" }}>
            <div style={{ fontSize: 56, marginBottom: 14 }}>🖥️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>Ready to help you understand coding!</div>
            <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
              Type any programming problem above.<br />
              We'll break it down into <b>simple steps</b>, show you a <b>flowchart</b>, and give you the <b>code with explanations</b>.
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        textarea { transition: border-color 0.2s; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
}
