// ===== 保存・共通の道具 =====
(function(){
const KEY = 'shipopo.v1';
const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
window.todayStr = todayStr;
window.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

function fresh(){
  const t = todayStr();
  return {
    v: 1,
    created: Date.now(),
    tasks: [
      { id: uid(), title: 'お水をいっぱい飲む', cat: 'body', prio: 1, date: t, time: '', repeat: 'none', done: false, created: Date.now() },
      { id: uid(), title: 'まどを開けて空気を入れかえる', cat: 'life', prio: 0, date: t, time: '', repeat: 'daily', done: false, created: Date.now()+1 },
      { id: uid(), title: '好きな音楽を1曲きく', cat: 'fun', prio: 0, date: '', time: '', repeat: 'none', done: false, created: Date.now()+2 },
    ],
    history: [],            // 完了履歴 {title, at, fairy}
    fairies: [],            // {uid, sp, born, name?, how}
    dex: {},                // sp -> {first, count, how, fusions:[]}
    seeds: { H: 4, O: 2, C: 2, N: 0, Na: 1, Cl: 1 },
    facts: {},              // key -> at
    island: { bg: 'meadow', items: [
      { id: uid(), t: 'tree', x: 26, y: 58 }, { id: uid(), t: 'house', x: 62, y: 56 },
      { id: uid(), t: 'flower', x: 42, y: 80 }, { id: uid(), t: 'pond', x: 74, y: 82 }
    ] },
    bath: [], runs: [],
    points: 50, pointLog: [], gift: '',
    settings: { sound: true, skipBirth: false, level: 1, bgm: true, bgmVol: 60, bgmTrack: 'auto' },
  };
}

let st;
try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e) { st = null; }
const hadLocal = !!(st && st.v === 1);
if (!hadLocal) st = fresh();
// たりない項目をおぎなう
const base = fresh();
for (const k in base) if (st[k] === undefined) st[k] = base[k];
// 島の新しい項目
st.settings = Object.assign({}, base.settings, st.settings);
st.island.size = st.island.size || 1;
st.island.owned = st.island.owned || [];
st.island.items.forEach(it => { it.lv = it.lv || 1; it.s = it.s || 1; });
window.S = st;

let saveT = 0;
// ===== 保存：この端末の2か所（localStorage と IndexedDB）に二重で保存 =====
let idb = null;
function openIDB(){
  if (idb) return idb;
  idb = new Promise((res, rej) => { try { const r = indexedDB.open('shipopo', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch(e) { rej(e); } });
  return idb;
}
function idbPut(val){ return openIDB().then(db => new Promise(res => { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(val, KEY); tx.oncomplete = res; tx.onerror = res; })).catch(() => {}); }
function idbGet(){ return openIDB().then(db => new Promise(res => { const tx = db.transaction('kv'); const r = tx.objectStore('kv').get(KEY); r.onsuccess = () => res(r.result); r.onerror = () => res(null); })).catch(() => null); }
window.saveStatus = { local: false, idb: false, at: 0 };
window.save = function(){
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    S.savedAt = Date.now();
    const txt = JSON.stringify(S);
    try { localStorage.setItem(KEY, txt); saveStatus.local = true; } catch(e) { saveStatus.local = false; }
    idbPut(txt).then(() => { saveStatus.idb = true; });
    saveStatus.at = S.savedAt;
  }, 150);
};
// localStorage が消えていても IndexedDB に残っていれば元にもどす
window.restoreFromIDB = function(){
  return idbGet().then(txt => {
    if (!txt) return false;
    let d; try { d = JSON.parse(txt); } catch(e) { return false; }
    if (!d || d.v !== 1) return false;
    if (hadLocal && (S.savedAt || 0) >= (d.savedAt || 0)) return false;
    importData(d); return true;
  });
};
// ブラウザの自動消去で消えにくくする
window.askPersist = function(){ try { return navigator.storage && navigator.storage.persist ? navigator.storage.persist() : Promise.resolve(false); } catch(e) { return Promise.resolve(false); } };
window.isPersisted = function(){ try { return navigator.storage && navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false); } catch(e) { return Promise.resolve(false); } };
// ファイルに保存
window.downloadBackup = function(){
  const d = new Date(), name = `shipopo-backup-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}.json`;
  S.settings.lastBackup = Date.now(); save();
  try {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    return name;
  } catch(e) { return null; }
};
window.resetAll = function(){ const n = fresh(); n.tasks = []; n.welcomed = true; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, n); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {} idbPut(JSON.stringify(S)); };
window.importData = function(obj){ if (!obj || obj.v !== 1 || !Array.isArray(obj.tasks)) throw new Error('bad'); const b = fresh(); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, b, obj); S.settings = Object.assign({}, b.settings, obj.settings); S.island.owned = S.island.owned || []; S.island.size = S.island.size || 1; S.welcomed = true; save(); };

