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
// ホームの妖精たち（さわって、つかんで、なげて遊べる）
// =========================================================
const stage = document.getElementById('homeStage');
let agents = [];
const FLYERS = ['sky', 'space'];
const pointer = { x: -1, y: -1, t: 0 };
const W = () => stage.clientWidth || innerWidth, H = () => stage.clientHeight || innerHeight;
const bandTop = () => H() * .62, bandBot = () => H() * .86;

function makeAgent(f){
  const sp = SPECIES_BY_ID[f.sp];
  const el = document.createElement('div');
  const k = Math.max(1, Math.min(1.45, Math.min(innerWidth, innerHeight * 1.2) / 600));
  const size = (sp.fam === 'molecule' ? 80 : rand(76, 94)) * k;
  el.className = 'fy st-float';
  el.style.setProperty('--s', size + 'px');
  el.innerHTML = `<div class="shadow"></div><div class="inner">${fairySVG(sp)}</div>`;
  stage.appendChild(el);
  const a = { f, sp, el, size, x: rand(.08, .82) * W(), y: 0, tx: 0, ty: 0, vx: 0, vy: 0, state: 'float', t: rand(1, 4), mood: 'normal', flier: FLYERS.includes(sp.fam), air: false, held: false, floor: 0 };
  a.y = groundY(a); a.floor = a.y + (a.hover || 0); a.tx = a.x; a.ty = a.y;
  bindDrag(a);
  return a;
}
function groundY(a){
  a.hover = 0;
  if (a.flier && Math.random() < .5) { const y = rand(.28, .55) * H(); a.hover = rand(.64, .84) * H() - a.size - y; return y; }
  return rand(.64, .84) * H() - a.size;
}
function setMood(a, mood){
  if (a.mood === mood) return;
  a.mood = mood;
  a.el.querySelector('.inner').innerHTML = fairySVG(a.sp, { mood });
}
function setState(a, s, t){
  a.state = s; a.t = t;
  a.el.className = 'fy st-' + s + (a.vx < 0 ? ' flip' : '') + (a.held ? ' held' : '');
  a.el.querySelector('.zzz')?.remove();
  a.el.querySelector('.dizzy')?.remove();
  if (s === 'sleep') { setMood(a, 'sleep'); a.el.insertAdjacentHTML('beforeend', '<div class="zzz">z<small>z</small></div>'); }
  else if (s === 'look' || s === 'jump' || s === 'pet') setMood(a, 'happy');
  else if (s === 'surprise' || s === 'fall' || s === 'held' || s === 'air') setMood(a, 'surprise');
  else if (s === 'dizzy') { setMood(a, 'surprise'); a.el.insertAdjacentHTML('beforeend', '<div class="dizzy">✦ ✧ ✦</div>'); }
  else setMood(a, 'normal');
}
function say(a, text, ms = 2200){
  a.el.querySelector('.bubble')?.remove();
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = text;
  a.el.appendChild(b); setTimeout(() => b.remove(), ms);
}
function heart(a, ch = '💗'){
  const h = document.createElement('div'); h.className = 'heart'; h.textContent = ch;
  h.style.left = (a.x + a.size/2 - 8 + rand(-14, 14)) + 'px'; h.style.top = (a.y - 4) + 'px';
  stage.appendChild(h); setTimeout(() => h.remove(), 1200);
}
function sparkleAt(x, y, n = 10){
  for (let i = 0; i < n; i++) {
    const s = document.createElement('div'); s.className = 'tap-spark';
    s.style.left = x + 'px'; s.style.top = y + 'px';
    const ang = i / n * Math.PI * 2; s.style.setProperty('--dx', Math.cos(ang) * rand(26, 50) + 'px'); s.style.setProperty('--dy', Math.sin(ang) * rand(26, 50) + 'px');
    stage.appendChild(s); setTimeout(() => s.remove(), 800);
  }
}
function tapAgent(a){
  sfx('po');
  if (a.state === 'sleep') { setState(a, 'surprise', 1); say(a, 'はっ…！ おはよう'); return; }
  const r = Math.random();
  if (r < .45) { setState(a, 'jump', 1.4); say(a, a.sp.fact.line, 2600); }
  else if (r < .75) { setState(a, 'look', 2); say(a, pick(['なあに？', 'えへへ', 'あそぼ！', a.sp.food + 'すき！', 'ぽん！'])); }
  else { setState(a, 'surprise', 1); say(a, 'わっ！'); }
  heart(a);
  agents.forEach(b => { if (b !== a && Math.abs(b.x - a.x) < 160 && b.state !== 'sleep' && !b.air && Math.random() < .5) { b.vx = a.x - b.x; setState(b, 'look', 1.6); } });
}

