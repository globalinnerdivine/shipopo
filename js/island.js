// ===== 自分だけの島（つくる・ながめる・妖精が遊ぶ） =====
(function(){
const $ = (s, r = document) => r.querySelector(s);
let mode = 'view', selId = null, agents = [], timers = [], cv = null;
const T = (ms, fn) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const I = (ms, fn) => { const t = setInterval(fn, ms); timers.push(t); return t; };
const clearAll = () => { timers.forEach(t => { clearTimeout(t); clearInterval(t); }); timers = []; agents = []; };
const active = () => $('#island').classList.contains('active');
const ownedItem = id => ITEM_BY_ID[id].price === 0 || S.island.owned.includes(id);
const LAND = { 1: { l: 12, h: 50 }, 2: { l: 5, h: 56 }, 3: { l: 1, h: 62 } };

function richness(){
  const sc = S.island.items.reduce((a, it) => a + (it.lv || 1), 0) + S.fairies.length * 0.5;
  return sc < 5 ? 'うまれたての島' : sc < 12 ? 'すこしずつ育ってる島' : sc < 25 ? 'にぎやかな島' : sc < 45 ? 'きらきらの島' : 'しぽぽの楽園';
}

window.leaveIsland = () => { clearAll(); document.body.classList.remove('zen'); };

window.renderIsland = function(){
  clearAll();
  const p = $('#islandPanel');
  const size = S.island.size || 1, land = LAND[size];
  p.innerHTML = `
    <div class="isl-bar glass">
      <div><b>🏝️ 自分だけの島</b> <span class="richness">｜ ${richness()}・${ISLAND_SIZES[size].name}</span></div>
      <div class="row" style="gap:6px">
        <div class="seg" id="iMode"><button data-mode="view" class="${mode==='view'?'on':''}">👀 みる</button><button data-mode="edit" class="${mode==='edit'?'on':''}">🛠 つくる</button></div>
        <div class="seg" id="iBg">${[['meadow','🌼','草原'],['night','🌙','星空'],['sea','🌊','海辺'],['forest','🌲','森']].map(([k,n,t])=>`<button data-bg="${k}" title="${t}" class="${S.island.bg===k?'on':''}">${n}</button>`).join('')}</div>
        <button class="btn soft small" id="iZen" title="画面いっぱいでながめる">⛶</button>
      </div>
    </div>
    <div class="isl-canvas ${mode}" id="iCanvas">
      <div class="isl-bg b-${S.island.bg}"><div class="isl-sun"></div><div class="isl-cloud a"></div><div class="isl-cloud b"></div><div class="isl-land" id="iLand" style="left:${land.l}%;right:${land.l}%;height:${land.h}%"></div></div>
      <div class="isl-amb" id="iAmb"></div>
      <div class="isl-tools" id="iTools"></div>
      <div class="isl-hint" id="iHint">${mode==='view' ? 'パーツや妖精をタップしてみてね' : 'パーツを選んで置こう。ドラッグで動かせるよ'}</div>
      <button class="btn soft small zen-exit" id="iZenExit">もどる</button>
    </div>
    ${mode === 'edit' ? `<div class="palette glass" id="iPal">${ISLAND_ITEMS.map(it => {
      const own = ownedItem(it.id);
      return `<button data-add="${it.id}" class="${own?'':'locked'}">${itemArt(it.id)}<span>${it.name}</span>${own?'':`<em>🔒 ${it.price}pt</em>`}</button>`; }).join('')}</div>`
      : `<div class="isl-foot glass"><span>妖精 ${S.fairies.length}・パーツ ${S.island.items.length}</span><button class="btn small" onclick="go('shop')">✨ おみせ（${S.points}pt）</button></div>`}`;
  cv = $('#iCanvas');
  S.island.items.forEach(it => cv.appendChild(itemEl(it)));
  p.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { mode = b.dataset.mode; selId = null; sfx('tap'); renderIsland(); });
  p.querySelectorAll('[data-bg]').forEach(b => b.onclick = () => { S.island.bg = b.dataset.bg; save(); renderIsland(); });
  $('#iZen').onclick = () => { document.body.classList.add('zen'); setTimeout(() => layoutAll(), 50); };
  $('#iZenExit').onclick = () => { document.body.classList.remove('zen'); setTimeout(() => layoutAll(), 50); };
  p.querySelectorAll('[data-add]').forEach(b => b.onclick = () => addItem(b.dataset.add));
  cv.addEventListener('pointerdown', e => { if (e.target === cv || e.target.closest('.isl-bg')) select(null); });
  T(30, () => { const tall = cv.clientHeight > cv.clientWidth * 1.15; if (tall) $('#iLand').style.height = (land.h + 4) + '%'; layoutAll(); spawnFairies(); ambient(); });
  T(4000, () => { const h = $('#iHint'); if (h) h.style.opacity = 0; });
};
addEventListener('resize', () => { if (cv && active()) layoutAll(); });

// ---------- パーツ ----------
function itemW(it){
  const W = cv ? cv.clientWidth : 600;
  const k = ['river','grass','pond','flowerbed','onsen','rainbow'].includes(it.t) ? 1.3 : ['ferris','house','windmill'].includes(it.t) ? 1.15 : 1;
  return Math.max(58, Math.min(140, W * 0.13)) * k * (it.s || 1) * (1 + ((it.lv || 1) - 1) * 0.08);
}
function layoutAll(){ if (!cv) return; cv.querySelectorAll('.isl-item').forEach(el => { const it = S.island.items.find(x => x.id === el.dataset.id); if (it) el.style.setProperty('--w', itemW(it) + 'px'); }); }
function itemEl(it){
  const el = document.createElement('div');
  el.className = 'isl-item' + (it.id === selId ? ' sel' : ''); el.dataset.id = it.id;
  el.style.setProperty('--w', itemW(it) + 'px');
  el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.zIndex = Math.round(it.y * 10);
  el.innerHTML = `<div class="art" style="${it.f ? 'transform:scaleX(-1)' : ''}">${itemArt(it.t, it.lv || 1)}</div>`;
  let drag = null;
  el.addEventListener('pointerdown', e => {
    e.stopPropagation();
    drag = { r: cv.getBoundingClientRect(), moved: false, sx: e.clientX, sy: e.clientY };
    if (mode === 'edit') { try { el.setPointerCapture(e.pointerId); } catch(_) {} el.classList.add('drag'); }
  });
  el.addEventListener('pointermove', e => {
    if (!drag || mode !== 'edit') return;
    if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 5) drag.moved = true;
    if (!drag.moved) return;
    it.x = Math.max(2, Math.min(98, (e.clientX - drag.r.left) / drag.r.width * 100));
    it.y = Math.max(8, Math.min(99, (e.clientY - drag.r.top + 24) / drag.r.height * 100));
    el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.zIndex = Math.round(it.y * 10);
  });
  el.addEventListener('pointerup', () => {
    if (!drag) return;
    el.classList.remove('drag');
    if (mode === 'edit') { if (drag.moved) save(); select(it.id); }
    else react(it, el);
    drag = null;
  });
  return el;
}
function addItem(t){
  const info = ITEM_BY_ID[t];
  if (!ownedItem(t)) {
    openModal(`<div style="width:120px;height:120px;margin:0 auto">${itemArt(t)}</div><h2 style="justify-content:center">${info.name}</h2>
      <p class="sub" style="text-align:center">${info.price} pt で、ずっと使えるようになります（いくつでも置けます）。<br>いまのポイント：${S.points} pt</p>
      <div class="row" style="justify-content:center"><button class="btn soft" data-close>やめる</button><button class="btn" id="buyIt">${info.price} pt で手に入れる</button></div>`, c => {
      c.querySelector('#buyIt').onclick = () => { if (spendPoints(info.price, info.name)) { S.island.owned.push(t); save(); closeModal(); toast(info.name + ' を手に入れたよ！'); renderIsland(); setTimeout(() => addItem(t), 60); } };
    });
    return;
  }
  const it = { id: uid(), t, x: rand(30, 70), y: rand(62, 86), s: 1, f: 0, lv: 1 };
  S.island.items.push(it); save(); sfx('po');
  const el = itemEl(it); cv.appendChild(el); select(it.id); burst(it.x, it.y - 8);
}
function select(id){
  selId = id;
  cv.querySelectorAll('.isl-item').forEach(x => x.classList.toggle('sel', x.dataset.id === id));
  const tools = $('#iTools'); if (!tools) return;
  const it = S.island.items.find(x => x.id === id);
  if (!it) { tools.innerHTML = ''; return; }
  const lv = it.lv || 1, names = LV_NAMES[it.t];
  tools.innerHTML = `<div class="tool-name">${names ? names[lv-1] : ITEM_BY_ID[it.t].name} <small>Lv${lv}</small></div>
    ${lv < 3 ? `<button class="btn small" data-t="up">✨ グレードアップ ${UPGRADE_COST[lv+1]}pt</button>` : '<span class="maxlv">さいこうレベル ✨</span>'}
    <div class="row" style="gap:4px"><button class="btn soft small" data-t="big">＋</button><button class="btn soft small" data-t="small">－</button><button class="btn soft small" data-t="flip">↔</button><button class="btn soft small" data-t="del">🗑</button></div>`;
  tools.querySelectorAll('[data-t]').forEach(b => b.onclick = e => {
    e.stopPropagation();
    const t = b.dataset.t, el = cv.querySelector(`.isl-item[data-id="${it.id}"]`);
    if (t === 'del') { S.island.items = S.island.items.filter(x => x.id !== it.id); el.remove(); tools.innerHTML = ''; save(); sfx('soft'); return; }
    if (t === 'up') {
      const cost = UPGRADE_COST[lv + 1];
      if (!spendPoints(cost, 'グレードアップ')) return;
      it.lv = lv + 1; burst(it.x, it.y - 10, 24);
      toast(`${names ? names[it.lv-1] : ITEM_BY_ID[it.t].name} になったよ！ Lv${it.lv}`);
    }
    if (t === 'big') it.s = Math.min(2, (it.s || 1) + .15);
    if (t === 'small') it.s = Math.max(.5, (it.s || 1) - .15);
    if (t === 'flip') it.f = it.f ? 0 : 1;
    const n = itemEl(it); el.replaceWith(n); save(); sfx('tap'); select(it.id);
    if (t === 'up') { const h = $('.richness'); if (h) h.textContent = `｜ ${richness()}・${ISLAND_SIZES[S.island.size].name}`; }
  });
}

