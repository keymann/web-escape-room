(function (global) {
  "use strict";

  const KEY_PENDING = "escape_pending_v1";
  const KEY_LAST_GAME = "escape_last_game_v1";
  const KEY_LAST_NAME = "escape_last_name_v1";

  function read(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (!v) return fallback;
      return JSON.parse(v);
    } catch (_) {
      return fallback;
    }
  }
  function write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
  }

  function getPending(difficultyId) {
    const all = read(KEY_PENDING, {});
    const list = all && all[difficultyId];
    return Array.isArray(list) ? list : [];
  }

  function getAllPending() {
    const all = read(KEY_PENDING, {}) || {};
    const out = [];
    Object.keys(all).forEach(function (k) {
      if (Array.isArray(all[k])) {
        all[k].forEach(function (e) {
          out.push(e);
        });
      }
    });
    return out;
  }

  function addPending(entry) {
    if (!entry || !entry.id || !entry.difficulty) return;
    const all = read(KEY_PENDING, {}) || {};
    const list = Array.isArray(all[entry.difficulty])
      ? all[entry.difficulty]
      : [];
    list.push(entry);
    all[entry.difficulty] = list;
    write(KEY_PENDING, all);
  }

  function removePending(entryId) {
    const all = read(KEY_PENDING, {}) || {};
    let changed = false;
    Object.keys(all).forEach(function (k) {
      if (!Array.isArray(all[k])) return;
      const before = all[k].length;
      all[k] = all[k].filter(function (e) {
        return e.id !== entryId;
      });
      if (all[k].length !== before) changed = true;
    });
    if (changed) write(KEY_PENDING, all);
  }

  function getLastGameId(difficultyId) {
    const r = read(KEY_LAST_GAME, {}) || {};
    return r[difficultyId] || null;
  }

  function setLastGameId(difficultyId, gameId) {
    const r = read(KEY_LAST_GAME, {}) || {};
    r[difficultyId] = gameId;
    write(KEY_LAST_GAME, r);
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
    getPending,
    getAllPending,
    addPending,
    removePending,
    getLastGameId,
    setLastGameId,
    getLastName,
    setLastName,
  };
})(window);
