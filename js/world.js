// ===== 背景の世界・ホームの妖精・誕生演出 =====
(function(){
const world = document.getElementById('world');

// --- 時間で空が変わる ---
window.timeOfDay = function(){
  const h = new Date().getHours();
  return (h >= 5 && h < 16) ? 'day' : (h >= 16 && h < 19) ? 'eve' : 'night';
};
let forcedTime = null;
window.applyTime = function(t){
  if (t) forcedTime = t === 'auto' ? null : t;
  const v = forcedTime || timeOfDay();
  world.className = 't-' + v;
  return v;
};
applyTime();
setInterval(applyTime, 60000);

// --- 草花 ---
(function plants(){
  const box = document.getElementById('plants');
  const kinds = [
    (c)=>`<svg width="22" height="46" viewBox="0 0 22 46"><path d="M11 46 C11 30 10 20 11 10" stroke="#7fcf8a" stroke-width="2.5" fill="none"/><circle cx="11" cy="9" r="7" fill="${c}"/><circle cx="11" cy="9" r="3" fill="#fff3b0"/></svg>`,
    ()=>`<svg width="30" height="40" viewBox="0 0 30 40"><path d="M15 40 C12 26 4 20 2 10 C10 16 14 24 15 40 C16 24 22 14 28 8 C26 20 18 26 15 40Z" fill="#9edc9a"/></svg>`,
    (c)=>`<svg width="20" height="56" viewBox="0 0 20 56"><path d="M10 56 C10 36 9 24 10 14" stroke="#86d39a" stroke-width="2" fill="none"/><ellipse cx="10" cy="10" rx="6" ry="9" fill="${c}" opacity=".9"/><circle cx="10" cy="8" r="2" fill="#fff" opacity=".9"/></svg>`,
  ];
  const cols = ['#ffc2dc','#d6c8ff','#bfe6ff','#fff0a8','#ffd8c2'];
  const n = Math.min(26, Math.floor(innerWidth / 40));
  let h = '';
  for (let i = 0; i < n; i++) {
    const k = kinds[i % 3], x = (i / n) * 100 + rand(-2, 2), s = rand(.7, 1.3);
    h += `<div class="plant" style="left:${x}%;transform:scale(${s});animation-delay:${-rand(0,5)}s;animation-duration:${rand(4,7)}s;bottom:${rand(0,5)}%">${k(pick(cols))}</div>`;
  }
  box.innerHTML = h;
})();

// --- 光のつぶ ---
(function particles(){
  const cv = document.getElementById('particles'), c = cv.getContext('2d');
  let W, H, ps = [];
  function size(){ W = cv.width = innerWidth * devicePixelRatio; H = cv.height = innerHeight * devicePixelRatio; }
  size(); addEventListener('resize', size);
  function spawn(){ return { x: Math.random()*W, y: H*rand(.3,1), r: rand(1.2, 3.4)*devicePixelRatio, vy: -rand(.08,.35)*devicePixelRatio, ph: Math.random()*6.28, sp: rand(.005,.02), hue: pick([330, 270, 190, 50, 150]) }; }
  for (let i = 0; i < 46; i++) ps.push(spawn());
  function loop(){
    c.clearRect(0,0,W,H);
    const night = world.classList.contains('t-night');
    const extra = Math.min(40, S.fairies.length * 2);
    while (ps.length < 46 + extra) ps.push(spawn());
    for (const p of ps) {
      p.y += p.vy; p.ph += p.sp; p.x += Math.sin(p.ph) * .3 * devicePixelRatio;
      if (p.y < -10) Object.assign(p, spawn(), { y: H + 10 });
      const a = (.35 + .35 * Math.sin(p.ph * 2));
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      const col = night ? `hsla(${p.hue === 50 ? 70 : p.hue},100%,80%,` : `hsla(${p.hue},100%,92%,`;
      g.addColorStop(0, col + a + ')'); g.addColorStop(1, col + '0)');
      c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r * 4, 0, 6.28); c.fill();
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

// =========================================================
// ホームの妖精たち
// =========================================================
const stage = document.getElementById('homeStage');
let agents = [];
const FLYERS = ['sky', 'space'];

function makeAgent(f){
  const sp = SPECIES_BY_ID[f.sp];
  const el = document.createElement('div');
  const k = Math.max(1, Math.min(1.45, Math.min(innerWidth, innerHeight * 1.2) / 600));
  const size = (sp.fam === 'molecule' ? 80 : rand(76, 94)) * k;
  el.className = 'fy st-float';
  el.style.setProperty('--s', size + 'px');
  el.innerHTML = `<div class="shadow"></div><div class="inner">${fairySVG(sp)}</div>`;
  stage.appendChild(el);
  const W = stage.clientWidth || innerWidth, H = stage.clientHeight || innerHeight;
  const a = { f, sp, el, size, x: rand(.08, .82) * W, y: 0, tx: 0, ty: 0, state: 'float', t: rand(1, 4), mood: 'normal', flier: FLYERS.includes(sp.fam), vx: 0 };
  a.y = groundY(a, H);
  a.tx = a.x; a.ty = a.y;
  el.addEventListener('click', ev => { ev.stopPropagation(); tapAgent(a); });
  return a;
}
function groundY(a, H){
  H = H || stage.clientHeight;
  if (a.flier && Math.random() < .5) return rand(.28, .55) * H;
  return rand(.64, .84) * H - a.size;
}
function setMood(a, mood){
  if (a.mood === mood) return;
  a.mood = mood;
  a.el.querySelector('.inner').innerHTML = fairySVG(a.sp, { mood });
}
function setState(a, s, t){
  a.state = s; a.t = t;
  a.el.className = 'fy st-' + s + (a.vx < 0 ? ' flip' : '');
  a.el.querySelector('.zzz')?.remove();
  if (s === 'sleep') { setMood(a, 'sleep'); a.el.insertAdjacentHTML('beforeend', '<div class="zzz">z<small>z</small></div>'); }
  else if (s === 'look' || s === 'jump') setMood(a, 'happy');
  else if (s === 'surprise' || s === 'fall') setMood(a, 'surprise');
  else setMood(a, 'normal');
}
function say(a, text, ms = 2200){
  a.el.querySelector('.bubble')?.remove();
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text;
  a.el.appendChild(b); setTimeout(() => b.remove(), ms);
}
function heart(a, ch = '💗'){
  const h = document.createElement('div'); h.className = 'heart'; h.textContent = ch;
  h.style.left = (a.x + a.size/2 - 8) + 'px'; h.style.top = (a.y - 4) + 'px';
  stage.appendChild(h); setTimeout(() => h.remove(), 1200);
}
function tapAgent(a){
  sfx('po');
  if (a.state === 'sleep') { setState(a, 'surprise', 1); say(a, 'はっ…！ おはよう'); return; }
  const r = Math.random();
  if (r < .45) { setState(a, 'jump', 1.4); say(a, a.sp.fact.line, 2600); }
  else if (r < .75) { setState(a, 'look', 2); say(a, pick(['なあに？', 'えへへ', 'あそぼ！', a.sp.food + 'すき！', 'ぽん！'])); }
  else { setState(a, 'surprise', 1); say(a, 'わっ！'); }
  heart(a);
  // まわりの子も反応する
  agents.forEach(b => { if (b !== a && Math.abs(b.x - a.x) < 160 && b.state !== 'sleep' && Math.random() < .5) { b.vx = a.x - b.x; setState(b, 'look', 1.6); } });
}

function choose(a){
  const W = stage.clientWidth, H = stage.clientHeight;
  const night = world.classList.contains('t-night');
  const r = Math.random();
  const sleepy = night ? .35 : .12;
  if (r < sleepy) return setState(a, 'sleep', rand(6, 14));
  if (r < sleepy + .1 && agents.length > 1) {
    // なかまのところへ（追いかけっこ or くっつく）
    const b = pick(agents.filter(x => x !== a));
    a.friend = b; a.chase = Math.random() < .5;
    a.tx = b.x + (Math.random() < .5 ? -1 : 1) * b.size * .7; a.ty = b.y;
    a.vx = a.tx - a.x;
    return setState(a, 'walk', 6);
  }
  if (r < sleepy + .16) return setState(a, 'look', 2.2);
  if (r < sleepy + .22) return setState(a, 'jump', 1.4);
  if (r < sleepy + .55) return setState(a, 'float', rand(2, 5));
  a.friend = null;
  a.tx = Math.max(4, Math.min(W - a.size - 4, a.x + rand(-260, 260)));
  a.ty = groundY(a, H);
  a.vx = a.tx - a.x;
  setState(a, 'walk', 8);
}

let last = performance.now();
function tick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (document.getElementById('home').classList.contains('active')) {
    for (const a of agents) {
      a.t -= dt;
      if (a.state === 'walk') {
        if (a.friend) { a.tx = a.friend.x + (a.x < a.friend.x ? -1 : 1) * a.friend.size * .72; a.ty = a.friend.y; }
        const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
        const sp = (a.chase ? 90 : 42) * dt;
        if (d < 4) {
          if (a.friend) {
            if (a.chase) { setState(a, 'jump', 1.4); setState(a.friend, a.friend.state === 'sleep' ? 'sleep' : 'jump', 1.4); say(a, 'つかまえた！'); }
            else { setState(a, 'look', 3); heart(a, pick(['💗','✨','🫧'])); say(a, 'くっつき〜'); }
            a.friend = null;
          } else setState(a, 'float', rand(1.5, 4));
        } else {
          a.x += dx / d * Math.min(sp, d); a.y += dy / d * Math.min(sp, d);
          if (Math.random() < .0008) { setState(a, 'fall', 1.6); say(a, 'ころん…'); }
        }
      }
      if (a.state === 'sleep' && Math.random() < .002) { a.el.classList.add('st-roll'); setTimeout(() => a.el.classList.remove('st-roll'), 2400); }
      if (a.t <= 0) {
        if (a.state === 'fall') { setState(a, 'surprise', .8); say(a, 'えへへ'); }
        else choose(a);
      }
      a.el.style.transform = `translate(${a.x}px, ${a.y}px)`;
      a.el.style.zIndex = Math.round(a.y + a.size);
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.renderHomeFairies = function(){
  stage.innerHTML = ''; agents = [];
  const list = S.fairies.slice(-14);
  list.forEach(f => agents.push(makeAgent(f)));
  if (!list.length) {
    stage.innerHTML = `<div class="empty-hint glass" style="padding:18px 22px;border-radius:24px">
      <div style="font-size:34px">✨</div><div style="font-weight:800;margin:6px 0">まだ、だれもいないみたい</div>
      <div class="sub" style="margin:0">タスクをひとつ終えると<br>粒子の向こうから妖精がやってきます</div>
      <button class="btn" style="margin-top:12px" onclick="go('task')">タスクを見る</button></div>`;
  }
};
stage.addEventListener('click', e => {
  if (e.target !== stage) return;
  // 何もないところをタップ：近くの子がこっちを見る
  const r = stage.getBoundingClientRect(); const x = e.clientX - r.left;
  sfx('tap');
  agents.forEach(a => { if (Math.abs(a.x + a.size/2 - x) < 220 && a.state !== 'sleep') { a.vx = x - a.x; setState(a, 'look', 1.8); } });
});

// =========================================================
// 誕生演出「しぽぽぽぽ……ぽーーーん！」
// =========================================================
const ov = document.getElementById('birth'), bc = document.getElementById('birthCanvas'), orb = document.getElementById('birthOrb');
const btxt = document.getElementById('birthText'), bres = document.getElementById('birthResult');
let timers = [], raf = 0, finishFn = null;

function canvasFx(mode, origin){
  const c = bc.getContext('2d');
  const W = bc.width = innerWidth * devicePixelRatio, H = bc.height = innerHeight * devicePixelRatio;
  const cx = W/2, cy = H*.44;
  const ps = [];
  const cols = ['#ffffff','#ffd6ec','#d9ccff','#c9f3ff','#fff3b8','#c9ffe8'];
  if (mode === 'gather') {
    for (let i = 0; i < 140; i++) {
      const fromBtn = origin && i < 40;
      const a = Math.random()*6.28, R = rand(.4, .75) * Math.max(W, H);
      ps.push({ x: fromBtn ? origin.x*devicePixelRatio : cx + Math.cos(a)*R, y: fromBtn ? origin.y*devicePixelRatio : cy + Math.sin(a)*R, a, R: 0, d: rand(0, .8), c: pick(cols), r: rand(1.5, 4)*devicePixelRatio, spin: rand(2, 5) });
    }
  } else {
    for (let i = 0; i < 120; i++) { const a = Math.random()*6.28, v = rand(4, 16)*devicePixelRatio; ps.push({ x: cx, y: cy, vx: Math.cos(a)*v, vy: Math.sin(a)*v, c: pick(cols), r: rand(2, 6)*devicePixelRatio, life: 1, star: Math.random() < .3 }); }
  }
  const t0 = performance.now();
  cancelAnimationFrame(raf);
  (function loop(now){
    const t = (now - t0) / 1000;
    c.clearRect(0,0,W,H);
    for (const p of ps) {
      if (mode === 'gather') {
        const k = Math.max(0, Math.min(1, (t - p.d) / 1.6));
        const e = 1 - Math.pow(1 - k, 3);
        const ang = p.a + e * p.spin;
        const R0 = Math.hypot(p.x - cx, p.y - cy);
        const rr = R0 * (1 - e);
        const x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
        c.globalAlpha = k > 0 ? (1 - e * .6) : .3;
        c.fillStyle = p.c; c.beginPath(); c.arc(x, y, p.r, 0, 6.28); c.fill();
      } else {
        p.x += p.vx; p.y += p.vy; p.vx *= .965; p.vy = p.vy * .965 + .06*devicePixelRatio; p.life -= .012;
        c.globalAlpha = Math.max(0, p.life); c.fillStyle = p.c;
        if (p.star) { c.save(); c.translate(p.x, p.y); c.rotate(t*3); c.beginPath(); for (let i=0;i<8;i++){ const rr = i%2 ? p.r*.4 : p.r*1.6; c.lineTo(Math.cos(i*Math.PI/4)*rr, Math.sin(i*Math.PI/4)*rr);} c.fill(); c.restore(); }
        else { c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28); c.fill(); }
      }
    }
    c.globalAlpha = 1;
    if (t < 4) raf = requestAnimationFrame(loop);
  })(t0);
}

// opts: {sp, isNew, origin, title, seeds, fact, onDone}
window.playBirth = function(opts){
  const sp = opts.sp;
  ov.classList.remove('hidden');
  bres.classList.remove('show'); bres.innerHTML = '';
  btxt.className = 'birth-text'; btxt.textContent = '';
  orb.className = 'birth-orb';
  timers.forEach(clearTimeout); timers = [];
  const T = (ms, fn) => timers.push(setTimeout(fn, ms));
  finishFn = () => showResult(opts);

  if (S.settings.skipBirth) { finishFn(); return; }
  canvasFx('gather', opts.origin);
  T(100, () => orb.classList.add('grow'));
  T(700, () => { btxt.textContent = 'し'; sfx('po'); });
  ['しぽ','しぽぽ','しぽぽぽ','しぽぽぽぽ……'].forEach((s, i) => T(950 + i*260, () => { btxt.textContent = s; sfx('po'); }));
  T(1750, () => orb.classList.add('wobble'));
  T(2700, () => {
    orb.className = 'birth-orb burst';
    btxt.className = 'birth-text pon'; btxt.textContent = 'ぽーーーん！！！';
    sfx('pon'); canvasFx('burst');
  });
  T(3400, () => { btxt.textContent = ''; finishFn(); });
};
function showResult(opts){
  timers.forEach(clearTimeout); timers = [];
  orb.className = 'birth-orb'; btxt.textContent = '';
  const sp = opts.sp;
  const seeds = opts.seeds ? Object.entries(opts.seeds).map(([k,v]) => `<span style="display:flex;align-items:center">${atomSVG(k)}×${v}</span>`).join('') : '';
  const fact = opts.fact || sp.fact;
  bres.innerHTML = `
    ${opts.isNew ? '<div class="new">はじめまして！ ずかんに登録</div>' : '<div class="new" style="background:linear-gradient(90deg,#8fe3cf,#8ab8ff)">また会えたね</div>'}
    <div class="bf">${fairySVG(sp, { mood: 'happy' })}</div>
    <div class="bname">${esc(sp.name)}</div>
    <div style="font-size:12px;color:var(--ink2)">${esc(FAMILIES[sp.fam].name)}　｜　${esc(sp.pers)}</div>
    <div class="fact-card"><span class="tag">科学のひみつ</span>${esc(fact.s)}<div class="line">「${esc(fact.line)}」</div></div>
    ${seeds ? `<div class="seed-gain">元素のたねをもらったよ ${seeds}</div>` : ''}
    <div class="row" style="justify-content:center"><button class="btn" id="birthOk">いっしょにくらす ♪</button></div>`;
  bres.classList.add('show');
  sfx('sparkle');
  document.getElementById('birthOk').onclick = () => {
    ov.classList.add('hidden'); bres.classList.remove('show');
    cancelAnimationFrame(raf); bc.getContext('2d').clearRect(0,0,bc.width,bc.height);
    opts.onDone && opts.onDone();
  };
}
document.getElementById('birthSkip').onclick = () => { if (finishFn && !bres.classList.contains('show')) { cancelAnimationFrame(raf); finishFn(); } };
})();