// ----- つかむ・なでる・なげる -----
function bindDrag(a){
  let start = null, hist = [], petT = 0, moved = false;
  a.el.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    try { a.el.setPointerCapture(e.pointerId); } catch(_) {}
    const r = stage.getBoundingClientRect();
    start = { px: e.clientX, py: e.clientY, ox: e.clientX - r.left - a.x, oy: e.clientY - r.top - a.y, t: performance.now() };
    hist = [{ x: e.clientX, y: e.clientY, t: performance.now() }]; moved = false;
    clearTimeout(petT);
    petT = setTimeout(() => { if (start && !moved) pet(a); }, 550);
  });
  a.el.addEventListener('pointermove', e => {
    if (!start) return;
    const dist = Math.hypot(e.clientX - start.px, e.clientY - start.py);
    if (!moved && dist > 8 && a.state !== 'pet') { moved = true; grab(a); }
    if (a.state === 'pet') { if (dist > 6 && Math.random() < .12) heart(a, pick(['💗','💕','✨'])); return; }
    if (!a.held) return;
    const r = stage.getBoundingClientRect();
    a.gx = e.clientX - r.left - start.ox; a.gy = e.clientY - r.top - start.oy;
    hist.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (hist.length > 6) hist.shift();
  });
  const up = () => {
    if (!start) return;
    clearTimeout(petT);
    if (a.held) {
      const h0 = hist[0], h1 = hist[hist.length - 1], dt = Math.max(16, h1.t - h0.t) / 1000;
      release(a, (h1.x - h0.x) / dt, (h1.y - h0.y) / dt);
    } else if (a.state === 'pet') { setState(a, 'look', 1.5); say(a, 'もっとなでて〜'); }
    else if (!moved) tapAgent(a);
    start = null;
  };
  a.el.addEventListener('pointerup', up);
  a.el.addEventListener('pointercancel', up);
}
function pet(a){
  sfx('soft'); setState(a, 'pet', 99); say(a, pick(['なでなで〜', 'ふわぁ…きもちいい', 'えへへ〜', 'ごろごろ…']), 1800);
  for (let i = 0; i < 3; i++) setTimeout(() => heart(a, pick(['💗','💕'])), i * 200);
}
function grab(a){
  a.held = true; a.air = false; a.friend = null; a.gx = a.x; a.gy = a.y;
  setState(a, 'held', 99); sfx('tap');
  say(a, pick(['わわっ！', 'たかーい！', 'どこいくの？', 'ふわ〜', 'きゃー♪']), 1500);
  agents.forEach(b => { if (b !== a && !b.air && b.state !== 'sleep' && Math.random() < .5) { setState(b, 'look', 2); if (Math.random() < .3) say(b, pick(['いいなぁ', 'わたしも〜', 'がんばれ〜'])); } });
}
function release(a, vx, vy){
  a.held = false;
  const sp = Math.hypot(vx, vy);
  a.vx = Math.max(-1600, Math.min(1600, vx)); a.vy = Math.max(-1600, Math.min(1600, vy));
  // 着地する場所：はなしたところの真下（地面の帯の中）
  a.floor = Math.max(bandTop() - a.size * .2, Math.min(bandBot() - a.size, a.y + (a.y < bandTop() - a.size ? rand(0, bandBot() - bandTop()) : 0)));
  if (a.y > a.floor) a.floor = Math.min(bandBot() - a.size, a.y);
  a.hover = 0;
  if (a.flier && sp < 600) a.floor = Math.min(a.floor, a.y);
  if (sp > 900) { a.spin = (vx > 0 ? 1 : -1) * Math.min(720, sp * .5); say(a, 'ひゅーーん！', 1200); }
  a.air = true; setState(a, 'air', 99);
}
function land(a, impact){
  a.air = false; a.vx = 0; a.vy = 0; a.spin = 0; a.rot = 0;
  a.el.querySelector('.inner').style.rotate = '';
  a.el.classList.remove('squash'); void a.el.offsetWidth; a.el.classList.add('squash');
  setTimeout(() => a.el.classList.remove('squash'), 500);
  if (impact > 1100) { setState(a, 'dizzy', 2.2); say(a, 'くらくら〜'); sfx('soft'); }
  else if (impact > 500) { setState(a, 'jump', 1.4); say(a, pick(['ぽよん！', 'たのしかった！', 'もういっかい！'])); sfx('po'); }
  else { setState(a, 'look', 1.4); say(a, pick(['ここ、いいね', 'とうちゃく！', 'ふぅ'])); }
  // 近くの子とぶつかったら、いっしょにびっくり
  agents.forEach(b => { if (b !== a && !b.air && Math.abs(b.x - a.x) < a.size * .7 && Math.abs(b.y - a.y) < a.size * .6) { setState(b, 'surprise', 1); say(b, 'わっ！', 1200); b.x += (b.x > a.x ? 1 : -1) * a.size * .5; } });
  a.tx = a.x; a.ty = a.y;
}

