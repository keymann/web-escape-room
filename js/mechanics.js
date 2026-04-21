(function (global) {
  "use strict";

  // Small DOM helper — same pattern used in app.js
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

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function feedbackBox() {
    return h("div", { class: "m-feedback" });
  }

  function ok(el, msg) {
    el.textContent = msg || "열쇠가 맞습니다.";
    el.className = "m-feedback ok";
  }
  function bad(el, msg) {
    el.textContent = msg || "맞지 않습니다.";
    el.className = "m-feedback bad";
  }
  function info(el, msg) {
    el.textContent = msg || "";
    el.className = "m-feedback";
  }

  // ---------- SELECT ----------
  function renderSelect(container, stage, api) {
    const cfg = stage.config;
    const fb = feedbackBox();

    const grid = h(
      "div",
      { class: "m-select-grid" },
      cfg.options.map(function (opt) {
        return h(
          "button",
          {
            type: "button",
            class: "m-card",
            onclick: function () {
              if (opt.id === stage.solution) {
                ok(fb, "정답입니다.");
                api.onSolve();
              } else {
                bad(fb, "그 사람은 아닙니다. 다시 살펴보라.");
                api.onWrong();
              }
            },
          },
          [
            h("div", { class: "m-card-label", text: opt.label }),
            opt.detail
              ? h("div", { class: "m-card-detail", text: opt.detail })
              : null,
          ],
        );
      }),
    );

    container.appendChild(grid);
    container.appendChild(fb);
  }

  // ---------- KEYPAD ----------
  function renderKeypad(container, stage, api) {
    const len = stage.config.length || stage.solution.length;
    const sol = String(stage.solution);
    let buf = "";
    const fb = feedbackBox();

    const display = h("div", { class: "m-keypad-display" });
    function renderDisplay() {
      display.innerHTML = "";
      for (let i = 0; i < len; i++) {
        const cell = h("div", {
          class: "m-keypad-cell" + (i < buf.length ? " on" : ""),
          text: i < buf.length ? buf[i] : "",
        });
        display.appendChild(cell);
      }
    }
    renderDisplay();

    function press(d) {
      if (buf.length >= len) return;
      buf += d;
      info(fb, "");
      renderDisplay();
      if (buf.length === len) {
        setTimeout(attempt, 220);
      }
    }
    function back() {
      if (!buf.length) return;
      buf = buf.slice(0, -1);
      info(fb, "");
      renderDisplay();
    }
    function clearBuf() {
      buf = "";
      info(fb, "");
      renderDisplay();
    }
    function attempt() {
      if (buf === sol) {
        ok(fb, "잠금이 해제됩니다.");
        api.onSolve();
      } else {
        bad(fb, "맞지 않습니다. 다시 시도하라.");
        api.onWrong();
        setTimeout(clearBuf, 500);
      }
    }

    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "←", "0", "C"];
    const pad = h(
      "div",
      { class: "m-keypad-pad" },
      keys.map(function (k) {
        return h("button", {
          type: "button",
          class: "m-key" + (k === "←" || k === "C" ? " m-key-util" : ""),
          text: k,
          onclick: function () {
            if (k === "←") back();
            else if (k === "C") clearBuf();
            else press(k);
          },
        });
      }),
    );

    container.appendChild(display);
    container.appendChild(pad);
    container.appendChild(fb);
  }

  // ---------- DIAL ----------
  function renderDial(container, stage, api) {
    const cfg = stage.config;
    const digits = cfg.digits;
    const symbols =
      typeof cfg.symbols === "string"
        ? cfg.symbols.split("")
        : Array.isArray(cfg.symbols) && cfg.symbols.length
          ? cfg.symbols
          : "0123456789".split("");
    const cursor = new Array(digits).fill(0);
    const fb = feedbackBox();

    const wheels = [];
    for (let i = 0; i < digits; i++) {
      const valEl = h("div", { class: "m-dial-val", text: symbols[0] });
      const upBtn = h("button", {
        type: "button",
        class: "m-dial-btn",
        text: "▲",
      });
      const dnBtn = h("button", {
        type: "button",
        class: "m-dial-btn",
        text: "▼",
      });
      (function (idx) {
        upBtn.addEventListener("click", function () {
          cursor[idx] = (cursor[idx] + 1) % symbols.length;
          valEl.textContent = symbols[cursor[idx]];
          info(fb, "");
        });
        dnBtn.addEventListener("click", function () {
          cursor[idx] =
            (cursor[idx] - 1 + symbols.length) % symbols.length;
          valEl.textContent = symbols[cursor[idx]];
          info(fb, "");
        });
      })(i);
      wheels.push(h("div", { class: "m-dial-wheel" }, [upBtn, valEl, dnBtn]));
    }

    const wheelsRow = h("div", { class: "m-dial-row" }, wheels);
    const sol = String(stage.solution);

    const unlock = h("button", {
      type: "button",
      class: "btn btn-primary btn-block",
      text: "🔓 잠금 해제",
      onclick: function () {
        const entered = cursor.map(function (c) {
          return symbols[c];
        }).join("");
        if (entered === sol) {
          ok(fb, "자물쇠가 풀립니다.");
          api.onSolve();
        } else {
          bad(fb, "자물쇠가 움직이지 않는다.");
          api.onWrong();
        }
      },
    });

    container.appendChild(wheelsRow);
    container.appendChild(unlock);
    container.appendChild(fb);
  }

  // ---------- SEQUENCE ----------
  function renderSequence(container, stage, api) {
    const items = shuffle(stage.config.items);
    const sol = stage.solution;
    const order = [];
    const fb = feedbackBox();

    const cards = {};
    const grid = h(
      "div",
      { class: "m-seq-grid" },
      items.map(function (it) {
        const badge = h("span", { class: "m-seq-badge", text: "" });
        const btn = h(
          "button",
          {
            type: "button",
            class: "m-card m-seq-card",
            onclick: function () {
              if (order.indexOf(it.id) !== -1) return;
              order.push(it.id);
              badge.textContent = order.length;
              btn.classList.add("picked");
              info(fb, "");
              if (order.length === items.length) {
                const correct =
                  order.length === sol.length &&
                  order.every(function (v, i) {
                    return v === sol[i];
                  });
                setTimeout(function () {
                  if (correct) {
                    ok(fb, "순서가 맞습니다.");
                    api.onSolve();
                  } else {
                    bad(fb, "순서가 어긋났다. 처음부터 다시.");
                    api.onWrong();
                    setTimeout(reset, 400);
                  }
                }, 200);
              }
            },
          },
          [h("div", { class: "m-card-label", text: it.label }), badge],
        );
        cards[it.id] = { btn: btn, badge: badge };
        return btn;
      }),
    );

    function reset() {
      order.length = 0;
      Object.keys(cards).forEach(function (k) {
        cards[k].btn.classList.remove("picked");
        cards[k].badge.textContent = "";
      });
      info(fb, "");
    }

    const resetBtn = h("button", {
      type: "button",
      class: "btn btn-ghost",
      text: "처음부터",
      onclick: reset,
    });

    container.appendChild(grid);
    container.appendChild(
      h("div", { class: "btn-row", style: "margin-top:10px;" }, [resetBtn]),
    );
    container.appendChild(fb);
  }

  // ---------- MATCH ----------
  function renderMatch(container, stage, api) {
    const cfg = stage.config;
    const leftItems = cfg.left;
    const rightItems = shuffle(cfg.right);
    const pairs = {};
    let activeLeft = null;
    const colors = ["c1", "c2", "c3", "c4", "c5"];
    const leftEls = {};
    const rightEls = {};
    const fb = feedbackBox();

    function findFreeColor() {
      const used = Object.keys(pairs).map(function (k) {
        return leftEls[k].dataset.color;
      });
      for (let i = 0; i < colors.length; i++) {
        if (used.indexOf(colors[i]) === -1) return colors[i];
      }
      return colors[0];
    }

    function clearActive() {
      if (activeLeft && leftEls[activeLeft]) {
        leftEls[activeLeft].classList.remove("active");
      }
      activeLeft = null;
    }

    function pickLeft(id) {
      if (pairs[id] != null) {
        // unpair
        const rid = pairs[id];
        delete pairs[id];
        leftEls[id].classList.remove("paired");
        leftEls[id].removeAttribute("data-color");
        leftEls[id].className = leftEls[id].className.replace(
          /\bm-match-(c\d)\b/g,
          "",
        );
        rightEls[rid].classList.remove("paired");
        rightEls[rid].className = rightEls[rid].className.replace(
          /\bm-match-(c\d)\b/g,
          "",
        );
        info(fb, "");
        return;
      }
      clearActive();
      activeLeft = id;
      leftEls[id].classList.add("active");
    }

    function pickRight(rid) {
      if (!activeLeft) {
        info(fb, "먼저 왼쪽 인물을 선택하라.");
        return;
      }
      // if right is already paired, unpair first
      const existingLeft = Object.keys(pairs).find(function (k) {
        return pairs[k] === rid;
      });
      if (existingLeft) {
        delete pairs[existingLeft];
        leftEls[existingLeft].classList.remove("paired");
        leftEls[existingLeft].className = leftEls[
          existingLeft
        ].className.replace(/\bm-match-(c\d)\b/g, "");
        rightEls[rid].className = rightEls[rid].className.replace(
          /\bm-match-(c\d)\b/g,
          "",
        );
      }
      const color = findFreeColor();
      pairs[activeLeft] = rid;
      leftEls[activeLeft].classList.remove("active");
      leftEls[activeLeft].classList.add("paired", "m-match-" + color);
      leftEls[activeLeft].setAttribute("data-color", color);
      rightEls[rid].classList.add("paired", "m-match-" + color);
      activeLeft = null;
      info(fb, "");
    }

    const leftCol = h(
      "div",
      { class: "m-match-col" },
      leftItems.map(function (it) {
        const el = h("button", {
          type: "button",
          class: "m-card m-match-card",
          text: it.label,
          onclick: function () {
            pickLeft(it.id);
          },
        });
        leftEls[it.id] = el;
        return el;
      }),
    );
    const rightCol = h(
      "div",
      { class: "m-match-col" },
      rightItems.map(function (it) {
        const el = h("button", {
          type: "button",
          class: "m-card m-match-card",
          text: it.label,
          onclick: function () {
            pickRight(it.id);
          },
        });
        rightEls[it.id] = el;
        return el;
      }),
    );

    const confirmBtn = h("button", {
      type: "button",
      class: "btn btn-primary btn-block",
      text: "🔓 짝 확인",
      onclick: function () {
        const expected = stage.solution;
        const keys = Object.keys(expected);
        if (keys.length !== Object.keys(pairs).length) {
          bad(fb, "모든 쌍을 이어야 한다.");
          return;
        }
        const correct = keys.every(function (k) {
          return pairs[k] === expected[k];
        });
        if (correct) {
          ok(fb, "모든 짝이 맞습니다.");
          api.onSolve();
        } else {
          bad(fb, "어긋난 짝이 있다.");
          api.onWrong();
        }
      },
    });

    container.appendChild(
      h("div", { class: "m-match-grid" }, [leftCol, rightCol]),
    );
    container.appendChild(confirmBtn);
    container.appendChild(fb);
  }

  // ---------- ARRANGE ----------
  function renderArrange(container, stage, api) {
    const cfg = stage.config;
    const sol = stage.solution;
    const items = shuffle(cfg.items);
    const pool = items.map(function (it) {
      return it.id;
    });
    const slots = new Array(cfg.slots).fill(null);
    const fb = feedbackBox();

    const labelOf = {};
    items.forEach(function (it) {
      labelOf[it.id] = it.label;
    });

    const slotsEl = h("div", { class: "m-arr-slots" });
    const poolEl = h("div", { class: "m-arr-pool" });

    function paint() {
      slotsEl.innerHTML = "";
      poolEl.innerHTML = "";
      slots.forEach(function (sid, idx) {
        const el = h(
          "button",
          {
            type: "button",
            class: "m-card m-arr-slot" + (sid ? " filled" : ""),
            onclick: function () {
              if (!sid) return;
              slots[idx] = null;
              pool.push(sid);
              info(fb, "");
              paint();
            },
          },
          [
            h("span", { class: "m-arr-slot-num", text: idx + 1 }),
            h("span", {
              class: "m-arr-slot-label",
              text: sid ? labelOf[sid] : "비어 있음",
            }),
          ],
        );
        slotsEl.appendChild(el);
      });
      pool.forEach(function (pid) {
        const el = h("button", {
          type: "button",
          class: "m-card m-arr-pool-item",
          text: labelOf[pid],
          onclick: function () {
            const firstEmpty = slots.indexOf(null);
            if (firstEmpty === -1) return;
            slots[firstEmpty] = pid;
            const pi = pool.indexOf(pid);
            if (pi !== -1) pool.splice(pi, 1);
            info(fb, "");
            paint();
          },
        });
        poolEl.appendChild(el);
      });
    }

    const confirmBtn = h("button", {
      type: "button",
      class: "btn btn-primary btn-block",
      text: "🔓 순서 확인",
      onclick: function () {
        if (slots.indexOf(null) !== -1) {
          bad(fb, "모든 칸을 채워라.");
          return;
        }
        const correct = slots.every(function (v, i) {
          return v === sol[i];
        });
        if (correct) {
          ok(fb, "순서가 맞습니다.");
          api.onSolve();
        } else {
          bad(fb, "순서가 어긋났다.");
          api.onWrong();
        }
      },
    });

    paint();
    container.appendChild(h("div", { class: "m-arr" }, [slotsEl, poolEl]));
    container.appendChild(confirmBtn);
    container.appendChild(fb);
  }

  // ---------- HOTSPOT ----------
  function renderHotspot(container, stage, api) {
    const cfg = stage.config;
    const targets = cfg.targets || [];
    const exact = cfg.exact === true || targets.length === 1;
    const fb = feedbackBox();
    const picked = new Set();

    const cards = {};
    const grid = h(
      "div",
      { class: "m-hot-grid" },
      cfg.items.map(function (it) {
        const el = h(
          "button",
          {
            type: "button",
            class: "m-card m-hot-card",
            onclick: function () {
              if (picked.has(it.id)) {
                picked.delete(it.id);
                el.classList.remove("picked");
              } else {
                picked.add(it.id);
                el.classList.add("picked");
              }
              info(fb, "");
              if (exact && targets.length === 1) {
                // auto-check for single target
                if (targets[0] === it.id && picked.has(it.id)) {
                  ok(fb, "정답을 찾았다.");
                  api.onSolve();
                } else if (picked.has(it.id)) {
                  bad(fb, "그것이 아니다.");
                  api.onWrong();
                  setTimeout(function () {
                    picked.delete(it.id);
                    el.classList.remove("picked");
                    info(fb, "");
                  }, 400);
                }
              }
            },
          },
          [
            it.icon
              ? h("div", { class: "m-hot-icon", text: it.icon })
              : null,
            h("div", { class: "m-card-label", text: it.label }),
            it.note ? h("div", { class: "m-card-detail", text: it.note }) : null,
          ],
        );
        cards[it.id] = el;
        return el;
      }),
    );

    container.appendChild(grid);

    if (!(exact && targets.length === 1)) {
      const confirmBtn = h("button", {
        type: "button",
        class: "btn btn-primary btn-block",
        text: "🔓 확인",
        onclick: function () {
          const set = targets.slice().sort().join(",");
          const got = Array.from(picked).sort().join(",");
          if (set === got) {
            ok(fb, "모두 찾았다.");
            api.onSolve();
          } else {
            bad(fb, "아직 맞지 않다.");
            api.onWrong();
          }
        },
      });
      container.appendChild(confirmBtn);
    }

    container.appendChild(fb);
  }

  // ---------- COMBINE ----------
  function renderCombine(container, stage, api) {
    const cfg = stage.config;
    const fb = feedbackBox();

    // Inventory = working set of item ids currently held
    const itemMap = {};
    cfg.inventory.forEach(function (it) {
      itemMap[it.id] = it;
    });
    cfg.recipes.forEach(function (r) {
      if (r.result && r.result.id) itemMap[r.result.id] = r.result;
    });

    let bag = cfg.inventory.map(function (it) {
      return it.id;
    });
    let selected = [];

    const bagEl = h("div", { class: "m-cmb-bag" });
    const selEl = h("div", { class: "m-cmb-sel" });
    const combineBtn = h("button", {
      type: "button",
      class: "btn btn-primary",
      text: "🧪 결합",
      onclick: tryCombine,
    });
    const resetBtn = h("button", {
      type: "button",
      class: "btn btn-ghost",
      text: "선택 해제",
      onclick: function () {
        selected = [];
        info(fb, "");
        paint();
      },
    });

    function findRecipe(a, b) {
      return cfg.recipes.find(function (r) {
        return (r.a === a && r.b === b) || (r.a === b && r.b === a);
      });
    }

    function tryCombine() {
      if (selected.length !== 2) {
        bad(fb, "두 조각을 선택해야 한다.");
        return;
      }
      const r = findRecipe(selected[0], selected[1]);
      if (!r) {
        bad(fb, "맞지 않는 조합이다.");
        api.onWrong();
        selected = [];
        paint();
        return;
      }
      // remove both, add result
      selected.forEach(function (id) {
        const i = bag.indexOf(id);
        if (i !== -1) bag.splice(i, 1);
      });
      if (bag.indexOf(r.result.id) === -1) bag.push(r.result.id);
      selected = [];
      ok(fb, "새로운 조각이 만들어졌다 — " + r.result.label);
      paint();
      if (r.result.id === cfg.goal) {
        setTimeout(function () {
          api.onSolve();
        }, 350);
      }
    }

    function paint() {
      bagEl.innerHTML = "";
      bag.forEach(function (id) {
        const it = itemMap[id];
        const isSel = selected.indexOf(id) !== -1;
        const isGoal = id === cfg.goal;
        const el = h(
          "button",
          {
            type: "button",
            class:
              "m-card m-cmb-item" +
              (isSel ? " picked" : "") +
              (isGoal ? " goal" : ""),
            onclick: function () {
              if (isSel) {
                selected = selected.filter(function (s) {
                  return s !== id;
                });
              } else {
                if (selected.length >= 2) selected.shift();
                selected.push(id);
              }
              info(fb, "");
              paint();
            },
          },
          [
            it.icon ? h("div", { class: "m-cmb-icon", text: it.icon }) : null,
            h("div", { class: "m-card-label", text: it.label }),
          ],
        );
        bagEl.appendChild(el);
      });

      selEl.innerHTML = "";
      selEl.appendChild(
        h("div", {
          class: "m-cmb-sel-label",
          text:
            "선택된 조각 " + selected.length + " / 2",
        }),
      );
      const chips = h("div", { class: "m-cmb-chips" });
      selected.forEach(function (id) {
        chips.appendChild(
          h("span", { class: "chip", text: itemMap[id].label }),
        );
      });
      selEl.appendChild(chips);

      combineBtn.disabled = selected.length !== 2;
    }

    paint();

    container.appendChild(
      h("div", { class: "m-cmb" }, [
        h("div", { class: "m-cmb-label", text: "보유 조각" }),
        bagEl,
        selEl,
        h("div", { class: "btn-row" }, [combineBtn, resetBtn]),
      ]),
    );
    container.appendChild(fb);
  }

  // ---------- Export ----------
  global.ESCAPE_MECHANICS = {
    select: renderSelect,
    keypad: renderKeypad,
    dial: renderDial,
    sequence: renderSequence,
    match: renderMatch,
    arrange: renderArrange,
    hotspot: renderHotspot,
    combine: renderCombine,
  };
})(window);