// ---------- タップしたときの反応 ----------
function fx(x, y, html, cls, ms = 1400){
  if (!cv) return;
  const d = document.createElement('div'); d.className = 'isl-fx ' + (cls || ''); d.innerHTML = html;
  d.style.left = x + '%'; d.style.top = y + '%'; cv.appendChild(d); setTimeout(() => d.remove(), ms);
}
function burst(x, y, n = 12){ for (let i = 0; i < n; i++) fx(x, y, '✦', 'spark', 1000), cv.lastChild.style.setProperty('--dx', rand(-50, 50) + 'px'), cv.lastChild.style.setProperty('--dy', rand(-60, 10) + 'px'); }
function hPct(it){ return itemW(it) / cv.clientHeight * 100; }
function wPct(it){ return itemW(it) / cv.clientWidth * 100; }
function wob(el){ el.classList.remove('wob'); void el.offsetWidth; el.classList.add('wob'); }
function react(it, el){
  sfx('po'); wob(el);
  const h = hPct(it), act = ITEM_BY_ID[it.t].act;
  if (it.t === 'tree') { const lv = it.lv || 1; for (let i = 0; i < 3; i++) setTimeout(() => fx(it.x + rand(-4, 4), it.y - h * .6, lv === 2 ? '🍎' : lv === 3 ? '🌸' : '🍃', 'drop', 1600), i * 180); }
  else if (act === 'enter') { el.classList.add('lit'); setTimeout(() => el.classList.remove('lit'), 1800); fx(it.x, it.y - h, '💡', 'up'); }
  else if (act === 'swim') { fx(it.x, it.y - h * .2, '', 'ripple', 1600); fx(it.x + 3, it.y - h * .25, '', 'ripple', 1600); }
  else if (act === 'sniff') { butterfly(it.x, it.y - h * .5); }
  else if (it.t === 'treasure') openChest(it);
  else if (act === 'sleep') fx(it.x, it.y - h * .6, 'z z z', 'up');
  else burst(it.x, it.y - h * .5, 8);
}
function openChest(it){
  const today = todayStr();
  if (S.gift === today) { toast('いまは からっぽ。あしたまた、なにか入ってるかも'); return; }
  const k = pick(['H','H','O','C','N','Na','Cl']); S.gift = today; addSeeds({ [k]: 1 });
  burst(it.x, it.y - 8, 18); sfx('sparkle'); toast(`宝箱から ${ELEMENTS[k].name}（${k}）のたねを見つけた！`);
}

