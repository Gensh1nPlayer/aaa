(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const canvas = document.createElement('canvas');
  canvas.id = 'void-starfield';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:2;width:100%;height:100%;pointer-events:none;opacity:.9;mix-blend-mode:screen';
  document.body.appendChild(canvas);

  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frame = 0;
  let resizeTimer = 0;
  let nextComet = performance.now() + 2400;
  let pointerVisible = false;
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0, lastX: 0, lastY: 0, lastSpawn: 0 };
  const stars = [];
  const sparks = [];
  const comets = [];

  const random = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);

  function createStar() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth: random(.18, 1),
      radius: random(.35, 1.45),
      drift: random(.025, .16),
      phase: random(0, Math.PI * 2),
      tint: Math.random()
    };
  }

  function resize() {
    width = Math.max(window.innerWidth, 320);
    height = Math.max(window.innerHeight, 480);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const starCount = Math.max(72, Math.min(230, Math.round(width * height / 7200)));
    stars.length = 0;
    for (let index = 0; index < starCount; index += 1) stars.push(createStar());
  }

  function drawStar(star, time) {
    star.y += star.drift * star.depth;
    if (star.y > height + 4) {
      star.y = -4;
      star.x = Math.random() * width;
    }
    const offsetX = pointer.smoothX * 17 * star.depth;
    const offsetY = pointer.smoothY * 10 * star.depth;
    const alpha = (.15 + star.depth * .48) * (.68 + Math.sin(time * .0012 + star.phase) * .3);
    const color = star.tint > .82 ? `rgba(79,218,255,${alpha})` : star.tint > .48 ? `rgba(171,128,255,${alpha})` : `rgba(239,235,255,${alpha})`;
    context.beginPath();
    context.fillStyle = color;
    context.arc(star.x + offsetX, star.y + offsetY, star.radius * star.depth, 0, Math.PI * 2);
    context.fill();
  }

  function spawnSpark(x, y, burst) {
    const amount = burst ? 20 : 2;
    for (let index = 0; index < amount; index += 1) {
      const angle = burst ? Math.random() * Math.PI * 2 : random(Math.PI * .65, Math.PI * 1.35);
      const speed = burst ? random(.7, 3.2) : random(.18, .75);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: burst ? random(.018, .035) : random(.04, .075),
        size: random(.5, burst ? 2.2 : 1.35),
        violet: Math.random() > .35
      });
    }
    if (sparks.length > 180) sparks.splice(0, sparks.length - 180);
  }

  function spawnComet() {
    const fromLeft = Math.random() > .5;
    const x = fromLeft ? -150 : width + 150;
    const y = random(height * .05, height * .46);
    const speed = random(2.2, 3.7) * (fromLeft ? 1 : -1);
    comets.push({ x, y, vx: speed, vy: Math.abs(speed) * .26, life: 1, length: random(80, 145) });
  }

  function drawCursorGlow() {
    if (!pointerVisible || !finePointer) return;
    const x = (pointer.smoothX + 1) * width / 2;
    const y = (pointer.smoothY + 1) * height / 2;
    const gradient = context.createRadialGradient(x, y, 0, x, y, 125);
    gradient.addColorStop(0, 'rgba(139,92,246,.13)');
    gradient.addColorStop(.35, 'rgba(99,102,241,.065)');
    gradient.addColorStop(1, 'rgba(99,102,241,0)');
    context.fillStyle = gradient;
    context.fillRect(x - 125, y - 125, 250, 250);
  }

  function drawSparks() {
    for (let index = sparks.length - 1; index >= 0; index -= 1) {
      const spark = sparks[index];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= .985;
      spark.vy *= .985;
      spark.life -= spark.decay;
      if (spark.life <= 0) {
        sparks.splice(index, 1);
        continue;
      }
      context.beginPath();
      context.fillStyle = spark.violet ? `rgba(176,132,255,${spark.life * .78})` : `rgba(80,220,255,${spark.life * .72})`;
      context.shadowBlur = 12;
      context.shadowColor = spark.violet ? '#8b5cf6' : '#42d9ff';
      context.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2);
      context.fill();
    }
    context.shadowBlur = 0;
  }

  function drawComets() {
    for (let index = comets.length - 1; index >= 0; index -= 1) {
      const comet = comets[index];
      comet.x += comet.vx;
      comet.y += comet.vy;
      comet.life -= .0026;
      const tailX = comet.x - Math.sign(comet.vx) * comet.length;
      const tailY = comet.y - comet.length * .26;
      const gradient = context.createLinearGradient(tailX, tailY, comet.x, comet.y);
      gradient.addColorStop(0, 'rgba(139,92,246,0)');
      gradient.addColorStop(.72, `rgba(139,92,246,${comet.life * .2})`);
      gradient.addColorStop(1, `rgba(224,215,255,${comet.life * .85})`);
      context.beginPath();
      context.strokeStyle = gradient;
      context.lineWidth = 1.15;
      context.moveTo(tailX, tailY);
      context.lineTo(comet.x, comet.y);
      context.stroke();
      context.beginPath();
      context.fillStyle = `rgba(238,232,255,${comet.life})`;
      context.shadowBlur = 14;
      context.shadowColor = '#8b5cf6';
      context.arc(comet.x, comet.y, 1.7, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
      if (comet.life <= 0 || comet.x < -220 || comet.x > width + 220 || comet.y > height + 120) comets.splice(index, 1);
    }
  }

  function render(time) {
    context.clearRect(0, 0, width, height);
    pointer.smoothX += (pointer.x - pointer.smoothX) * .045;
    pointer.smoothY += (pointer.y - pointer.smoothY) * .045;
    stars.forEach(star => drawStar(star, time));
    drawCursorGlow();
    drawComets();
    drawSparks();
    if (!reducedMotion && time >= nextComet) {
      spawnComet();
      nextComet = time + random(7000, 13500);
    }
    if (!reducedMotion) frame = requestAnimationFrame(render);
  }

  function onPointerMove(event) {
    pointerVisible = true;
    pointer.x = event.clientX / width * 2 - 1;
    pointer.y = event.clientY / height * 2 - 1;
    const now = performance.now();
    const distance = Math.hypot(event.clientX - pointer.lastX, event.clientY - pointer.lastY);
    if (distance > 9 && now - pointer.lastSpawn > 28) {
      spawnSpark(event.clientX, event.clientY, false);
      pointer.lastSpawn = now;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
    }
  }

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  }

  resize();
  if (reducedMotion) {
    render(performance.now());
    return;
  }

  window.addEventListener('resize', scheduleResize, { passive: true });
  if (finePointer) {
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', () => { pointerVisible = false; }, { passive: true });
    window.addEventListener('click', event => spawnSpark(event.clientX, event.clientY, true), { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) frame = requestAnimationFrame(render);
  });
  frame = requestAnimationFrame(render);
})();
