(function (global) {
  "use strict";

  const KEY_RANKING = "escape_ranking_v1";
  const KEY_LAST_GAME = "escape_last_game_v1";
  const KEY_LAST_NAME = "escape_last_name_v1";
  const MAX_ENTRIES_PER_DIFF = 50;

  function safeParse(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function readRankings() {
    return safeParse(localStorage.getItem(KEY_RANKING), {});
  }

  function writeRankings(all) {
    try {
      localStorage.setItem(KEY_RANKING, JSON.stringify(all));
    } catch (_) {}
  }

  function getRankings(difficultyId) {
    const all = readRankings();
    return Array.isArray(all[difficultyId]) ? all[difficultyId] : [];
  }

  // Returns the 1-based position of the inserted entry, or -1 if not placed.
  function saveRanking(difficultyId, entry) {
    const all = readRankings();
    const list = Array.isArray(all[difficultyId]) ? all[difficultyId] : [];
    list.push(entry);
    list.sort(function (a, b) {
      return a.timeMs - b.timeMs;
    });
    const trimmed = list.slice(0, MAX_ENTRIES_PER_DIFF);
    all[difficultyId] = trimmed;
    writeRankings(all);
    const pos = trimmed.findIndex(function (e) {
      return e.id === entry.id;
    });
    return pos === -1 ? -1 : pos + 1;
  }

  function getLastGameId(difficultyId) {
    const raw = safeParse(localStorage.getItem(KEY_LAST_GAME), {});
    return raw[difficultyId] || null;
  }

  function setLastGameId(difficultyId, gameId) {
    const raw = safeParse(localStorage.getItem(KEY_LAST_GAME), {}) || {};
    raw[difficultyId] = gameId;
    try {
      localStorage.setItem(KEY_LAST_GAME, JSON.stringify(raw));
    } catch (_) {}
  }

  function getLastName() {
    try {
      return localStorage.getItem(KEY_LAST_NAME) || "";
    } catch (_) {
      return "";
    }
  }

  function setLastName(name) {
    try {
      localStorage.setItem(KEY_LAST_NAME, name);
    } catch (_) {}
  }

  global.ESCAPE_STORE = {
    getRankings,
    saveRanking,
    getLastGameId,
    setLastGameId,
    getLastName,
    setLastName,
  };
})(window);