// ---------- 妖精たち ----------
function spawnFairies(){
  if (!cv) return;
  const fs = S.fairies.slice(-10); const land = LAND[S.island.size || 1];
  fs.forEach((f, i) => {
    const sp = SPECIES_BY_ID[f.sp];
    const el = document.createElement('div'); el.className = 'isl-fairy';
    el.innerHTML = `<div class="inner">${fairySVG(sp)}</div>`;
    cv.appendChild(el);
    const a = { el, sp, x: rand(land.l + 12, 100 - land.l - 12), y: rand(66, 92), mood: 'normal' };
    place(a, a.x, a.y, 0);
    el.addEventListener('pointerdown', e => { e.stopPropagation(); tapFairy(a); });
    agents.push(a);
    T(400 + i * 700, () => next(a));
  });
}
function setMood(a, m){ if (a.mood === m) return; a.mood = m; a.el.querySelector('.inner').innerHTML = fairySVG(a.sp, { mood: m }); }
function place(a, x, y, dur){
  const land = LAND[S.island.size || 1];
  x = Math.max(land.l + 4, Math.min(100 - land.l - 4, x)); y = Math.max(20, Math.min(97, y));
  const d = Math.hypot((x - a.x) * cv.clientWidth, (y - a.y) * cv.clientHeight) / 100;
  const ms = dur != null ? dur : Math.max(600, d * 22);
  a.el.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out, opacity .6s, transform .6s`;
  a.el.classList.toggle('flip', x < a.x);
  a.el.style.left = x + '%'; a.el.style.top = y + '%'; a.el.style.zIndex = Math.round(y * 10) + 5;
  a.x = x; a.y = y;
  return ms;
}
function say(a, t, ms = 2000){
  a.el.querySelector('.bubble')?.remove();
  const b = document.createElement('div'); b.className = 'bubble'; b.textContent = t; a.el.appendChild(b); setTimeout(() => b.remove(), ms);
}
function state(a, cls){ a.el.className = 'isl-fairy' + (a.el.classList.contains('flip') ? ' flip' : '') + (cls ? ' ' + cls : ''); }
function tapFairy(a){
  sfx('po'); state(a, 'jump'); setMood(a, 'happy'); say(a, pick([a.sp.fact.line, 'あそぼ！', 'この島すき！', 'えへへ']), 2400);
  setTimeout(() => { if (a.el.classList.contains('jump')) state(a, ''); }, 1400);
}
function next(a){
  if (!active() || !cv || !a.el.isConnected) return;
  setMood(a, 'normal'); state(a, 'walk'); a.el.style.opacity = 1;
  const items = S.island.items;
  if (items.length && Math.random() < .7) {
    const it = pick(items); const act = ITEM_BY_ID[it.t].act;
    const h = hPct(it), w = wPct(it);
    let tx = it.x + rand(-.25, .25) * w, ty = it.y + 1.5;
    if (act === 'swing') { tx = it.x; ty = it.y - h * .3; }
    else if (act === 'sleep' || act === 'sit') { tx = it.x; ty = it.y - h * .22; }
    else if (act === 'swim') { tx = it.x + rand(-.15, .15) * w; ty = it.y - h * .12; }
    else if (act === 'slide') { tx = it.x - w * .3; ty = it.y - h * .55; }
    else if (act === 'enter') { tx = it.x; ty = it.y; }
    const ms = place(a, tx, ty);
    T(ms + 50, () => doAct(a, it, act));
  } else {
    const ms = place(a, a.x + rand(-25, 25), a.y + rand(-10, 10));
    T(ms + 50, () => { state(a, pick(['', 'look', 'jump'])); if (Math.random() < .3) say(a, pick(['ふんふ〜ん♪', 'いいてんき', 'きらきら', '…'])); T(rand(1500, 3500), () => next(a)); });
  }
}
function doAct(a, it, act){
  if (!active() || !a.el.isConnected) return;
  const el = cv.querySelector(`.isl-item[data-id="${it.id}"]`);
  if (!el) return next(a);
  const h = hPct(it), w = wPct(it); let dur = 3500;
  switch (act) {
    case 'enter': state(a, 'inside'); a.el.style.opacity = 0; T(900, () => el.classList.add('lit')); say(a, 'ただいま〜', 1200);
      dur = 4800; T(4200, () => { el.classList.remove('lit'); a.el.style.opacity = 1; state(a, 'jump'); setMood(a, 'happy'); fx(a.x, a.y - 10, '💗', 'up'); }); break;
    case 'shake': state(a, 'jump'); wob(el); say(a, (it.lv||1) >= 2 ? 'くだもの、みーっけ！' : 'ゆさゆさ〜');
      T(400, () => fx(it.x + rand(-3, 3), it.y - h * .6, (it.lv||1) === 2 ? '🍎' : (it.lv||1) === 3 ? '🌸' : '🍃', 'drop', 1600)); break;
    case 'sniff': state(a, 'look'); setMood(a, 'happy'); say(a, 'いいにおい〜'); butterfly(it.x, it.y - h * .5); break;
    case 'swim': state(a, 'swim'); setMood(a, 'happy'); say(a, it.t === 'onsen' ? 'ぽかぽか〜♨' : 'ぷかぷか'); fx(a.x, a.y, '', 'ripple', 1600); T(1500, () => fx(a.x, a.y, '', 'ripple', 1600)); dur = 5000; break;
    case 'swing': state(a, 'swinging'); setMood(a, 'happy'); say(a, 'わーい！'); dur = 6000; break;
    case 'sleep': state(a, 'sleep'); setMood(a, 'sleep'); a.el.insertAdjacentHTML('beforeend', '<div class="zzz">z<small>z</small></div>'); dur = 7000; T(dur - 100, () => a.el.querySelector('.zzz')?.remove()); break;
    case 'sit': state(a, 'sit'); say(a, 'ひとやすみ'); dur = 4500; break;
    case 'slide': say(a, 'しゅーっ！', 1500); state(a, 'slide'); place(a, it.x + w * .44, it.y - h * .04, 700); dur = 1600; T(700, () => { state(a, 'jump'); setMood(a, 'happy'); }); break;
    case 'dance': state(a, 'jump'); say(a, '♪ ♪'); burst(it.x, it.y - h * .5, 6); dur = 3000; break;
    case 'glow': state(a, 'look'); setMood(a, 'happy'); burst(it.x, it.y - h * .4, 8); say(a, 'ひかってる！'); break;
    case 'open': state(a, 'look'); say(a, 'なにが入ってるかな？'); break;
    case 'roll': state(a, 'roll'); say(a, 'ごろごろ〜'); dur = 2600; break;
    case 'walk': place(a, it.x + w * .4, it.y - h * .05, 1800); state(a, 'walk'); dur = 2200; break;
    default: state(a, 'look'); say(a, pick(['きれい〜', 'すごい！', 'ほわぁ…'])); setMood(a, 'happy');
  }
  T(dur, () => { a.el.style.opacity = 1; next(a); });
}

// ---------- 島の生き物（パーツや時間でふえる） ----------
const BFLY = c => `<svg viewBox="0 0 24 20"><g class="wing"><ellipse cx="7" cy="8" rx="6" ry="7" fill="${c}"/><ellipse cx="17" cy="8" rx="6" ry="7" fill="${c}"/><ellipse cx="8" cy="15" rx="4" ry="4" fill="${c}" opacity=".8"/><ellipse cx="16" cy="15" rx="4" ry="4" fill="${c}" opacity=".8"/></g><rect x="11" y="4" width="2" height="13" rx="1" fill="#6b5fa0"/></svg>`;
function butterfly(x, y){
  if (!cv) return;
  const b = document.createElement('div'); b.className = 'bfly'; b.innerHTML = BFLY(pick(['#ffc2dc','#fff0a8','#cfe0ff','#e3d4ff']));
  b.style.left = x + '%'; b.style.top = y + '%'; $('#iAmb').appendChild(b);
  let n = 0; const mv = () => { if (!b.isConnected) return; b.style.left = Math.max(5, Math.min(95, parseFloat(b.style.left) + rand(-12, 12))) + '%'; b.style.top = Math.max(15, Math.min(90, parseFloat(b.style.top) + rand(-10, 8))) + '%'; if (++n > 5) { b.style.opacity = 0; setTimeout(() => b.remove(), 1200); } else setTimeout(mv, 1800); };
  setTimeout(mv, 50);
}
function ambient(){
  const amb = $('#iAmb'); if (!amb) return;
  const items = S.island.items, has = t => items.filter(i => i.t === t);
  const fl = has('flower').length + has('flowerbed').length * 2 + has('plant').length;
  // ちょうちょ：お花の数だけ
  const nb = Math.min(5, fl);
  for (let i = 0; i < nb; i++) {
    const b = document.createElement('div'); b.className = 'bfly stay'; b.innerHTML = BFLY(pick(['#ffc2dc','#fff0a8','#cfe0ff','#e3d4ff']));
    b.style.left = rand(15, 85) + '%'; b.style.top = rand(40, 80) + '%'; amb.appendChild(b);
    I(rand(2200, 3400), () => { b.style.left = rand(12, 88) + '%'; b.style.top = rand(35, 85) + '%'; });
  }
  // ほたる：星空の夜
  if (S.island.bg === 'night') for (let i = 0; i < 14; i++) {
    const f = document.createElement('div'); f.className = 'ffly'; f.style.left = rand(8, 92) + '%'; f.style.top = rand(30, 92) + '%'; f.style.animationDelay = -rand(0, 4) + 's'; amb.appendChild(f);
    I(rand(3000, 5000), () => { f.style.left = rand(8, 92) + '%'; f.style.top = rand(30, 92) + '%'; });
  }
  // さかな：池や川があるとき、ときどきジャンプ
  const water = items.filter(i => ['pond','river'].includes(i.t));
  if (water.length) I(5200, () => { if (!active()) return; const w = pick(water); fx(w.x + rand(-3, 3), w.y - hPct(w) * .2, `<svg viewBox="0 0 30 16" width="26"><path d="M2 8 C8 0 20 0 24 8 C20 16 8 16 2 8Z" fill="#ffb38a"/><path d="M24 8 L30 2 L30 14Z" fill="#ff9c7a"/><circle cx="8" cy="7" r="1.6" fill="#4a4166"/></svg>`, 'fish', 1400); });
  // ことり：昼の空
  if (S.island.bg !== 'night') I(9000, () => { if (!active() || Math.random() < .4) return; fx(-5, rand(6, 22), `<svg viewBox="0 0 30 14" width="28"><path d="M2 8 Q8 0 15 8 Q22 0 28 8" stroke="#8f86c9" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`, 'bird', 7000); });
}
})();
