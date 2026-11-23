(() => {
  "use strict";

  const PHI = 1.61803398875;
  const appEl = document.getElementById("cerro-hypermedia-app");
  const railEl = document.getElementById("deque-rail");
  const canvas = document.getElementById("cerro-canvas");
  const svgOverlay = document.getElementById("cerro-svg-overlay");
  const gainSlider = document.getElementById("gain-slider");
  const chargeFill = document.getElementById("charge-bar-fill");
  const sdlcFill = document.getElementById("sdlc-bar-fill");
  const licDot = document.getElementById("lic-indicator");

  // Dados e regras mantidos em background (nao exibidos como texto na tela)
  const backgroundRegistry = {
    "ENG-101": { sdlc: 75, license: false, ruleRef: "backend://rules/eng-101" },
    "ENG-204": { sdlc: 100, license: true, ruleRef: "backend://rules/eng-204" },
    "ENG-309": { sdlc: 50, license: false, ruleRef: "backend://rules/eng-309" },
    "ENG-412": { sdlc: 100, license: true, ruleRef: "backend://rules/eng-412" }
  };

  const state = {
    deque: ["ENG-309", "ENG-412", "ENG-101", "ENG-204"],
    activeCode: "ENG-101",
    chargePct: 25,
    gainPct: 75,
    mode: "2d"
  };

  function playCue(kind) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    try {
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      if (kind === "trunk") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(145, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.24);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.75);
        gain.gain.setValueAtTime(0.09, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.78);
      } else {
        osc.type = kind === "lock" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(220 * PHI, now + 0.14);
        gain.gain.setValueAtTime(0.06, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.18);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
      setTimeout(() => ctx.close().catch(() => {}), 850);
    } catch (_) {}
  }

  function syncBackgroundAndHud() {
    const meta = backgroundRegistry[state.activeCode] || { sdlc: 50, license: false };
    appEl.dataset.module = state.activeCode;
    appEl.dataset.charge = String(state.chargePct);
    appEl.dataset.sdlc = String(meta.sdlc);
    appEl.dataset.license = meta.license ? "1" : "0";

    chargeFill.style.width = state.chargePct + "%";
    sdlcFill.style.width = meta.sdlc + "%";
    licDot.className = "cerro-dot " + (meta.license ? "cerro-dot--ok" : "cerro-dot--warn");

    railEl.innerHTML = "";
    state.deque.forEach((code) => {
      const itemMeta = backgroundRegistry[code] || { sdlc: 50 };
      const node = document.createElement("button");
      node.type = "button";
      node.className = "cerro-node" + (code === state.activeCode ? " cerro-node--active" : "");
      node.dataset.code = code;
      node.setAttribute("aria-label", code);

      const bar = document.createElement("span");
      bar.className = "cerro-node__bar";
      const fill = document.createElement("i");
      fill.style.width = itemMeta.sdlc + "%";
      bar.appendChild(fill);

      node.appendChild(bar);
      node.addEventListener("click", () => {
        state.activeCode = code;
        playCue("pulse");
        syncBackgroundAndHud();
      });
      railEl.appendChild(node);
    });

    appEl.dispatchEvent(
      new CustomEvent("cerro:state-sync", {
        bubbles: true,
        detail: {
          activeCode: state.activeCode,
          chargePct: state.chargePct,
          deque: state.deque.slice(),
          backgroundMeta: backgroundRegistry[state.activeCode]
        }
      })
    );
  }

  document.getElementById("push-front-btn").addEventListener("click", () => {
    const nextCode = "ENG-" + String(Math.floor(500 + Math.random() * 499));
    backgroundRegistry[nextCode] = { sdlc: 65, license: false, ruleRef: "backend://rules/" + nextCode.toLowerCase() };
    state.deque.unshift(nextCode);
    state.activeCode = nextCode;
    playCue("pulse");
    syncBackgroundAndHud();
  });

  document.getElementById("push-rear-btn").addEventListener("click", () => {
    const nextCode = "ENG-" + String(Math.floor(500 + Math.random() * 499));
    backgroundRegistry[nextCode] = { sdlc: 80, license: true, ruleRef: "backend://rules/" + nextCode.toLowerCase() };
    state.deque.push(nextCode);
    state.activeCode = nextCode;
    playCue("pulse");
    syncBackgroundAndHud();
  });

  document.getElementById("pulse-5-btn").addEventListener("click", () => {
    state.chargePct = Math.min(100, state.chargePct + 5);
    playCue("pulse");
    syncBackgroundAndHud();
  });

  document.getElementById("trunk-10-btn").addEventListener("click", () => {
    state.chargePct = Math.min(100, state.chargePct + 10);
    playCue("trunk");
    syncBackgroundAndHud();
  });

  document.getElementById("license-toggle-btn").addEventListener("click", () => {
    const current = backgroundRegistry[state.activeCode] || { sdlc: 50, license: false };
    current.license = !current.license;
    backgroundRegistry[state.activeCode] = current;
    playCue("lock");
    syncBackgroundAndHud();
  });

  document.getElementById("next-mod-btn").addEventListener("click", () => {
    const idx = state.deque.indexOf(state.activeCode);
    const nextIdx = idx >= 0 ? (idx + 1) % state.deque.length : 0;
    state.activeCode = state.deque[nextIdx];
    playCue("pulse");
    syncBackgroundAndHud();
  });

  gainSlider.addEventListener("input", (e) => {
    state.gainPct = Number(e.target.value) || 75;
  });

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.getAttribute("data-mode") || "2d";
      document.querySelectorAll("[data-mode]").forEach((b) => b.classList.remove("cerro-btn--active"));
      btn.classList.add("cerro-btn--active");
      svgOverlay.classList.toggle("is-hidden", state.mode !== "svg");
      playCue("pulse");
    });
  });

  const ctx = canvas.getContext("2d");
  const t0 = performance.now();
  function renderCanvas(now) {
    const t = (now - t0) / 1000;
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.39;
    const amp = (12 + (state.chargePct / 100) * 24) * (state.gainPct / 100);
    const meta = backgroundRegistry[state.activeCode] || { license: false };

    ctx.clearRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(cx, cy * 0.8, 6, cx, cy, r * 1.35);
    grad.addColorStop(0, state.mode === "wave" ? "#13315c" : "#0b192c");
    grad.addColorStop(1, "#030711");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const waves = ["rgba(239,68,68,0.7)", "rgba(245,158,11,0.7)", "rgba(56,189,248,0.7)"];
    waves.forEach((col, i) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 5) {
        const nx = (x - cx) / (w * 0.5);
        const y = cy + Math.sin(x * 0.036 - t * 3.1 + (i * Math.PI * 2) / 3) * amp * Math.exp(-nx * nx);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = state.mode === "wave" ? 2.6 : 1.7;
      ctx.stroke();
    });

    ctx.strokeStyle = meta.license ? "#34d399" : "#f59e0b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.12, r * 0.24, r * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 5.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, cy + r * 0.04);
    ctx.quadraticCurveTo(cx + Math.sin(t * 3.4) * r * 0.14, cy + r * 0.36, cx, cy + r * 0.6);
    ctx.stroke();

    requestAnimationFrame(renderCanvas);
  }

  syncBackgroundAndHud();
  requestAnimationFrame(renderCanvas);
})();