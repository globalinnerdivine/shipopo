// ===== 各画面 =====
(function(){
const $ = (s, r = document) => r.querySelector(s);
window.COND = { heat: '🔥 熱', press: '⬇ 圧力', spark: '⚡ 火花', light: '☀ 光', water: '💧 水' };
const sub2 = s => s.replace(/(\d)/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);

// =========================================================
// タスク
// =========================================================
let tView = 'today', tSort = 'created', calSel = todayStr(), calMonth = new Date();
let draft = { cat: 'life', prio: 0, date: todayStr(), time: '', repeat: 'none' };
const catName = id => (CATEGORIES.find(c => c.id === id) || CATEGORIES[5]).name;
const addDays = (ds, n) => { const d = ds ? new Date(ds + 'T00:00') : new Date(); d.setDate(d.getDate() + n); return todayStr(d); };

window.renderTask = function(){
  const p = $('#taskPanel');
  p.innerHTML = `
    <h2>📝 タスク</h2>
    <p class="sub">できたら、まるをタップ。できなくても、ぜんぜん大丈夫。</p>
    <form class="quick" id="qForm">
      <input class="input" id="qIn" placeholder="やりたいことを1行で…（例：洗たくものをたたむ）" maxlength="80" autocomplete="off">
      <button type="button" class="btn soft addbtn" id="qMore" title="くわしく">⋯</button>
      <button class="btn addbtn" type="submit" title="追加">＋</button>
    </form>
    <div class="more-opt" id="qOpt">
      <div class="row"><span class="opt-label">しゅるい</span>${CATEGORIES.map(c => `<button type="button" class="chip ${draft.cat===c.id?'on':''}" data-cat="${c.id}">${FAMILIES[c.fam].icon} ${c.name}</button>`).join('')}</div>
      <div class="row"><span class="opt-label">日にち</span><input type="date" class="input" id="qDate" value="${draft.date}"><input type="time" class="input" id="qTime" value="${draft.time}">
        <button type="button" class="chip" data-dq="${todayStr()}">きょう</button><button type="button" class="chip" data-dq="${addDays('',1)}">あした</button><button type="button" class="chip" data-dq="">いつか</button></div>
      <div class="row"><span class="opt-label">くり返し</span>
        <div class="seg" id="qRep">${[['none','なし'],['daily','まいにち'],['weekly','まいしゅう']].map(([v,n])=>`<button type="button" data-rep="${v}" class="${draft.repeat===v?'on':''}">${n}</button>`).join('')}</div>
        <button type="button" class="chip ${draft.prio?'on':''}" id="qPrio">⭐ だいじ</button></div>
    </div>
    <div class="row" style="justify-content:space-between;margin-top:4px">
      <div class="seg" id="tViews">${[['today','きょう'],['all','ぜんぶ'],['cal','カレンダー'],['done','できた']].map(([v,n])=>`<button data-v="${v}" class="${tView===v?'on':''}">${n}</button>`).join('')}</div>
      ${tView==='today'||tView==='all' ? `<select class="input" id="tSort"><option value="created">追加した順</option><option value="prio">だいじな順</option><option value="date">日にち順</option></select>` : ''}
    </div>
    <div id="tBody"></div>`;
  if ($('#tSort')) { $('#tSort').value = tSort; $('#tSort').onchange = e => { tSort = e.target.value; renderTaskBody(); }; }
  $('#qMore').onclick = () => $('#qOpt').classList.toggle('open');
  p.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { draft.cat = b.dataset.cat; p.querySelectorAll('[data-cat]').forEach(x => x.classList.toggle('on', x === b)); });
  p.querySelectorAll('[data-dq]').forEach(b => b.onclick = () => { draft.date = b.dataset.dq; $('#qDate').value = draft.date; });
  $('#qDate').onchange = e => draft.date = e.target.value;
  $('#qTime').onchange = e => draft.time = e.target.value;
  p.querySelectorAll('[data-rep]').forEach(b => b.onclick = () => { draft.repeat = b.dataset.rep; p.querySelectorAll('[data-rep]').forEach(x => x.classList.toggle('on', x === b)); });
  $('#qPrio').onclick = e => { draft.prio = draft.prio ? 0 : 1; e.currentTarget.classList.toggle('on', !!draft.prio); };
  $('#qForm').onsubmit = e => {
    e.preventDefault();
    const v = $('#qIn').value.trim(); if (!v) { $('#qIn').focus(); return; }
    S.tasks.push({ id: uid(), title: v, cat: draft.cat, prio: draft.prio, date: draft.date, time: draft.time, repeat: draft.repeat, done: false, created: Date.now() });
    save(); sfx('tap'); $('#qIn').value = ''; renderTaskBody(); toast('追加したよ ✨');
  };
  p.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { tView = b.dataset.v; renderTask(); });
  renderTaskBody();
};