// ===== 音（その場でつくる、やわらかい音） =====
let ac = null;
function ctx(){ if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function tone(f, t0, dur, type='sine', vol=.12, f2){
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, a.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + .05);
}
window.sfx = function(name){
  if (!S.settings.sound) return;
  try {
    switch(name){
      case 'tap': tone(880, 0, .12, 'sine', .07, 1320); break;
      case 'po': tone(520 + Math.random()*120, 0, .14, 'sine', .08, 900); break;
      case 'pon': tone(392, 0, .5, 'triangle', .16, 1568); tone(784, .05, .6, 'sine', .1, 1175); tone(1568, .1, .5, 'sine', .05); break;
      case 'sparkle': [1319,1568,1976,2637].forEach((f,i)=>tone(f, i*.07, .3, 'sine', .05)); break;
      case 'bond': tone(300, 0, .4, 'sine', .1, 900); tone(600, .25, .4, 'triangle', .07, 1200); break;
      case 'soft': tone(660, 0, .3, 'sine', .06, 440); break;
      case 'splash': tone(200, 0, .3, 'sine', .08, 600); tone(900, .05, .2, 'sine', .04, 400); break;
      case 'yay': [523,659,784,1047].forEach((f,i)=>tone(f, i*.09, .35, 'triangle', .09)); break;
    }
  } catch(e) {}
};

// ===== 小さなお知らせ・モーダル =====
let toastT = 0;
window.toast = function(msg){ const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400); };
window.openModal = function(html, onMount){
  const m = document.getElementById('modal'), c = document.getElementById('modalCard');
  c.innerHTML = `<button class="close" data-close>✕</button>` + html;
  m.classList.remove('hidden');
  if (onMount) onMount(c);
};
window.closeModal = function(){ document.getElementById('modal').classList.add('hidden'); };
document.addEventListener('click', e => {
  if (e.target.closest('[data-close]') || e.target.id === 'modal') closeModal();
});
window.esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.fmtDate = (ts) => { const d = new Date(ts); return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`; };
window.rand = (a, b) => a + Math.random() * (b - a);
window.pick = arr => arr[Math.floor(Math.random() * arr.length)];

// 雑学を「見つけた」に登録
window.learnFact = function(key){ if (!S.facts[key]) { S.facts[key] = Date.now(); save(); return true; } return false; };

// 妖精を迎える
window.addFairy = function(spId, how){
  const sp = SPECIES_BY_ID[spId];
  const f = { uid: uid(), sp: spId, born: Date.now(), how };
  S.fairies.push(f);
  const isNew = !S.dex[spId];
  if (isNew) S.dex[spId] = { first: Date.now(), count: 0, how, fusions: [] };
  S.dex[spId].count++;
  learnFact('sp:' + spId);
  save();
  return { f, sp, isNew };
};
// ===== ポイント =====
window.addPoints = function(n, why){
  if (!n) return;
  S.points = (S.points || 0) + n;
  S.pointLog.push({ at: Date.now(), n, why }); if (S.pointLog.length > 300) S.pointLog.splice(0, S.pointLog.length - 300);
  save(); if (window.renderSeedBar) renderSeedBar();
  const el = document.createElement('div'); el.className = 'pt-float'; el.textContent = '+' + n + ' pt';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1600);
};
window.spendPoints = function(n, why){
  if ((S.points || 0) < n) { toast('ポイントがちょっと足りないみたい。あと ' + (n - S.points) + ' pt'); return false; }
  S.points -= n; S.pointLog.push({ at: Date.now(), n: -n, why }); save(); if (window.renderSeedBar) renderSeedBar(); sfx('sparkle'); return true;
};
window.addSeeds = function(obj){ for (const k in obj) S.seeds[k] = (S.seeds[k] || 0) + obj[k]; save(); if (window.renderSeedBar) renderSeedBar(); };
})();
