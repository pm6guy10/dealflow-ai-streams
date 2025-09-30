import React, { useMemo, useState, useEffect } from "react";

// DealFlow Starter MVP
// Single-file React app: Paste chat → classify intent → table → CSV export → DM template
// No backend required. Uses localStorage for session persistence.
// Styling via Tailwind (assumed available in Lovable). No external libs.

const Index = () => {
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState([] as ParsedRow[]);
  const [filter, setFilter] = useState<IntentFilter>("all");
  const [dmTemplate, setDmTemplate] = useState(
    "Hey {{handle}}, saw your message about '{{item}}'. I've got it for you here: {{link}} — want me to hold it for you?"
  );
  const [link, setLink] = useState("");

  useEffect(() => {
    // Update page title and meta description for SEO
    document.title = "DealFlow - AI Sales Assistant for Live Stream Sellers | Turn Chat Into Revenue";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'DealFlow transforms chaotic live stream chats into revenue opportunities. AI-powered sales assistant for Whatnot & TikTok Shop sellers. 14-day free trial.');
    }

    const saved = localStorage.getItem("dealflow_last_session");
    if (saved) {
      try {
        const { raw, rows, link, dmTemplate } = JSON.parse(saved);
        setRaw(raw);
        setRows(rows);
        setLink(link || "");
        setDmTemplate(dmTemplate || dmTemplate);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "dealflow_last_session",
      JSON.stringify({ raw, rows, link, dmTemplate })
    );
  }, [raw, rows, link, dmTemplate]);

  type Intent = "buy_intent" | "question" | "chatter" | "unknown";
  type IntentFilter = "all" | Intent;

  type ParsedRow = {
    idx: number;
    ts: string | null;
    handle: string | null;
    message: string;
    item: string | null;
    price: string | null;
    intent: Intent;
  };

  function parse(rawText: string): ParsedRow[] {
    const lines = rawText
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, i) => classifyLine(line, i));
  }

  function classifyLine(line: string, idx: number): ParsedRow {
    const tsMatch = line.match(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
    const ts = tsMatch ? tsMatch[1] : null;
    // Capture a likely handle (platforms vary). Keep simple + permissive.
    const handleMatch = line.match(/@([A-Za-z0-9_\.\-]{3,32})/);

    // Normalize
    const lower = line.toLowerCase();

    // Heuristics
    const buyPhrases = [
      /\b(i'll take|i will take|take it|buy|sold to me|mine|add to cart|ring me up|claim)\b/i,
      /\b(interested|i want this|send invoice)\b/i,
      /\b(dibs|bag it|hold for me)\b/i,
    ];
    const questionPhrases = [
      /\bhow much|price|cost|total\b/i,
      /\bavailable|still have|in stock|restock\b/i,
      /\bshipping|ship to|delivery|when can|eta\b/i,
      /\bcolor|size|variant|blue|red|xl|small\b/i,
      /\bwhere|when|how|link\b/i,
    ];

    let intent: Intent = "chatter";
    if (buyPhrases.some((r) => r.test(line))) intent = "buy_intent";
    else if (questionPhrases.some((r) => r.test(line))) intent = "question";

    // Try to infer item: look for quoted text or after keywords
    let item: string | null = null;
    const quoted = line.match(/["'""'']([^"'""'']{3,120})["'""'']/);
    if (quoted) item = quoted[1].trim();
    if (!item) {
      const afterAbout = line.match(/about\s+([^\$]{3,120})/i);
      if (afterAbout) item = afterAbout[1].trim();
    }

    const priceMatch = line.match(/\$\s?([0-9][0-9,]*(?:\.[0-9]{2})?)/);

    return {
      idx,
      ts,
      handle: handleMatch ? handleMatch[1] : null,
      message: line,
      item,
      price: priceMatch ? priceMatch[1] : null,
      intent,
    };
  }

  function onAnalyze() {
    setRows(parse(raw));
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => (filter === "all" ? true : r.intent === filter));
  }, [rows, filter]);

  function toCSV(rows: ParsedRow[]) {
    const header = [
      "index",
      "timestamp",
      "handle",
      "intent",
      "item",
      "price",
      "message",
    ];
    const data = rows.map((r) => [
      r.idx,
      r.ts || "",
      r.handle || "",
      r.intent,
      r.item || "",
      r.price || "",
      r.message.replace(/"/g, '""'),
    ]);
    const csv = [header.join(","), ...data.map((row) => row.map((v) => `"${String(v)}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dealflow_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyDM(row: ParsedRow) {
    const text = dmTemplate
      .replace(/\{\{handle\}\}/g, row.handle || "there")
      .replace(/\{\{item\}\}/g, row.item || "that item")
      .replace(/\{\{link\}\}/g, link || "<your link>");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 sticky top-0 bg-neutral-950/80 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 grid place-items-center">🅓</div>
            <h1 className="text-xl font-semibold">DealFlow — Missed Buyer Finder</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500" href="#pricing">Start Free Trial</a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Hero />

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">1) Paste your chat log</h2>
              <button
                className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                onClick={() => setRaw(sample)}
              >
                Load sample
              </button>
            </div>
            <textarea
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="Paste raw chat here… one message per line"
              className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm font-mono"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={onAnalyze} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">Analyze</button>
              <button
                onClick={() => {
                  setRaw("");
                  setRows([]);
                }}
                className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <h2 className="font-semibold">2) DM template</h2>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Product or shop link (optional)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2 text-sm"
            />
            <textarea
              value={dmTemplate}
              onChange={(e) => setDmTemplate(e.target.value)}
              className="w-full h-28 bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm"
            />
            <p className="text-xs text-neutral-400">Placeholders: {"{{handle}}"}, {"{{item}}"}, {"{{link}}"}</p>
          </div>
        </section>

        <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="font-semibold">3) Results</h2>
            <div className="flex items-center gap-2">
              <FilterButton label="All" active={filter === "all"} onClick={() => setFilter("all")} />
              <FilterButton label="Buy Intent" active={filter === "buy_intent"} onClick={() => setFilter("buy_intent")} />
              <FilterButton label="Questions" active={filter === "question"} onClick={() => setFilter("question")} />
              <FilterButton label="Chatter" active={filter === "chatter"} onClick={() => setFilter("chatter")} />
              <button
                onClick={() => toCSV(filtered)}
                className="ml-2 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-auto rounded-xl border border-neutral-800">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-950/60">
                <tr className="text-left">
                  <th className="px-3 py-2 w-12">#</th>
                  <th className="px-3 py-2">Handle</th>
                  <th className="px-3 py-2">Intent</th>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Message</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-neutral-400" colSpan={7}>No results yet. Paste chat and click Analyze.</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.idx} className="border-t border-neutral-800">
                      <td className="px-3 py-2 text-neutral-400">{r.idx + 1}</td>
                      <td className="px-3 py-2">{r.handle || <span className="text-neutral-500">—</span>}</td>
                      <td className="px-3 py-2">
                        <span className={
                          "px-2 py-1 rounded-lg text-xs " +
                          (r.intent === "buy_intent"
                            ? "bg-emerald-600/20 text-emerald-300"
                            : r.intent === "question"
                            ? "bg-amber-600/20 text-amber-300"
                            : "bg-neutral-700/40 text-neutral-300")
                        }>
                          {labelForIntent(r.intent)}
                        </span>
                      </td>
                      <td className="px-3 py-2">{r.item || <span className="text-neutral-500">—</span>}</td>
                      <td className="px-3 py-2">{r.price ? `$${r.price}` : <span className="text-neutral-500">—</span>}</td>
                      <td className="px-3 py-2 font-mono text-[12px] leading-5">{r.message}</td>
                      <td className="px-3 py-2">
                        <button onClick={() => copyDM(r)} className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-xs">Copy DM</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section id="pricing" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <h2 className="font-semibold mb-2">Pricing</h2>
          <p className="text-neutral-300 text-sm mb-4">Starter $19.99/mo • 14‑day free trial. Paste chat → instant lead sheet. Upgrade later for auto‑ingest.</p>
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500">Start Free Trial</button>
        </section>

        <footer className="py-10 text-center text-neutral-500 text-sm">© {new Date().getFullYear()} DealFlow</footer>
      </main>
    </div>
  );
};

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-xl text-sm " +
        (active ? "bg-neutral-700" : "bg-neutral-800 hover:bg-neutral-700")
      }
    >
      {label}
    </button>
  );
}

function labelForIntent(i: "buy_intent" | "question" | "chatter" | "unknown") {
  if (i === "buy_intent") return "Buy Intent";
  if (i === "question") return "Question";
  if (i === "chatter") return "Chatter";
  return "Unknown";
}

function Hero() {
  return (
    <section className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-neutral-800 rounded-3xl p-6">
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div className="space-y-3">
          <h2 className="text-3xl md:text-4xl font-semibold leading-tight">Stop Losing Sales in Your Chat</h2>
          <p className="text-neutral-300">Paste your show chat. Get a clean lead sheet in seconds. Follow up with one click.</p>
          <ul className="text-neutral-300 text-sm list-disc pl-5 space-y-1">
            <li>Flags buy intent and high‑value questions</li>
            <li>Exports CSV for your CRM or email list</li>
            <li>One‑click DM templates that auto‑fill</li>
          </ul>
        </div>
        <div className="bg-neutral-900 rounded-2xl p-4 border border-neutral-800">
          <pre className="text-xs text-neutral-300 whitespace-pre-wrap">
{`[07:14] @sneakerfan: I'll take the size 10 if under $120
[07:15] @ana: price on the blue hoodie?
[07:16] @mark22: ship to TX?
[07:17] @host: this sold ship now
[07:18] @sneakerfan: can you hold it?`}
          </pre>
        </div>
      </div>
    </section>
  );
}

const sample = `[07:14] @sneakerfan: I'll take the size 10 if under $120
[07:15] @ana: price on the blue hoodie?
[07:16] @mark22: ship to TX?
[07:17] @host: this sold ship now
[07:18] @sneakerfan: can you hold it?
[07:20] @lindsey__: do you have this in blue?
[07:21] @host: link in bio
[07:22] @bryce-k: dibs on the beanie
[07:23] @mia: is medium available?
[07:24] @kevin: nice stream!`;

export default Index;
