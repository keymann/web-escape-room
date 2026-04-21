(function (global) {
  "use strict";

  const DATA = global.ESCAPE_DATA;
  const STORE = global.ESCAPE_STORE;
  const MECHANICS = global.ESCAPE_MECHANICS;
  const ROOT = document.getElementById("app");

  // ---------- DOM helper ----------
  function h(tag, attrs, children) {
    const el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        const v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") el.className = v;
        else if (k === "text") el.textContent = v;
        else if (k === "html") el.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") {
          el.addEventListener(k.slice(2).toLowerCase(), v);
        } else if (k in el && typeof v !== "object") {
          try {
            el[k] = v;
          } catch (_) {
            el.setAttribute(k, v);
          }
        } else {
          el.setAttribute(k, v);
        }
      });
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null || c === false) return;
        if (typeof c === "string" || typeof c === "number") {
          el.appendChild(document.createTextNode(String(c)));
        } else {
          el.appendChild(c);
        }
      });
    }
    return el;
  }

  function mount(node) {
    ROOT.innerHTML = "";
    ROOT.appendChild(node);
  }

  function formatTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const H = Math.floor(totalSec / 3600);
    const M = Math.floor((totalSec % 3600) / 60);
    const S = totalSec % 60;
    const pad = function (n) {
      return String(n).padStart(2, "0");
    };
    if (H > 0) return H + ":" + pad(M) + ":" + pad(S);
    return pad(M) + ":" + pad(S);
  }

  function typeLabel(type) {
    return (
      { history: "역사", common: "상식", math: "수식", nonsense: "넌센스" }[
        type
      ] || "문제"
    );
  }

  function mechanicLabel(m) {
    return (
      {
        select: "선택",
        keypad: "키패드",
        dial: "다이얼",
        sequence: "순서",
        match: "연결",
        arrange: "배열",
        hotspot: "단서 찾기",
        combine: "조각 결합",
      }[m] || ""
    );
  }

  function pickGame(difficultyId) {
    const all = (DATA.GAMES[difficultyId] || []).filter(function (g) {
      return !g.comingSoon && g.stages && g.stages.length > 0;
    });
    if (all.length === 0) return null;
    if (all.length === 1) return all[0];
    const lastId = STORE.getLastGameId(difficultyId);
    const pool = all.filter(function (g) {
      return g.id !== lastId;
    });
    const source = pool.length > 0 ? pool : all;
    return source[Math.floor(Math.random() * source.length)];
  }

  // ---------- Brand block ----------
  function brandBlock(subtitle) {
    return h("header", { class: "brand" }, [
      h("div", { class: "brand-mark", text: "Korean History Escape" }),
      h("h1", { text: "한국사 방탈출" }),
      h("p", {
        text: subtitle || "고려에서 조선까지, 20개의 문을 열고 이름을 남기세요.",
      }),
    ]);
  }

  // ---------- Screen: Difficulty select ----------
  function renderSelect() {
    const diffs = [
      DATA.DIFFICULTY.easy,
      DATA.DIFFICULTY.normal,
      DATA.DIFFICULTY.hard,
    ];

    const grid = h(
      "div",
      { class: "diff-grid" },
      diffs.map(function (d) {
        const playable =
          !d.comingSoon &&
          (DATA.GAMES[d.id] || []).some(function (g) {
            return !g.comingSoon && g.stages && g.stages.length > 0;
          });
        return h(
          "button",
          {
            class: "diff-card",
            type: "button",
            disabled: !playable,
            onclick: playable
              ? function () {
                  goName(d.id);
                }
              : null,
          },
          [
            h("div", { class: "diff-name" }, [
              d.name,
              h("span", { class: "chip", text: d.subtitle }),
            ]),
            h("div", { class: "diff-desc", text: d.desc }),
            h("div", { class: "diff-meta" }, [
              h("span", { text: "20관문" }),
              h("span", { text: "힌트 " + d.hintsPerRun + "회" }),
              h("span", { text: playable ? "플레이 가능" : "준비 중" }),
            ]),
          ],
        );
      }),
    );

    const rankRow = h(
      "div",
      { class: "btn-row" },
      diffs.map(function (d) {
        const list = STORE.getRankings(d.id);
        return h("button", {
          class: "btn",
          type: "button",
          text: d.name + " 랭킹 (" + list.length + ")",
          onclick: function () {
            renderRanking(d.id);
          },
        });
      }),
    );

    mount(
      h("div", { class: "screen" }, [
        brandBlock(),
        h("section", { class: "panel" }, [
          h("h2", { text: "난이도 선택" }),
          h("p", {
            class: "lead",
            text:
              "각 난이도마다 서로 다른 3개의 방이 준비됩니다. 시작할 방은 무작위로 정해집니다 (직전 플레이한 방은 제외).",
          }),
          grid,
        ]),
        h("section", { class: "panel" }, [
          h("h2", { text: "명예의 전당" }),
          h("p", {
            class: "lead",
            text: "모든 관문을 통과한 완주 기록이 이 기기에 남습니다.",
          }),
          rankRow,
        ]),
        h("div", {
          class: "footer-note",
          text: "© 한국사 방탈출 · 기록은 이 브라우저에만 저장됩니다.",
        }),
      ]),
    );
  }

  // ---------- Screen: Name input ----------
  function goName(difficultyId) {
    const diff = DATA.DIFFICULTY[difficultyId];
    const lastName = STORE.getLastName();
    let errorEl;

    const input = h("input", {
      class: "input",
      type: "text",
      maxlength: 12,
      placeholder: "이름 또는 별명",
      value: lastName,
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: false,
    });

    function onSubmit(e) {
      if (e) e.preventDefault();
      const name = (input.value || "").trim();
      if (!name) {
        errorEl.textContent = "이름을 입력해 주세요.";
        input.focus();
        return;
      }
      if (name.length > 12) {
        errorEl.textContent = "이름은 12자 이내로 입력해 주세요.";
        return;
      }
      STORE.setLastName(name);
      startGame(difficultyId, name);
    }

    const form = h("form", { onsubmit: onSubmit }, [
      h("div", { class: "field" }, [
        h("label", { text: "플레이어 이름" }),
        input,
        (errorEl = h("div", { class: "error" })),
      ]),
      h("div", { class: "btn-row", style: "margin-top:14px;" }, [
        h("button", {
          class: "btn btn-primary",
          type: "submit",
          text: "방으로 입장",
        }),
        h("button", {
          class: "btn btn-ghost",
          type: "button",
          text: "뒤로",
          onclick: function () {
            renderSelect();
          },
        }),
      ]),
    ]);

    mount(
      h("div", { class: "screen" }, [
        brandBlock(),
        h("section", { class: "panel" }, [
          h("h2", { text: diff.name + " · " + diff.subtitle }),
          h("p", {
            class: "lead",
            text:
              "모든 20관문을 통과하면 완주 시간이 랭킹에 오릅니다. 힌트는 총 " +
              diff.hintsPerRun +
              "회, 각 관문에서는 최대 3단계까지 공개됩니다.",
          }),
          form,
        ]),
      ]),
    );
    setTimeout(function () {
      input.focus();
      input.select();
    }, 60);
  }

  // ---------- Game state ----------
  let game = null;
  let tickHandle = null;

  function startGame(difficultyId, name) {
    const diff = DATA.DIFFICULTY[difficultyId];
    const picked = pickGame(difficultyId);
    if (!picked) {
      alert("준비되지 않은 난이도입니다.");
      renderSelect();
      return;
    }
    game = {
      difficulty: diff,
      game: picked,
      name: name,
      stageIdx: 0,
      hintsPoolLeft: diff.hintsPerRun,
      hintsOnStage: 0,
      startedAt: Date.now(),
      wrongCount: 0,
    };
    renderStage();
    startTimer();
  }

  function startTimer() {
    stopTimer();
    tickHandle = setInterval(updateTimer, 250);
    updateTimer();
  }
  function stopTimer() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = null;
  }
  function updateTimer() {
    if (!game) return;
    const el = document.getElementById("hud-timer");
    if (el) el.textContent = formatTime(Date.now() - game.startedAt);
  }

  // ---------- Screen: Stage ----------
  function renderStage() {
    const s = game;
    const stage = s.game.stages[s.stageIdx];
    const total = s.game.stages.length;
    const progressPct = ((s.stageIdx / total) * 100).toFixed(1);

    // HUD
    const hud = h("div", { class: "hud" }, [
      h("div", { class: "hud-left" }, [
        h("div", { class: "hud-stat" }, [
          h("span", { class: "k", text: "플레이어" }),
          h("span", { class: "v", text: s.name }),
        ]),
        h("div", { class: "hud-stat" }, [
          h("span", { class: "k", text: "관문" }),
          h("span", { class: "v", text: s.stageIdx + 1 + " / " + total }),
        ]),
        h("div", { class: "hud-stat" }, [
          h("span", { class: "k", text: "남은 힌트" }),
          h("span", {
            class: "v",
            id: "hud-hints",
            text: s.hintsPoolLeft + " / " + s.difficulty.hintsPerRun,
          }),
        ]),
      ]),
      h("div", { class: "hud-right" }, [
        h("div", { class: "hud-stat timer" }, [
          h("span", { class: "k", text: "경과" }),
          h("span", { class: "v", id: "hud-timer", text: "00:00" }),
        ]),
        h("button", {
          class: "btn btn-ghost",
          type: "button",
          text: "나가기",
          onclick: confirmQuit,
        }),
      ]),
    ]);

    const progress = h("div", { class: "progress" }, [
      h("div", {
        class: "progress-bar",
        style: "width:" + progressPct + "%",
      }),
    ]);

    // Stage header
    const stageHeader = h("div", { class: "stage-header" }, [
      h("div", { class: "topbar" }, [
        h("span", {
          class: "title",
          text: s.game.title + " · " + s.game.tagline,
        }),
      ]),
      h("div", { class: "stage-meta" }, [
        h("span", {
          class: "chip chip-" + stage.type,
          text: typeLabel(stage.type),
        }),
        h("span", {
          class: "chip",
          text: mechanicLabel(stage.mechanic),
        }),
        h("span", { text: "제 " + (s.stageIdx + 1) + " 관문" }),
      ]),
      h("h3", { class: "stage-title", text: stage.title }),
    ]);

    // Step 1: 관찰
    const sceneItems = stage.scene && stage.scene.items ? stage.scene.items : [];
    const observe = h("div", { class: "step step-observe" }, [
      h("div", { class: "step-label", text: "관찰" }),
      stage.scene && stage.scene.text
        ? h("div", { class: "scene-text", text: stage.scene.text })
        : null,
      sceneItems.length
        ? h(
            "div",
            { class: "scene-items" },
            sceneItems.map(function (it) {
              return h("div", { class: "obj" }, [
                h("div", { class: "obj-icon", text: it.icon || "•" }),
                h("div", { class: "obj-label", text: it.label || "" }),
                it.note
                  ? h("div", { class: "obj-note", text: it.note })
                  : null,
              ]);
            }),
          )
        : null,
    ]);

    // Step 2: 추론 (prompt)
    const reason = h("div", { class: "step step-reason" }, [
      h("div", { class: "step-label", text: "추론" }),
      h("div", { class: "prompt-text", text: stage.prompt }),
    ]);

    // Step 3: 조작 (mechanic)
    const manipulate = h("div", { class: "step step-manipulate" }, [
      h("div", { class: "step-label", text: "조작" }),
    ]);
    const mechanicBody = h("div", { class: "mechanic mechanic-" + stage.mechanic });
    manipulate.appendChild(mechanicBody);

    // Hints
    const hintContainer = h("div", { class: "hint-stack" });
    function renderHints() {
      hintContainer.innerHTML = "";
      for (let i = 0; i < s.hintsOnStage; i++) {
        const hintText = (stage.hints && stage.hints[i]) || "(힌트 없음)";
        const label =
          i === 0 ? "관찰 힌트" : i === 1 ? "추론 힌트" : "조작 힌트";
        hintContainer.appendChild(
          h("div", { class: "hint shown" }, [
            h("span", { class: "hint-label", text: label }),
            h("span", { text: hintText }),
          ]),
        );
      }
    }
    renderHints();

    const hintBtn = h("button", {
      class: "btn",
      type: "button",
      onclick: useHint,
    });
    function updateHintBtn() {
      const remainingOnStage = 3 - s.hintsOnStage;
      const poolEmpty = s.hintsPoolLeft <= 0;
      hintBtn.disabled = remainingOnStage <= 0 || poolEmpty;
      hintBtn.textContent =
        "힌트 보기 (" +
        s.hintsOnStage +
        "/3 · 남은 풀 " +
        s.hintsPoolLeft +
        ")";
      const hh = document.getElementById("hud-hints");
      if (hh)
        hh.textContent =
          s.hintsPoolLeft + " / " + s.difficulty.hintsPerRun;
    }
    updateHintBtn();

    function useHint() {
      if (s.hintsOnStage >= 3 || s.hintsPoolLeft <= 0) return;
      s.hintsOnStage += 1;
      s.hintsPoolLeft -= 1;
      renderHints();
      updateHintBtn();
    }

    // Mechanic API
    const stagePanel = h("section", { class: "panel stage-panel" }, [
      stageHeader,
      observe,
      reason,
      manipulate,
      h("div", { class: "btn-row hint-bar" }, [hintBtn]),
      hintContainer,
    ]);

    const api = {
      onSolve: function () {
        stagePanel.classList.add("flash-ok");
        setTimeout(advanceStage, 650);
      },
      onWrong: function () {
        game.wrongCount += 1;
        stagePanel.classList.remove("shake");
        // restart animation
        void stagePanel.offsetWidth;
        stagePanel.classList.add("shake");
      },
    };

    const render = MECHANICS[stage.mechanic];
    if (typeof render === "function") {
      render(mechanicBody, stage, api);
    } else {
      mechanicBody.textContent =
        "지원되지 않는 메커닉: " + stage.mechanic;
    }

    mount(h("div", { class: "screen" }, [hud, progress, stagePanel]));
  }

  function advanceStage() {
    if (!game) return;
    game.stageIdx += 1;
    game.hintsOnStage = 0;
    if (game.stageIdx >= game.game.stages.length) {
      finishGame();
    } else {
      renderStage();
    }
  }

  function finishGame() {
    stopTimer();
    const s = game;
    const timeMs = Date.now() - s.startedAt;
    STORE.setLastGameId(s.difficulty.id, s.game.id);

    const entry = {
      id:
        Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: s.name,
      timeMs: timeMs,
      gameId: s.game.id,
      gameTitle: s.game.title,
      hintsUsed: s.difficulty.hintsPerRun - s.hintsPoolLeft,
      wrongCount: s.wrongCount,
      difficulty: s.difficulty.id,
      at: new Date().toISOString(),
    };
    const rank = STORE.saveRanking(s.difficulty.id, entry);
    renderResult(entry, rank);
    game = null;
  }

  // ---------- Screen: Result ----------
  function renderResult(entry, rank) {
    const hero = h("section", { class: "panel" }, [
      h("div", { class: "result-hero" }, [
        h("div", { class: "badge", text: "CLEAR" }),
        h("h2", {
          text: entry.name + " 님, 20관문을 모두 해제했습니다.",
        }),
        h("div", { class: "result-time", text: formatTime(entry.timeMs) }),
        h("div", {
          class: "result-sub",
          text:
            "방 · " +
            entry.gameTitle +
            " / 힌트 " +
            entry.hintsUsed +
            "회 / 오답 " +
            entry.wrongCount +
            "회",
        }),
        h(
          "div",
          { class: "result-rank" },
          rank > 0
            ? [
                document.createTextNode("현재 "),
                h("strong", {
                  text: DATA.DIFFICULTY[entry.difficulty].name,
                }),
                document.createTextNode(" 난이도 "),
                h("strong", { text: rank + "위" }),
                document.createTextNode(" 에 올랐습니다."),
              ]
            : [document.createTextNode("기록되지 못했습니다.")],
        ),
      ]),
      h("div", { class: "btn-row" }, [
        h("button", {
          class: "btn btn-primary",
          type: "button",
          text: "랭킹 보기",
          onclick: function () {
            renderRanking(entry.difficulty, entry.id);
          },
        }),
        h("button", {
          class: "btn",
          type: "button",
          text: "다시 도전",
          onclick: function () {
            goName(entry.difficulty);
          },
        }),
        h("button", {
          class: "btn btn-ghost",
          type: "button",
          text: "처음 화면",
          onclick: renderSelect,
        }),
      ]),
    ]);

    mount(h("div", { class: "screen" }, [brandBlock("방탈출 성공"), hero]));
  }

  // ---------- Screen: Ranking ----------
  function renderRanking(difficultyId, highlightId) {
    const diff = DATA.DIFFICULTY[difficultyId];
    const list = STORE.getRankings(difficultyId);

    const tabs = h(
      "div",
      { class: "btn-row", style: "margin-bottom:16px;" },
      ["easy", "normal", "hard"].map(function (id) {
        const d = DATA.DIFFICULTY[id];
        const active = id === difficultyId;
        return h("button", {
          class: "btn" + (active ? " btn-primary" : ""),
          type: "button",
          text: d.name,
          onclick: function () {
            renderRanking(id);
          },
        });
      }),
    );

    let body;
    if (list.length === 0) {
      body = h("div", {
        class: "empty",
        text: "아직 기록이 없습니다. 첫 주인공이 되어 보세요.",
      });
    } else {
      const rows = list.map(function (e, i) {
        return h(
          "tr",
          { class: highlightId && e.id === highlightId ? "me" : "" },
          [
            h("td", { class: "rank-pos", text: i + 1 }),
            h("td", { text: e.name }),
            h("td", { class: "rank-time", text: formatTime(e.timeMs) }),
            h("td", { text: e.gameTitle }),
            h("td", {
              text: "힌트 " + e.hintsUsed + " · 오답 " + e.wrongCount,
            }),
          ],
        );
      });
      body = h("div", { class: "table-wrap" }, [
        h("table", { class: "rank-table" }, [
          h("thead", {}, [
            h("tr", {}, [
              h("th", { text: "#" }),
              h("th", { text: "이름" }),
              h("th", { text: "시간" }),
              h("th", { text: "방" }),
              h("th", { text: "비고" }),
            ]),
          ]),
          h("tbody", {}, rows),
        ]),
      ]);
    }

    const canPlay =
      !diff.comingSoon &&
      (DATA.GAMES[difficultyId] || []).some(function (g) {
        return !g.comingSoon && g.stages && g.stages.length > 0;
      });

    const panel = h("section", { class: "panel" }, [
      h("h2", { text: diff.name + " 랭킹" }),
      h("p", {
        class: "lead",
        text: "완주 시간이 짧은 순으로 정렬됩니다.",
      }),
      tabs,
      body,
      h("div", { class: "btn-row", style: "margin-top:16px;" }, [
        h("button", {
          class: "btn btn-primary",
          type: "button",
          text: "도전하기",
          disabled: !canPlay,
          onclick: function () {
            if (!canPlay) {
              alert("이 난이도는 준비 중입니다.");
              return;
            }
            goName(difficultyId);
          },
        }),
        h("button", {
          class: "btn",
          type: "button",
          text: "처음 화면",
          onclick: renderSelect,
        }),
        list.length > 0 &&
          h("button", {
            class: "btn btn-danger",
            type: "button",
            text: "이 난이도 기록 초기화",
            onclick: function () {
              if (
                confirm(diff.name + " 난이도의 모든 기록을 삭제할까요?")
              ) {
                const all = JSON.parse(
                  localStorage.getItem("escape_ranking_v1") || "{}",
                );
                all[difficultyId] = [];
                localStorage.setItem(
                  "escape_ranking_v1",
                  JSON.stringify(all),
                );
                renderRanking(difficultyId);
              }
            },
          }),
      ]),
    ]);

    mount(h("div", { class: "screen" }, [brandBlock("명예의 전당"), panel]));
  }

  // ---------- Quit confirm ----------
  function confirmQuit() {
    const backdrop = h("div", { class: "confirm-backdrop" }, [
      h("div", { class: "confirm" }, [
        h("h3", { text: "정말 나가시겠어요?" }),
        h("p", {
          text: "지금 나가면 현재 진행 상황과 경과 시간이 모두 사라집니다.",
        }),
        h("div", { class: "btn-row" }, [
          h("button", {
            class: "btn btn-danger",
            type: "button",
            text: "나가기",
            onclick: function () {
              stopTimer();
              game = null;
              document.body.removeChild(backdrop);
              renderSelect();
            },
          }),
          h("button", {
            class: "btn",
            type: "button",
            text: "계속 하기",
            onclick: function () {
              document.body.removeChild(backdrop);
            },
          }),
        ]),
      ]),
    ]);
    document.body.appendChild(backdrop);
  }

  // ---------- Boot ----------
  document.addEventListener("DOMContentLoaded", function () {
    renderSelect();
  });
  if (document.readyState !== "loading") renderSelect();
})(window);