function sortTasks(list){
  const l = list.slice();
  if (tSort === 'prio') l.sort((a,b) => (b.prio - a.prio) || (a.created - b.created));
  else if (tSort === 'date') l.sort((a,b) => ((a.date||'9999') + (a.time||'99')).localeCompare((b.date||'9999') + (b.time||'99')));
  else l.sort((a,b) => a.created - b.created);
  return l;
}
function taskRow(t){
  const today = todayStr();
  const dl = !t.date ? 'いつか' : t.date === today ? 'きょう' : t.date === addDays('',1) ? 'あした' : t.date < today ? 'まえから（ゆっくりでOK）' : t.date.slice(5).replace('-','/');
  return `<div class="task" data-id="${t.id}">
    <button class="check" data-done="${t.id}" title="できた！">${FAMILIES[(CATEGORIES.find(c=>c.id===t.cat)||CATEGORIES[5]).fam].icon}</button>
    <div class="body"><div class="title">${t.prio?'<span class="prio">⭐</span> ':''}${esc(t.title)}</div>
      <div class="meta"><span>${catName(t.cat)}</span><span>${dl}${t.time?' '+t.time:''}</span>${t.repeat!=='none'?`<span>🔁 ${t.repeat==='daily'?'まいにち':'まいしゅう'}</span>`:''}</div></div>
    <div class="acts"><button data-later="${t.id}" title="あしたにする">🌙</button><button data-edit="${t.id}" title="へんしゅう">✏️</button></div>
  </div>`;
}
function renderTaskBody(){
  const b = $('#tBody'); if (!b) return;
  const today = todayStr();
  const open = S.tasks.filter(t => !t.done);
  if (tView === 'today' || tView === 'all') {
    const list = tView === 'today' ? open.filter(t => !t.date || t.date <= today) : open;
    b.innerHTML = list.length ? `<div class="task-list">${sortTasks(list).map(taskRow).join('')}</div>`
      : `<div class="empty">🍃<br>${tView==='today' ? 'きょうのタスクはありません。<br>のんびりしてもいいし、妖精に会いに行ってもいいよ。' : 'タスクはまだありません。<br>上の入力らんから、気軽にどうぞ。'}</div>`;
    const upcoming = tView === 'today' ? open.filter(t => t.date && t.date > today).length : 0;
    if (upcoming) b.insertAdjacentHTML('beforeend', `<p class="sub" style="margin-top:12px;text-align:center">これからの予定：${upcoming}こ（「ぜんぶ」で見られます）</p>`);
  } else if (tView === 'cal') {
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    let cells = ['日','月','火','水','木','金','土'].map(d => `<div class="dow">${d}</div>`).join('');
    for (let i = 0; i < first; i++) cells += '<div class="d blank"></div>';
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const o = open.filter(t => t.date === ds).length;
      const dn = S.history.filter(h => todayStr(new Date(h.at)) === ds).length;
      cells += `<button class="d ${ds===today?'today':''} ${ds===calSel?'sel':''}" data-day="${ds}">${d}<span class="dots">${'<i></i>'.repeat(Math.min(o,3))}${'<i class="dn"></i>'.repeat(Math.min(dn,3))}</span></button>`;
    }
    const dayTasks = open.filter(t => t.date === calSel);
    const dayDone = S.history.filter(h => todayStr(new Date(h.at)) === calSel);
    b.innerHTML = `<div class="row" style="justify-content:space-between;margin-top:12px"><button class="btn soft small" id="cPrev">◀</button><b>${y}年 ${m+1}月</b><button class="btn soft small" id="cNext">▶</button></div>
      <div class="cal">${cells}</div>
      <p class="sub" style="margin-top:8px"><span style="color:#b9a8ff">●</span> 予定　<span style="color:#5fd1b4">●</span> できたこと</p>
      <h3>${calSel.slice(5).replace('-','/')} のこと</h3>
      <div class="task-list">${dayTasks.map(taskRow).join('') || ''}${dayDone.map(h => `<div class="task done"><div class="check">✓</div><div class="body"><div class="title">${esc(h.title)}</div><div class="meta"><span>${h.fairy ? esc(SPECIES_BY_ID[h.fairy]?.name || '') + ' が生まれた' : ''}</span></div></div></div>`).join('')}</div>
      ${!dayTasks.length && !dayDone.length ? '<div class="empty">この日は、なにもない日。それもすてき。</div>' : ''}
      <div class="row" style="justify-content:center;margin-top:10px"><button class="btn soft small" id="cAdd">この日にタスクを入れる</button></div>`;
    $('#cPrev').onclick = () => { calMonth = new Date(y, m - 1, 1); renderTaskBody(); };
    $('#cNext').onclick = () => { calMonth = new Date(y, m + 1, 1); renderTaskBody(); };
    $('#cAdd').onclick = () => { draft.date = calSel; $('#qDate').value = calSel; $('#qOpt').classList.add('open'); $('#qIn').focus(); };
    b.querySelectorAll('[data-day]').forEach(x => x.onclick = () => { calSel = x.dataset.day; renderTaskBody(); });
  } else {
    const h = S.history.slice().reverse();
    b.innerHTML = h.length ? `<p class="sub" style="margin-top:12px">これまでにできたこと：${h.length}こ。ひとつひとつが、ふわふわの奇跡。</p><div class="task-list">${h.slice(0, 200).map(x => `<div class="task done"><div class="check" style="border-style:solid;border-color:#8fe3cf">${x.fairy ? `<div style="width:30px;height:30px">${fairySVG(SPECIES_BY_ID[x.fairy] || SPECIES[0])}</div>` : '✓'}</div><div class="body"><div class="title">${esc(x.title)}</div><div class="meta"><span>${fmtDate(x.at)}</span>${x.fairy ? `<span>${esc(SPECIES_BY_ID[x.fairy]?.name || '')}</span>` : ''}</div></div></div>`).join('')}</div>`
      : '<div class="empty">🌱<br>できたことがここにたまっていきます。</div>';
  }
  b.querySelectorAll('[data-done]').forEach(x => x.onclick = e => completeTask(x.dataset.done, e));
  b.querySelectorAll('[data-later]').forEach(x => x.onclick = () => { const t = S.tasks.find(t => t.id === x.dataset.later); t.date = addDays(t.date && t.date > todayStr() ? t.date : '', 1); save(); sfx('soft'); toast('あしたにしたよ。ゆっくりでOK 🌙'); renderTaskBody(); });
  b.querySelectorAll('[data-edit]').forEach(x => x.onclick = () => editTask(x.dataset.edit));
}

