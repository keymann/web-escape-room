(function (global) {
  "use strict";
  const BASE = "/api";

  async function fetchRankings(difficulty) {
    const r = await fetch(
      BASE + "/rankings?difficulty=" + encodeURIComponent(difficulty),
      { headers: { accept: "application/json" } },
    );
    if (!r.ok) throw new Error("HTTP " + r.status);
    const data = await r.json();
    return Array.isArray(data.rankings) ? data.rankings : [];
  }

  async function submitRanking(entry) {
    const r = await fetch(BASE + "/rankings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(entry),
    });
    if (!r.ok) {
      let msg = "HTTP " + r.status;
      try {
        const j = await r.json();
        if (j && j.error) msg += " — " + j.error;
      } catch (_) {}
      const e = new Error(msg);
      e.status = r.status;
      throw e;
    }
    return r.json();
  }

  global.ESCAPE_API = { fetchRankings, submitRanking };
})(window);