function choose(a){
  const night = world.classList.contains('t-night');
  const r = Math.random();
  const sleepy = night ? .35 : .12;
  if (r < sleepy) return setState(a, 'sleep', rand(6, 14));
  if (r < sleepy + .1 && agents.length > 1) {
    const b = pick(agents.filter(x => x !== a && !x.air && !x.held));
    if (b) {
      a.friend = b; a.chase = Math.random() < .5;
      a.tx = b.x + (Math.random() < .5 ? -1 : 1) * b.size * .7; a.ty = b.y;
      a.vx = a.tx - a.x;
      return setState(a, 'walk', 6);
    }
  }
  if (r < sleepy + .16) return setState(a, 'look', 2.2);
  if (r < sleepy + .22) return setState(a, 'jump', 1.4);
  if (r < sleepy + .55) return setState(a, 'float', rand(2, 5));
  a.friend = null;
  a.tx = Math.max(4, Math.min(W() - a.size - 4, a.x + rand(-260, 260)));
  a.ty = groundY(a);
  a.vx = a.tx - a.x;
  setState(a, 'walk', 8);
}
// よんだら来てくれる
function callTo(x, y){
  agents.forEach(a => {
    if (a.air || a.held || a.state === 'pet') return;
    const d = Math.abs(a.x + a.size / 2 - x);
    if (d > 280) return;
    if (a.state === 'sleep' && Math.random() < .6) return;
    a.friend = null; a.chase = d > 140;
    a.tx = Math.max(4, Math.min(W() - a.size - 4, x - a.size / 2 + rand(-50, 50)));
    a.ty = Math.max(bandTop() - a.size * .2, Math.min(bandBot() - a.size, y - a.size * .8));
    a.vx = a.tx - a.x; setState(a, 'walk', 5);
    if (Math.random() < .4) say(a, pick(['よんだ？', 'いまいく〜', 'なになに？']), 1400);
  });
}

