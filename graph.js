/* ============ MathMentor — interactive function grapher (canvas + math.js) ============ */
(function () {
  "use strict";

  const canvas = document.getElementById("graphCanvas");
  if (!canvas || typeof math === "undefined") return;
  const ctx = canvas.getContext("2d");
  const legendEl = document.getElementById("graphLegend");
  const noteEl = document.getElementById("graphNote");
  const coordEl = document.getElementById("graphCoord");
  const fnInput = document.getElementById("graphFnInput");
  const addBtn = document.getElementById("graphAddBtn");
  const errEl = document.getElementById("graphError");

  const COLORS = ["#1d5bd8", "#c73838", "#1d8a4b", "#b26a00", "#7b3fbf", "#0d7ea8"];

  let fns = [];                                   // {expr, label, compiled, color}
  let view = { x0: -10, x1: 10, y0: -10, y1: 10 };
  let home = { ...view };                         // for the reset button
  let drag = null;

  // ---------------- function management ----------------
  function compile(expr) {
    const c = math.compile(expr);
    c.evaluate({ x: 1 }); // throws early on unknown symbols / syntax errors
    return c;
  }

  function addFunction(expr, label, silent) {
    expr = String(expr || "").trim();
    if (!expr) return false;
    try {
      const compiled = compile(expr);
      fns.push({ expr, label: label || expr, compiled, color: COLORS[fns.length % COLORS.length] });
      errEl.textContent = "";
      renderLegend();
      draw();
      return true;
    } catch (e) {
      if (!silent)
        errEl.textContent = `Could not read "${expr}" — write it like: 2*x^2 - 3*sin(x), sqrt(x+1), abs(x) …`;
      return false;
    }
  }

  function removeFunction(i) {
    fns.splice(i, 1);
    fns.forEach((f, k) => (f.color = COLORS[k % COLORS.length]));
    renderLegend();
    draw();
  }

  function clearAll() {
    fns = [];
    errEl.textContent = "";
    noteEl.textContent = "";
    renderLegend();
    draw();
  }

  function renderLegend() {
    legendEl.innerHTML = "";
    fns.forEach((f, i) => {
      const chip = document.createElement("span");
      chip.className = "fn-chip";
      const dot = document.createElement("span");
      dot.className = "fn-dot";
      dot.style.background = f.color;
      const txt = document.createElement("span");
      txt.textContent = f.label;
      const x = document.createElement("button");
      x.className = "fn-remove";
      x.textContent = "×";
      x.title = "Remove";
      x.addEventListener("click", () => removeFunction(i));
      chip.append(dot, txt, x);
      legendEl.appendChild(chip);
    });
  }

  // ---------------- view / auto-fit ----------------
  const isNum = (v) => typeof v === "number" && isFinite(v);

  function autoFitY() {
    const ys = [];
    const N = 400;
    for (const f of fns) {
      for (let i = 0; i <= N; i++) {
        const x = view.x0 + (i * (view.x1 - view.x0)) / N;
        try {
          const y = f.compiled.evaluate({ x });
          if (typeof y === "number" && isFinite(y)) ys.push(y);
        } catch { /* gap */ }
      }
    }
    if (!ys.length) { view.y0 = -10; view.y1 = 10; return; }
    ys.sort((a, b) => a - b);
    let lo = ys[Math.floor(0.02 * (ys.length - 1))];
    let hi = ys[Math.ceil(0.98 * (ys.length - 1))];
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    view.y0 = lo - pad;
    view.y1 = hi + pad;
    // always keep the x-axis in sight when it is close
    if (view.y0 > 0 && view.y0 < (hi - lo)) view.y0 = -pad;
    if (view.y1 < 0 && view.y1 > -(hi - lo)) view.y1 = pad;
  }

  function setFromAnalysis(plot) {
    clearAll();
    const p = plot || {};
    (p.functions || []).forEach((f) => addFunction(f.expr, f.label, true));
    let x0 = isNum(p.x_min) ? p.x_min : -10;
    let x1 = isNum(p.x_max) ? p.x_max : 10;
    if (x1 <= x0) { x0 = -10; x1 = 10; }
    view.x0 = x0; view.x1 = x1;
    if (isNum(p.y_min) && isNum(p.y_max) && p.y_max > p.y_min) {
      view.y0 = p.y_min; view.y1 = p.y_max;
    } else {
      autoFitY();
    }
    home = { ...view };
    noteEl.textContent = p.note || "";
    requestAnimationFrame(draw); // card may have just been unhidden — wait for layout
  }

  // ---------------- drawing ----------------
  function niceStep(span, target) {
    const raw = span / target;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    for (const m of [1, 2, 5, 10]) if (raw <= m * mag) return m * mag;
    return 10 * mag;
  }
  const fmt = (n) => (Math.abs(n) < 1e-12 ? "0" : String(parseFloat(n.toPrecision(10))));

  function draw() {
    const cssW = canvas.clientWidth || 600;
    const cssH = canvas.clientHeight || 320;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = cssW, H = cssH;
    const { x0, x1, y0, y1 } = view;
    const px = (x) => ((x - x0) / (x1 - x0)) * W;
    const py = (y) => H - ((y - y0) / (y1 - y0)) * H;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // grid
    const stepX = niceStep(x1 - x0, 10);
    const stepY = niceStep(y1 - y0, 7);
    ctx.strokeStyle = "rgba(29, 91, 216, 0.10)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1 + 1e-9; x += stepX) {
      ctx.moveTo(px(x), 0); ctx.lineTo(px(x), H);
    }
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1 + 1e-9; y += stepY) {
      ctx.moveTo(0, py(y)); ctx.lineTo(W, py(y));
    }
    ctx.stroke();

    // axes
    ctx.strokeStyle = "#8d9aa9";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (y0 <= 0 && y1 >= 0) { ctx.moveTo(0, py(0)); ctx.lineTo(W, py(0)); }
    if (x0 <= 0 && x1 >= 0) { ctx.moveTo(px(0), 0); ctx.lineTo(px(0), H); }
    ctx.stroke();

    // tick labels (clamped to edges when the axis is off-screen)
    ctx.fillStyle = "#5b6b7b";
    ctx.font = "11px system-ui, sans-serif";
    const axisY = Math.min(Math.max(py(0), 12), H - 6);
    const axisX = Math.min(Math.max(px(0), 4), W - 30);
    ctx.textAlign = "center";
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1 + 1e-9; x += stepX) {
      if (Math.abs(x) > 1e-12) ctx.fillText(fmt(x), px(x), axisY + (py(0) > H - 18 ? -6 : 14));
    }
    ctx.textAlign = "left";
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1 + 1e-9; y += stepY) {
      if (Math.abs(y) > 1e-12) ctx.fillText(fmt(y), axisX + 5, py(y) - 3);
    }

    // curves
    for (const f of fns) {
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let pen = false, prevY = null;
      for (let i = 0; i <= W; i++) {
        const x = x0 + (i * (x1 - x0)) / W;
        let y = null;
        try {
          const v = f.compiled.evaluate({ x });
          if (typeof v === "number" && isFinite(v)) y = v;
        } catch { /* gap */ }
        if (y === null) { pen = false; prevY = null; continue; }
        const Y = py(y);
        // break the path across vertical asymptotes (huge jumps)
        if (pen && prevY !== null && Math.abs(Y - prevY) > 2 * H) pen = false;
        if (!pen) { ctx.moveTo(i, Y); pen = true; }
        else ctx.lineTo(i, Y);
        prevY = Y;
      }
      ctx.stroke();
    }
  }

  // ---------------- interactions ----------------
  function zoom(factor, cx, cy) {
    const c = {
      x: cx === undefined ? (view.x0 + view.x1) / 2 : cx,
      y: cy === undefined ? (view.y0 + view.y1) / 2 : cy,
    };
    view.x0 = c.x - (c.x - view.x0) * factor;
    view.x1 = c.x + (view.x1 - c.x) * factor;
    view.y0 = c.y - (c.y - view.y0) * factor;
    view.y1 = c.y + (view.y1 - c.y) * factor;
    draw();
  }
  function resetView() { view = { ...home }; draw(); }

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const cx = view.x0 + ((e.clientX - r.left) / r.width) * (view.x1 - view.x0);
    const cy = view.y1 - ((e.clientY - r.top) / r.height) * (view.y1 - view.y0);
    zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, cx, cy);
  }, { passive: false });

  canvas.addEventListener("mousedown", (e) => {
    drag = { mx: e.clientX, my: e.clientY, v: { ...view } };
    canvas.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", (e) => {
    if (drag) {
      const r = canvas.getBoundingClientRect();
      const dx = ((e.clientX - drag.mx) / r.width) * (drag.v.x1 - drag.v.x0);
      const dy = ((e.clientY - drag.my) / r.height) * (drag.v.y1 - drag.v.y0);
      view.x0 = drag.v.x0 - dx; view.x1 = drag.v.x1 - dx;
      view.y0 = drag.v.y0 + dy; view.y1 = drag.v.y1 + dy;
      draw();
    }
  });
  window.addEventListener("mouseup", () => { drag = null; canvas.style.cursor = "grab"; });

  canvas.addEventListener("mousemove", (e) => {
    const r = canvas.getBoundingClientRect();
    const x = view.x0 + ((e.clientX - r.left) / r.width) * (view.x1 - view.x0);
    const y = view.y1 - ((e.clientY - r.top) / r.height) * (view.y1 - view.y0);
    coordEl.textContent = `x ≈ ${x.toPrecision(4)},  y ≈ ${y.toPrecision(4)}`;
  });
  canvas.addEventListener("mouseleave", () => { coordEl.textContent = ""; });

  document.getElementById("graphZoomIn").addEventListener("click", () => zoom(1 / 1.4));
  document.getElementById("graphZoomOut").addEventListener("click", () => zoom(1.4));
  document.getElementById("graphReset").addEventListener("click", resetView);

  function addFromInput() {
    if (addFunction(fnInput.value, null, false)) {
      autoFitY();
      home = { ...view };
      fnInput.value = "";
      draw();
    }
  }
  addBtn.addEventListener("click", addFromInput);
  fnInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addFromInput(); });

  window.addEventListener("resize", () => requestAnimationFrame(draw));

  // ---------------- public API (used by app.js) ----------------
  window.MMGraph = { setFromAnalysis, addFunction, clear: clearAll, zoom, resetView, draw };
})();
