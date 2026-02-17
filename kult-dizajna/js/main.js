/* Культ Дизайна — animated grid background + scroll reveal */
(() => {
  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });

  const state = {
    w: 0,
    h: 0,
    dpr: Math.max(1, Math.min(2, window.devicePixelRatio || 1)),
    t0: performance.now(),
    mx: -9999,
    my: -9999,
    raf: 0,
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function resize() {
    state.w = Math.floor(window.innerWidth);
    state.h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(state.w * state.dpr);
    canvas.height = Math.floor(state.h * state.dpr);
    canvas.style.width = state.w + 'px';
    canvas.style.height = state.h + 'px';
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  // Tiny deterministic hash -> [0,1)
  function hash(x, y) {
    // Bitwise ops kept in 32-bit range
    let n = (x * 374761393 + y * 668265263) | 0;
    n = (n ^ (n >> 13)) | 0;
    n = (n * 1274126177) | 0;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  function draw(now) {
    const t = (now - state.t0) * 0.001;

    ctx.clearRect(0, 0, state.w, state.h);

    // Gentle vignette
    const g = ctx.createRadialGradient(state.w * 0.5, state.h * 0.25, 0, state.w * 0.5, state.h * 0.25, Math.max(state.w, state.h));
    g.addColorStop(0, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.00)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, state.w, state.h);

    const cell = 54;
    const ox = (t * 12) % cell;
    const oy = (t * 8) % cell;

    // Grid lines
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.lineWidth = 1;

    for (let x = -cell; x <= state.w + cell; x += cell) {
      const xx = Math.floor(x + ox) + 0.5;
      ctx.beginPath();
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, state.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();
    }
    for (let y = -cell; y <= state.h + cell; y += cell) {
      const yy = Math.floor(y + oy) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(state.w, yy);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.stroke();
    }
    ctx.restore();

    // Shimmering cells
    const mx = state.mx, my = state.my;
    for (let x = -cell; x <= state.w + cell; x += cell) {
      for (let y = -cell; y <= state.h + cell; y += cell) {
        const gx = x + ox;
        const gy = y + oy;

        const hx = Math.floor((x / cell) + 999);
        const hy = Math.floor((y / cell) + 999);
        const r = hash(hx, hy);

        // wave, but with per-cell phase
        const wave = 0.5 + 0.5 * Math.sin(t * 1.2 + r * 12.0);
        const pulse = (wave * wave) * 0.11; // keep subtle

        // cursor proximity
        const dx = gx - mx;
        const dy = gy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const prox = 1 - clamp(dist / 260, 0, 1);

        const a = pulse + prox * 0.12;
        if (a < 0.03) continue;

        const s = 10 + wave * 10;
        ctx.fillStyle = `rgba(90, 170, 255, ${Math.min(0.22, a)})`;
        ctx.fillRect(gx - s * 0.5, gy - s * 0.5, s, s);
      }
    }

    // Subtle scan line
    const scanY = (t * 46) % (state.h + 200) - 100;
    const lg = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
    lg.addColorStop(0, 'rgba(255,255,255,0.00)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    lg.addColorStop(1, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, scanY - 60, state.w, 120);

    state.raf = requestAnimationFrame(draw);
  }

  // Scroll reveal
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) e.target.classList.add('is-visible');
      }
    }, { threshold: 0.14 });

    els.forEach(el => io.observe(el));
  }

  // Pointer highlight
  function onMove(ev) {
    state.mx = ev.clientX;
    state.my = ev.clientY;
  }

  // Init
  resize();
  initReveal();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', onMove, { passive: true });

  // Hide CSS fallback grid once JS runs (canvas will be visible)
  document.querySelector('.bg-fallback')?.classList.add('is-hidden');

  state.raf = requestAnimationFrame(draw);
})();