let last = performance.now(), lookTick = 0;
function tick(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (document.getElementById('home').classList.contains('active')) {
    lookTick++;
    for (const a of agents) {
      // つかまれているとき：ゆびにふんわりついてくる
      if (a.held) {
        a.x += (a.gx - a.x) * Math.min(1, dt * 18); a.y += (a.gy - a.y) * Math.min(1, dt * 18);
      } else if (a.air) {
        // なげられたとき：重力・かべではねる・着地
        const g = a.flier ? 900 : 2400;
        a.vy += g * dt; a.vx *= (1 - dt * (a.flier ? 1.6 : .6));
        if (a.flier) a.vy *= (1 - dt * 1.2);
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.spin) { a.rot = (a.rot || 0) + a.spin * dt; a.spin *= (1 - dt * .8); a.el.querySelector('.inner').style.rotate = a.rot + 'deg'; }
        if (a.x < 0) { a.x = 0; a.vx = Math.abs(a.vx) * .6; sfx('po'); }
        if (a.x > W() - a.size) { a.x = W() - a.size; a.vx = -Math.abs(a.vx) * .6; sfx('po'); }
        if (a.y < 40) { a.y = 40; a.vy = Math.abs(a.vy) * .4; }
        if (a.y >= a.floor && a.vy > 0) {
          a.y = a.floor;
          const impact = a.vy;
          if (impact > 420 && !a.flier) { a.vy = -impact * .42; a.vx *= .7; a.el.classList.remove('squash'); void a.el.offsetWidth; a.el.classList.add('squash'); sfx('po'); a.bounces = (a.bounces || 0) + 1; if (a.bounces > 3) { a.bounces = 0; land(a, 0); } }
          else { a.bounces = 0; land(a, impact + (a.lastImpact || 0)); }
          a.lastImpact = impact;
        }
      } else {
        a.t -= dt;
        if (a.state === 'walk') {
          if (a.friend) { if (a.friend.air || a.friend.held) a.friend = null; else { a.tx = a.friend.x + (a.x < a.friend.x ? -1 : 1) * a.friend.size * .72; a.ty = a.friend.y; } }
          const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
          const spd = (a.chase ? 90 : 42) * dt;
          if (d < 4) {
            if (a.friend) {
              if (a.chase) { setState(a, 'jump', 1.4); if (a.friend.state !== 'sleep') setState(a.friend, 'jump', 1.4); say(a, 'つかまえた！'); }
              else { setState(a, 'look', 3); heart(a, pick(['💗','✨','🫧'])); say(a, 'くっつき〜'); }
              a.friend = null;
            } else setState(a, 'float', rand(1.5, 4));
          } else {
            a.x += dx / d * Math.min(spd, d); a.y += dy / d * Math.min(spd, d);
            if (Math.random() < .0008) { setState(a, 'fall', 1.6); say(a, 'ころん…'); }
          }
        }
        if (a.state === 'sleep' && Math.random() < .002) { a.el.classList.add('st-roll'); setTimeout(() => a.el.classList.remove('st-roll'), 2400); }
        if (a.t <= 0) {
          if (a.state === 'fall') { setState(a, 'surprise', .8); say(a, 'えへへ'); }
          else if (a.state === 'dizzy') { setState(a, 'look', 1.5); say(a, 'えへへ、もういっかい！'); }
          else choose(a);
        }
      }
      a.el.style.transform = `translate(${a.x}px, ${a.y}px)`;
      a.el.style.zIndex = a.held || a.air ? 900 : Math.round(a.y + a.size);
      // かげ：空中にいるほど、うすく小さく
      const h = Math.max(0, (a.air || a.held ? a.floor : a.y + (a.hover || 0)) - a.y);
      const sh = a.el.firstChild; sh.style.transform = `translateY(${h}px) scale(${Math.max(.35, 1 - h / 400)})`; sh.style.opacity = Math.max(.25, 1 - h / 300);
      // 目がゆびを追いかける
      if (lookTick % 3 === 0) {
        const lk = a.el.querySelector('.look');
        if (lk) {
          let tx = pointer.x, ty = pointer.y;
          const heldOne = agents.find(b => b.held || b.air);
          if (heldOne && heldOne !== a) { tx = heldOne.x + heldOne.size / 2; ty = heldOne.y + heldOne.size / 2; }
          if (tx >= 0 && now - pointer.t < 4000 || heldOne) {
            const cx = a.x + a.size / 2, cy = a.y + a.size / 2, dx = tx - cx, dy = ty - cy, dd = Math.hypot(dx, dy) || 1;
            const m = Math.min(1, dd / 200) * 3.2, flip = a.el.classList.contains('flip') ? -1 : 1;
            lk.style.transform = `translate(${(dx / dd * m * flip).toFixed(2)}px, ${(dy / dd * m).toFixed(2)}px)`;
          } else lk.style.transform = '';
        }
      }
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.renderHomeFairies = function(){
  stage.querySelectorAll('.fy,.empty-hint').forEach(x => x.remove()); agents = [];
  const list = S.fairies.slice(-14);
  list.forEach(f => agents.push(makeAgent(f)));
  if (!list.length) {
    stage.insertAdjacentHTML('beforeend', `<div class="empty-hint glass" style="padding:18px 22px;border-radius:24px">
      <div style="font-size:34px">✨</div><div style="font-weight:800;margin:6px 0">まだ、だれもいないみたい</div>
      <div class="sub" style="margin:0">タスクをひとつ終えると<br>粒子の向こうから妖精がやってきます</div>
      <button class="btn" style="margin-top:12px" onclick="go('task')">タスクを見る</button></div>`);
  }
  showHowTo();
};
function showHowTo(){
  if (S.seenTouchHelp || !agents.length) return;
  S.seenTouchHelp = true; save();
  setTimeout(() => toast('しぽぽをタップ・長おし（なでなで）・ドラッグしてなげてみてね'), 1500);
}
stage.addEventListener('pointerdown', e => {
  if (e.target !== stage) return;
  const r = stage.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
  sfx('tap'); sparkleAt(x, y);
  if (y > bandTop() - 60) callTo(x, y);
  else agents.forEach(a => { if (Math.abs(a.x + a.size/2 - x) < 260 && a.state !== 'sleep' && !a.air && !a.held) { a.vx = x - a.x; setState(a, 'look', 1.8); } });
});
addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.t = performance.now();
  // 背景の奥行き（パララックス）
  const px = (e.clientX / innerWidth - .5), py = (e.clientY / innerHeight - .5);
  world.style.setProperty('--px', px.toFixed(3)); world.style.setProperty('--py', py.toFixed(3));
}, { passive: true });

