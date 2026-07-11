/* ============ MathMentor — scientific calculator (math.js) ============ */
(function () {
  "use strict";

  const exprEl = document.getElementById("calcExpr");
  const resultEl = document.getElementById("calcResult");
  const gridEl = document.getElementById("calcGrid");
  const historyEl = document.getElementById("calcHistory");
  const degKey = document.getElementById("degKey");
  const invKey = document.getElementById("invKey");

  if (typeof math === "undefined") {
    resultEl.textContent = "⚠ calculator needs internet (math.js)";
    return;
  }

  // --- two math instances: radians (native) and degrees (overridden trig) ---
  const mathRad = math.create(math.all);
  const mathDeg = math.create(math.all);
  const D = Math.PI / 180;
  mathDeg.import(
    {
      sin: (x) => Math.sin(x * D),
      cos: (x) => Math.cos(x * D),
      tan: (x) => Math.tan(x * D),
      asin: (x) => Math.asin(x) / D,
      acos: (x) => Math.acos(x) / D,
      atan: (x) => Math.atan(x) / D,
    },
    { override: true }
  );

  let degMode = localStorage.getItem("mm_deg") !== "rad"; // default DEG
  let invMode = false;
  let ans = 0;
  const history = [];

  function renderModes() {
    degKey.textContent = degMode ? "DEG" : "RAD";
    degKey.classList.toggle("active-mode", degMode);
    invKey.classList.toggle("active-mode", invMode);
    // swap trig / ln / log labels
    gridEl.querySelectorAll("[data-inv]").forEach((btn) => {
      const base = btn.dataset.lbl || btn.dataset.ins.replace("(", "");
      const invLbl = btn.dataset.invlbl || base + "⁻¹";
      btn.textContent = invMode ? invLbl : base;
    });
  }

  function insert(text) {
    const start = exprEl.selectionStart ?? exprEl.value.length;
    const end = exprEl.selectionEnd ?? exprEl.value.length;
    exprEl.value = exprEl.value.slice(0, start) + text + exprEl.value.slice(end);
    const pos = start + text.length;
    exprEl.focus();
    exprEl.setSelectionRange(pos, pos);
    preview();
  }

  function preprocess(raw) {
    let s = raw.trim();
    if (!s) return "";
    // 25%  ->  (25/100)     (applies to numbers or closing parens)
    s = s.replace(/(\d+(?:\.\d+)?|\))%/g, "($1/100)");
    return s;
  }

  function evaluate(raw) {
    const s = preprocess(raw);
    if (!s) return null;
    const engine = degMode ? mathDeg : mathRad;
    const value = engine.evaluate(s, { Ans: ans });
    return engine.format(value, { precision: 12 });
  }

  function preview() {
    try {
      const out = evaluate(exprEl.value);
      resultEl.textContent = out === null ? " " : "= " + out;
      resultEl.style.color = "";
    } catch {
      resultEl.textContent = " ";
    }
  }

  function equals() {
    const raw = exprEl.value;
    if (!raw.trim()) return;
    try {
      const out = evaluate(raw);
      ans = parseFloat(out);
      if (Number.isNaN(ans)) ans = 0;
      resultEl.textContent = "= " + out;
      resultEl.style.color = "";
      addHistory(raw, out);
      exprEl.value = String(out);
      exprEl.setSelectionRange(exprEl.value.length, exprEl.value.length);
    } catch (e) {
      resultEl.textContent = "Error: " + (e.message || "invalid expression");
      resultEl.style.color = "#ff8f8f";
    }
  }

  function addHistory(expr, out) {
    history.unshift({ expr, out });
    if (history.length > 25) history.pop();
    historyEl.innerHTML = "";
    history.forEach((h) => {
      const li = document.createElement("li");
      li.textContent = `${h.expr} = ${h.out}`;
      li.title = "Click to reuse result";
      li.addEventListener("click", () => {
        insert(String(h.out));
      });
      historyEl.appendChild(li);
    });
  }

  gridEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("button");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "eq") return equals();
    if (act === "clear") {
      exprEl.value = "";
      resultEl.textContent = " ";
      exprEl.focus();
      return;
    }
    if (act === "back") {
      const start = exprEl.selectionStart ?? exprEl.value.length;
      if (start > 0) {
        exprEl.value = exprEl.value.slice(0, start - 1) + exprEl.value.slice(start);
        exprEl.focus();
        exprEl.setSelectionRange(start - 1, start - 1);
      }
      preview();
      return;
    }
    if (act === "deg") {
      degMode = !degMode;
      localStorage.setItem("mm_deg", degMode ? "deg" : "rad");
      renderModes();
      preview();
      return;
    }
    if (act === "inv") {
      invMode = !invMode;
      renderModes();
      return;
    }
    // insertion key — respect INV variants
    let ins = btn.dataset.ins;
    if (invMode && btn.dataset.inv) {
      ins = btn.dataset.inv;
      invMode = false;
      renderModes();
    }
    insert(ins);
  });

  exprEl.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      equals();
    }
  });
  exprEl.addEventListener("input", preview);

  renderModes();
})();
