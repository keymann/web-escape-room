import { getStore } from "@netlify/blobs";

const KNOWN_DIFFS = ["easy", "normal", "hard"];
const KNOWN_GAMES = new Set([
  "easy-goryeo",
  "easy-joseon",
  "easy-hanyang",
]);
const MAX_STORED = 100;
const MAX_RETURNED = 50;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function sanitizeName(s) {
  const str = String(s == null ? "" : s);
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) continue;
    if (code >= 0x200b && code <= 0x200d) continue;
    if (code === 0xfeff) continue;
    out += str[i];
  }
  return out.replace(/\s+/g, " ").trim().slice(0, 12);
}

function intInRange(v, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const r = Math.floor(n);
  if (r < min || r > max) return null;
  return r;
}

function orderEntries(list) {
  list.sort((a, b) => {
    if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
    const ta = a.at || "";
    const tb = b.at || "";
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return 0;
  });
  return list;
}

export default async (req) => {
  const store = getStore({ name: "rankings-v1" });
  const url = new URL(req.url);

  if (req.method === "GET") {
    const diff = url.searchParams.get("difficulty");
    if (!KNOWN_DIFFS.includes(diff)) {
      return json({ error: "bad difficulty" }, 400);
    }
    const raw = (await store.get(diff, { type: "json" })) || [];
    const list = Array.isArray(raw) ? raw.slice() : [];
    orderEntries(list);
    return json({ rankings: list.slice(0, MAX_RETURNED) });
  }

  if (req.method === "POST") {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: "bad json" }, 400);
    }

    const difficulty = String(body.difficulty || "");
    if (!KNOWN_DIFFS.includes(difficulty)) {
      return json({ error: "bad difficulty" }, 400);
    }

    const gameId = String(body.gameId || "");
    if (!KNOWN_GAMES.has(gameId)) {
      return json({ error: "unknown gameId" }, 400);
    }

    const name = sanitizeName(body.name);
    if (!name) return json({ error: "empty name" }, 400);

    const timeMs = intInRange(body.timeMs, 30000, 24 * 60 * 60 * 1000);
    if (timeMs == null) return json({ error: "bad timeMs" }, 400);

    const hintsUsed = intInRange(body.hintsUsed, 0, 50) ?? 0;
    const wrongCount = intInRange(body.wrongCount, 0, 9999) ?? 0;
    const gameTitle = String(body.gameTitle || "").slice(0, 40);

    const entry = {
      id:
        Math.random().toString(36).slice(2, 10) +
        Date.now().toString(36),
      name,
      timeMs,
      hintsUsed,
      wrongCount,
      gameId,
      gameTitle,
      difficulty,
      at: new Date().toISOString(),
    };

    const raw = (await store.get(difficulty, { type: "json" })) || [];
    const list = Array.isArray(raw) ? raw.slice() : [];
    list.push(entry);
    orderEntries(list);
    const trimmed = list.slice(0, MAX_STORED);
    await store.setJSON(difficulty, trimmed);

    const rankIdx = trimmed.findIndex((e) => e.id === entry.id);
    return json({
      entry,
      rank: rankIdx === -1 ? -1 : rankIdx + 1,
      rankings: trimmed.slice(0, MAX_RETURNED),
    });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/rankings" };