// ----- 世界の小さなできごと -----
function shootingStar(){
  if (!world.classList.contains('t-night') || !document.getElementById('home').classList.contains('active')) return;
  const s = document.createElement('div'); s.className = 'shoot';
  s.style.left = rand(10, 70) + '%'; s.style.top = rand(4, 30) + '%';
  world.appendChild(s); setTimeout(() => s.remove(), 1600);
  const a = agents.find(x => x.state !== 'sleep' && !x.air && !x.held);
  if (a && Math.random() < .5) { setState(a, 'look', 2); say(a, 'ながれぼし！ おねがいごと…'); }
}
setInterval(() => { if (Math.random() < .5) shootingStar(); }, 7000);
function gust(){
  if (!document.getElementById('home').classList.contains('active') || document.hidden) return;
  const plants = document.getElementById('plants'); plants.classList.add('gust'); setTimeout(() => plants.classList.remove('gust'), 3200);
  const cols = ['#ffc2dc', '#fff0a8', '#d6c8ff', '#bfe6ff', '#c9f3d8'];
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('div'); p.className = 'petal';
    p.style.top = rand(30, 85) + '%'; p.style.background = pick(cols); p.style.animationDelay = rand(0, 1.2) + 's'; p.style.setProperty('--dy', rand(-120, 60) + 'px');
    world.appendChild(p); setTimeout(() => p.remove(), 4600);
  }
  agents.forEach(a => { if (!a.air && !a.held && a.state !== 'sleep' && Math.random() < .4) { a.el.classList.add('windy'); setTimeout(() => a.el.classList.remove('windy'), 1500); } });
  const a = agents.find(x => x.state !== 'sleep' && !x.air && !x.held);
  if (a) say(a, pick(['わっ、かぜ！', 'ひゅ〜', 'おはなのかおり〜']));
}
setInterval(() => { if (Math.random() < .45) gust(); }, 18000);
// ひるはちょうちょ
(function butterflies(){
  const BF = c => `<svg viewBox="0 0 24 20"><g class="wing"><ellipse cx="7" cy="8" rx="6" ry="7" fill="${c}"/><ellipse cx="17" cy="8" rx="6" ry="7" fill="${c}"/><ellipse cx="8" cy="15" rx="4" ry="4" fill="${c}" opacity=".8"/><ellipse cx="16" cy="15" rx="4" ry="4" fill="${c}" opacity=".8"/></g><rect x="11" y="4" width="2" height="13" rx="1" fill="#6b5fa0"/></svg>`;
  const bs = [0, 1, 2].map(i => { const b = document.createElement('div'); b.className = 'home-bfly'; b.innerHTML = BF(['#ffc2dc','#fff0a8','#cfe0ff'][i]); b.style.left = rand(10, 90) + '%'; b.style.top = rand(50, 80) + '%'; world.appendChild(b); return b; });
  setInterval(() => { const day = !world.classList.contains('t-night'); bs.forEach(b => { b.style.opacity = day ? 1 : 0; if (Math.random() < .7) { b.style.left = rand(5, 95) + '%'; b.style.top = rand(45, 85) + '%'; } }); }, 2600);
})();

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
    ${opts.extra || ''}
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