function pickBirthSpecies(cat){
  const fam = (CATEGORIES.find(c => c.id === cat) || CATEGORIES[5]).fam;
  let pool = SPECIES.filter(s => s.fam !== 'molecule');
  if (Math.random() < .55) pool = pool.filter(s => s.fam === fam);
  const unk = pool.filter(s => !S.dex[s.id]);
  if (unk.length && Math.random() < .6) pool = unk;
  return pick(pool);
}
function rollSeeds(){
  const w = [['H',4],['O',3],['C',3],['N',2],['Na',1],['Cl',1],['He',.6],['Mg',.6],['S',.6],['Ca',.6],['Fe',.8]];
  const out = {}; const n = Math.random() < .5 ? 2 : 1;
  for (let i = 0; i < n; i++) { let r = Math.random() * w.reduce((a, x) => a + x[1], 0); for (const [k, v] of w) { r -= v; if (r <= 0) { out[k] = (out[k]||0) + 1; break; } } }
  return out;
}
function completeTask(id, ev){
  const t = S.tasks.find(t => t.id === id); if (!t) return;
  t.done = true; t.doneAt = Date.now();
  if (t.repeat !== 'none') {
    const nd = addDays(t.date && t.date >= todayStr() ? t.date : todayStr(), t.repeat === 'daily' ? 1 : 7);
    S.tasks.push({ ...t, id: uid(), done: false, doneAt: null, date: nd, created: Date.now() });
  }
  S.tasks = S.tasks.filter(x => !x.done);
  const sp = pickBirthSpecies(t.cat);
  const { isNew } = addFairy(sp.id, `タスク「${t.title}」をやりとげた`);
  const seeds = rollSeeds(); addSeeds(seeds);
  addPoints(POINT_RULES.task, 'タスク「' + t.title.slice(0, 16) + '」');
  S.history.push({ title: t.title, at: Date.now(), fairy: sp.id });
  save();
  sfx('tap');
  const r = ev && ev.currentTarget ? ev.currentTarget.getBoundingClientRect() : null;
  playBirth({ sp, isNew, seeds, origin: r ? { x: r.left + r.width/2, y: r.top + r.height/2 } : null,
    onDone: () => { renderTaskBody(); renderHomeFairies(); updateHomeCard(); } });
}
function editTask(id){
  const t = S.tasks.find(t => t.id === id); if (!t) return;
  openModal(`<h2>✏️ へんしゅう</h2>
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px">
      <input class="input" id="eT" value="${esc(t.title)}" maxlength="80">
      <div class="row">${CATEGORIES.map(c => `<button class="chip ${t.cat===c.id?'on':''}" data-ec="${c.id}">${FAMILIES[c.fam].icon} ${c.name}</button>`).join('')}</div>
      <div class="row"><input type="date" class="input" id="eD" value="${t.date||''}"><input type="time" class="input" id="eTm" value="${t.time||''}">
        <select class="input" id="eR"><option value="none">くり返しなし</option><option value="daily">まいにち</option><option value="weekly">まいしゅう</option></select>
        <button class="chip ${t.prio?'on':''}" id="eP">⭐ だいじ</button></div>
      <div class="row" style="justify-content:space-between;margin-top:6px"><button class="btn soft small" id="eDel">🗑 けす</button><button class="btn" id="eSave">ほぞん</button></div>
    </div>`, c => {
    let cat = t.cat, prio = t.prio;
    c.querySelector('#eR').value = t.repeat;
    c.querySelectorAll('[data-ec]').forEach(b => b.onclick = () => { cat = b.dataset.ec; c.querySelectorAll('[data-ec]').forEach(x => x.classList.toggle('on', x === b)); });
    c.querySelector('#eP').onclick = e => { prio = prio ? 0 : 1; e.currentTarget.classList.toggle('on', !!prio); };
    c.querySelector('#eSave').onclick = () => {
      t.title = c.querySelector('#eT').value.trim() || t.title; t.cat = cat; t.prio = prio;
      t.date = c.querySelector('#eD').value; t.time = c.querySelector('#eTm').value; t.repeat = c.querySelector('#eR').value;
      save(); closeModal(); renderTaskBody(); toast('ほぞんしたよ');
    };
    const del = c.querySelector('#eDel');
    del.onclick = () => {
      if (!del.dataset.sure) { del.dataset.sure = 1; del.textContent = 'ほんとうにけす？'; del.style.background = '#ffe0ea'; return; }
      S.tasks = S.tasks.filter(x => x.id !== id); save(); closeModal(); renderTaskBody(); toast('けしたよ');
    };
  });
}

// =========================================================
// 図鑑
// =========================================================
let dexFam = 'all';
window.renderCollection = function(){
  const p = $('#collectionPanel');
  const list = SPECIES.filter(s => dexFam === 'all' || s.fam === dexFam);
  const met = Object.keys(S.dex).length;
  p.innerHTML = `<h2>📖 妖精ずかん</h2>
    <p class="sub">これまでに会えた子：<b>${met}</b>種類。ぜんぶ集めなくても大丈夫。会えた子を大切にね。</p>
    <div class="fam-tabs"><button class="chip ${dexFam==='all'?'on':''}" data-fam="all">すべて</button>${Object.entries(FAMILIES).map(([k,f]) => `<button class="chip ${dexFam===k?'on':''}" data-fam="${k}">${f.icon} ${f.name}</button>`).join('')}</div>
    <div class="dex">${list.map(s => { const d = S.dex[s.id];
      return `<button class="dex-item ${d?'':'unknown'}" data-sp="${s.id}">${d && d.count > 1 ? `<span class="ct">×${d.count}</span>` : ''}<div class="pic">${fairySVG(s, { silhouette: !d })}</div><div class="nm">${d ? esc(s.name) : '？？？'}</div></button>`; }).join('')}</div>
    <div class="note">シルエットの子は、まだ出会っていない子。どこかでのんびり待っています。</div>`;
  p.querySelectorAll('[data-fam]').forEach(b => b.onclick = () => { dexFam = b.dataset.fam; renderCollection(); });
  p.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => showDex(b.dataset.sp));
};
function showDex(id){
  const s = SPECIES_BY_ID[id], d = S.dex[id];
  if (!d) {
    const hint = s.fam === 'molecule' ? '合成研究所で見つかるかも。研究メモのヒントを見てね。' : `「${FAMILIES[s.fam].name}」の子。${CATEGORIES.filter(c => c.fam === s.fam).map(c => '「'+c.name+'」').join('')}のタスクのあとに会いやすいみたい。`;
    openModal(`<div class="dex-hero">${fairySVG(s, { silhouette: true })}</div><h2 style="justify-content:center">？？？</h2><p class="sub" style="text-align:center">${hint}</p>`);
    return;
  }
  const base = s.fam === 'molecule' ? `${esc(s.formula)}（${esc(s.kind)}）` : '自然の妖精（元素ではなく、自然や生き物がモチーフ）';
  const fus = d.fusions && d.fusions.length ? d.fusions.slice(-5).map(f => `${fmtDate(f.at)}：${f.from}${f.cond.length ? '＋' + f.cond.map(c => COND[c]).join('・') : ''}`).join('<br>') : 'なし';
  openModal(`<div class="dex-hero" style="animation:bob 2.8s ease-in-out infinite">${fairySVG(s, { mood: 'happy' })}</div>
    <h2 style="justify-content:center">${esc(s.name)}</h2>
    <dl class="kv">
      <dt>誕生日</dt><dd>${fmtDate(d.first)}（いっしょにいる数：${d.count}）</dd>
      <dt>属性</dt><dd>${FAMILIES[s.fam].icon} ${FAMILIES[s.fam].name}</dd>
      <dt>性格</dt><dd>${esc(s.pers)}</dd>
      <dt>好物</dt><dd>${esc(s.food)}</dd>
      <dt>能力</dt><dd>${esc(s.ability)}</dd>
      <dt>発見方法</dt><dd>${esc(d.how || '')}</dd>
      <dt>元になったもの</dt><dd>${base}</dd>
      <dt>合成履歴</dt><dd>${fus}</dd>
    </dl>
    <div class="fact-card" style="margin-top:12px"><span class="tag">科学のひみつ</span>${esc(s.fact.s)}<details style="margin-top:6px"><summary style="cursor:pointer;color:#8a76d6;font-weight:800">もっとくわしく</summary><div style="margin-top:4px;font-size:12.5px">${esc(s.fact.d)}</div></details><div class="line">「${esc(s.fact.line)}」</div></div>`);
}

// =========================================================
// 科学の研究ノート
// =========================================================
let sFilter = 'all';
window.renderScience = function(){
  const p = $('#sciencePanel');
  const items = [];
  for (const k in S.facts) {
    const [type, id] = k.split(':');
    if (type === 'sp' && SPECIES_BY_ID[id]) { const s = SPECIES_BY_ID[id]; items.push({ at: S.facts[k], type: 'sp', title: s.fam === 'molecule' ? s.formula : s.name, pic: fairySVG(s), s: s.fact.s, d: s.fact.d, line: s.fact.line }); }
    if (type === 'bath') { const f = BATH_FACTS[+id]; if (f) items.push({ at: S.facts[k], type: 'bath', title: f.t, pic: '<div style="font-size:26px;text-align:center">🛁</div>', ...f }); }
    if (type === 'run') { const f = RUN_FACTS[+id]; if (f) items.push({ at: S.facts[k], type: 'run', title: f.t, pic: '<div style="font-size:26px;text-align:center">🏃</div>', ...f }); }
  }
  const list = items.filter(i => sFilter === 'all' || i.type === sFilter).sort((a, b) => b.at - a.at);
  const lv = S.settings.level;
  p.innerHTML = `<h2>🔬 科学の研究ノート</h2>
    <p class="sub">遊びながら見つけた「誰かに話したくなる」科学。見つけた数：${items.length}</p>
    <div class="row" style="justify-content:space-between">
      <div class="seg">${[['all','ぜんぶ'],['sp','妖精'],['bath','おふろ'],['run','ラン']].map(([k,n])=>`<button data-sf="${k}" class="${sFilter===k?'on':''}">${n}</button>`).join('')}</div>
      <div class="seg">${[[1,'LEVEL 1'],[2,'LEVEL 2 くわしく']].map(([k,n])=>`<button data-lv="${k}" class="${lv===k?'on':''}">${n}</button>`).join('')}</div>
    </div>
    <div class="fact-list" style="margin-top:12px">${list.map(i => `<div class="fact-item"><div class="hd"><div class="pic">${i.pic}</div>${esc(i.title)}</div>${esc(i.s)}
      ${lv >= 2 ? `<div style="margin-top:6px;font-size:12.5px;color:var(--ink2)">${esc(i.d)}</div>` : `<details><summary>もっとくわしく</summary>${esc(i.d)}</details>`}
      <div style="color:#9a6cf0;font-weight:700;margin-top:4px;font-size:12.5px">「${esc(i.line)}」</div></div>`).join('') || '<div class="empty">📓<br>まだ空っぽのノート。<br>妖精に会ったり、おふろやランをすると、ここに雑学がたまっていきます。</div>'}</div>
    <div class="note">LEVEL 1 は、小学生でもわかる短い雑学。LEVEL 2 は、もう少しくわしい解説です。これからもっと深いレベルを追加していきます。</div>`;
  p.querySelectorAll('[data-sf]').forEach(b => b.onclick = () => { sFilter = b.dataset.sf; renderScience(); });
  p.querySelectorAll('[data-lv]').forEach(b => b.onclick = () => { S.settings.level = +b.dataset.lv; save(); renderScience(); });
};

// =========================================================
// せってい
// =========================================================
window.openSettings = function(){
  const ago = t => { if (!t) return 'まだ'; const d = Math.floor((Date.now() - t) / 86400000); return d <= 0 ? 'きょう' : d + '日まえ'; };
  const hm = t => t ? new Date(t).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '—';
  openModal(`<h2>⚙️ せってい</h2>
    <h3>🎵 おんがく</h3>
    <div class="row"><button class="chip ${S.settings.bgm?'on':''}" id="sBgm">🎵 BGM ${S.settings.bgm?'ON':'OFF'}</button>
      <button class="chip ${S.settings.sound?'on':''}" id="sSound">🔔 効果音 ${S.settings.sound?'ON':'OFF'}</button></div>
    <div class="row" style="margin-top:8px"><span class="opt-label">音量</span><input type="range" min="0" max="100" value="${S.settings.bgmVol ?? 60}" id="sVol" style="flex:1"></div>
    <div class="row" style="margin-top:8px"><span class="opt-label">曲</span>
      <select class="input" id="sTrack"><option value="auto">おまかせ（画面に合わせる）</option>${Object.entries(BGM.TRACKS).map(([k,t]) => `<option value="${k}">${t.name}</option>`).join('')}</select></div>
    <p class="sub" style="margin-top:6px">曲は、その場でつくっている「ゆるい音」。毎回すこしずつメロディが変わります。</p>
    <h3>あそびかた</h3>
    <div class="row"><button class="chip ${S.settings.skipBirth?'on':''}" id="sSkip">⏩ 誕生演出をはぶく ${S.settings.skipBirth?'ON':'OFF'}</button></div>
    <h3>空の時間</h3>
    <div class="seg" id="sTime">${[['auto','とけいに合わせる'],['day','ひる'],['eve','ゆうがた'],['night','よる']].map(([k,n])=>`<button data-tm="${k}">${n}</button>`).join('')}</div>
    <h3>💾 自分のデータを保存</h3>
    <div class="save-box">
      <div>✅ この端末に自動で保存しています（2か所に二重保存）</div>
      <div class="sub" style="margin:2px 0 0">さいごの保存：${hm(S.savedAt)}　｜　ファイルに保存：${ago(S.settings.lastBackup)}</div>
      <div class="sub" style="margin:2px 0 0" id="sPersist">消えにくい保存：しらべています…</div>
    </div>
    <div class="row" style="margin-top:8px"><button class="btn small" id="sDl">📁 ファイルに保存</button><button class="btn soft small" id="sUp">📂 ファイルから読みこむ</button><input type="file" accept=".json,.txt,application/json" id="sFile" hidden></div>
    <div class="row" style="margin-top:6px"><button class="btn soft small" id="sExp">📋 コピーで保存</button><button class="btn soft small" id="sImp">📋 貼りつけて読みこむ</button></div>
    <div id="sBox"></div>
    <p class="sub" style="margin-top:8px">スマホを変えるときや、ブラウザのデータを消すときは「ファイルに保存」しておくと安心です。データはどこにも送りません。ログインもいりません。</p>
    <h3>このアプリの約束</h3>
    <p class="sub">ずっと無料・広告なし・課金なし。ペナルティもノルマもありません。何もしない日も、妖精たちはここで待っています。</p>
    <h3>データの削除</h3>
    <button class="btn soft small" id="sReset">🗑 すべてのデータを消す</button>`, c => {
    c.querySelector('#sTrack').value = S.settings.bgmTrack || 'auto';
    c.querySelector('#sBgm').onclick = () => { toggleBGM(); openSettings(); };
    c.querySelector('#sSound').onclick = () => { S.settings.sound = !S.settings.sound; save(); openSettings(); };
    c.querySelector('#sVol').oninput = e => { S.settings.bgmVol = +e.target.value; save(); BGM.setVolume(); };
    c.querySelector('#sTrack').onchange = e => { S.settings.bgmTrack = e.target.value; save(); if (S.settings.bgm) BGM.follow(document.querySelector('.screen.active')?.id); };
    c.querySelector('#sSkip').onclick = () => { S.settings.skipBirth = !S.settings.skipBirth; save(); openSettings(); };
    c.querySelectorAll('[data-tm]').forEach(b => b.onclick = () => { applyTime(b.dataset.tm); c.querySelectorAll('[data-tm]').forEach(x => x.classList.toggle('on', x === b)); BGM.follow('home'); });
    isPersisted().then(ok => { const el = c.querySelector('#sPersist'); if (!el) return;
      if (ok) el.textContent = '🔒 消えにくい保存：ON';
      else { el.innerHTML = '消えにくい保存：OFF <button class="btn soft small" id="sPer" style="padding:3px 10px">ONにする</button>'; c.querySelector('#sPer').onclick = () => askPersist().then(r => { toast(r ? '消えにくい保存をONにしたよ 🔒' : 'このブラウザではONにできなかったみたい。ファイル保存がおすすめ'); openSettings(); }); } });
    c.querySelector('#sDl').onclick = () => { let framed = false; try { framed = window.self !== window.top; } catch(e) { framed = true; } if (framed) { c.querySelector('#sExp').click(); toast('この画面ではファイル保存ができないみたい。コピーで保存してね'); return; } const n = downloadBackup(); toast(n ? `「${n}」を保存したよ（ダウンロードを見てね）` : 'うまく保存できなかったみたい。コピーで保存をためしてね'); };
    c.querySelector('#sUp').onclick = () => c.querySelector('#sFile').click();
    c.querySelector('#sFile').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { importData(JSON.parse(t)); closeModal(); refreshAll(); toast('読みこんだよ ✨ おかえりなさい'); } catch(err) { toast('このファイルは読みこめなかったみたい'); } }); };
    c.querySelector('#sExp').onclick = () => {
      const txt = JSON.stringify(S);
      c.querySelector('#sBox').innerHTML = `<textarea class="input" style="height:110px;margin-top:8px;font-size:11px" readonly>${esc(txt)}</textarea><div class="row" style="margin-top:6px"><button class="btn small" id="sCopy">📋 コピー</button><span class="sub" style="margin:0">メモ帳などに貼りつけて保存してね</span></div>`;
      c.querySelector('#sCopy').onclick = async () => { try { await navigator.clipboard.writeText(txt); S.settings.lastBackup = Date.now(); save(); toast('コピーしたよ'); } catch(e) { c.querySelector('textarea').select(); toast('全部えらんだよ。コピーしてね'); } };
    };
    c.querySelector('#sImp').onclick = () => {
      c.querySelector('#sBox').innerHTML = `<textarea class="input" id="sIn" style="height:110px;margin-top:8px;font-size:11px" placeholder="保存したデータを貼りつけてね"></textarea><div class="row" style="margin-top:6px;justify-content:flex-end"><button class="btn small" id="sLoad">読みこむ</button></div>`;
      c.querySelector('#sLoad').onclick = () => { try { importData(JSON.parse(c.querySelector('#sIn').value)); closeModal(); refreshAll(); toast('読みこんだよ ✨'); } catch(e) { toast('うまく読みこめなかったみたい'); } };
    };
    const rb = c.querySelector('#sReset');
    rb.onclick = () => { if (!rb.dataset.sure) { rb.dataset.sure = 1; rb.textContent = 'ほんとうに消す？（もどせません）'; rb.style.background = '#ffe0ea'; return; } resetAll(); closeModal(); refreshAll(); toast('まっさらになったよ'); };
  });
};
})();
