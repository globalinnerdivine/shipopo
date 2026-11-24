// ===== 妖精合成研究所（パワーアップ版） =====
(function(){
const $ = (s, r = document) => r.querySelector(s);
const sub2 = s => s.replace(/(\d)/g, d => '₀₁₂₃₄₅₆₇₈₉'[d]);
const MAX = 10;
let flask = [], conds = new Set(), busy = false, tipT = 0, tipI = 0;

// はかせ（研究所の案内役）
const HAKASE = { id:'hakase', name:'ぽぽはかせ', fam:'mystery', shape:'round', c1:'#e6dcff', c2:'#fbf8ff', c3:'#a993ff', acc:'hakase', eyes:'big', fact:{ line:'' } };
const TIPS = [
  '原子のいちばん外側の電子が、手をつなぐカギなんじゃ。',
  '同じ炭素でも、ならび方でダイヤモンドにも黒鉛にもなるぞい。',
  '熱・圧力・火花・光・水。条件を変えると、できるものが変わることもあるんじゃ。',
  'ヘリウムはだれとも手をつながん、マイペースな子じゃよ。',
  '金属の原子は電子をわたしやすく、塩素は電子をもらいやすいんじゃ。',
  '研究メモの分子をタップすると、材料をそろえてあげるぞい。',
  'たねの「i」をおすと、電子のならび方が見られるんじゃ。',
  '妖精はファンタジー。でも分子の形や性質は、本物の科学じゃよ。',
];
const RANKS = [[0,'見習い研究員'],[3,'研究員'],[7,'はかせ'],[12,'大はかせ'],[17,'しぽぽ大博士']];
const found = () => RECIPES.filter(r => S.dex[r.out]).length;
const rank = () => RANKS.filter(([n]) => found() >= n).pop()[1];

// パワーアップ記念：新しい元素のたねをプレゼント（1回だけ）
if (!S.labV2) { addSeeds({ He: 1, S: 1, Ca: 1, Fe: 2, Mg: 1, O: 3, H: 2 }); S.labV2 = true; S.labGift = true; save(); }

function say(t, mood){
  const b = $('#hkBubble'), f = $('#hkFace'); if (!b) return;
  b.textContent = t; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  if (f) { f.innerHTML = fairySVG(HAKASE, { mood: mood || 'normal' }); f.classList.remove('hop'); void f.offsetWidth; f.classList.add('hop'); }
}
function counts(arr){ return arr.reduce((o, s) => (o[s] = (o[s]||0) + 1, o), {}); }
function formulaOf(arr){
  const c = counts(arr); const order = ['C','H','He','N','O','Na','Mg','S','Cl','Ca','Fe'];
  return order.filter(k => c[k]).map(k => k + (c[k] > 1 ? sub2(String(c[k])) : '')).join('');
}
const avail = k => (S.seeds[k]||0) - flask.filter(x => x === k).length;

window.renderFusion = function(){
  const p = $('#fusionPanel');
  clearInterval(tipT);
  p.innerHTML = `
    <div class="lab-head">
      <div class="hk-face" id="hkFace">${fairySVG(HAKASE)}</div>
      <div class="hk-bubble" id="hkBubble"></div>
      <div class="lab-rank"><small>研究ランク</small><b>${rank()}</b><small>発見した分子：${found()}</small></div>
    </div>
    <div class="lab-top">
      <div>
        <div class="flask" id="flask"><svg class="bond-svg" id="bondSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          <div class="formula" id="fFormula"></div><div class="bond-label" id="bondLabel"></div><div class="flash" id="fFlash"></div>
          ${flask.length ? '' : '<div class="ph">下のたねをタップして<br>フラスコに入れてね</div>'}</div>
        <div class="conds" style="margin-top:10px">${Object.entries(COND).map(([k,n]) => `<button class="cond ${conds.has(k)?'on':''}" data-cond="${k}">${n}</button>`).join('')}</div>
        <div class="row" style="justify-content:center;margin-top:12px"><button class="btn soft small" id="fClear">もどす</button><button class="btn big" id="fGo" ${flask.length<1?'disabled':''}>むすぶ！</button></div>
      </div>
      <div>
        <h3 style="margin-top:0;display:flex;justify-content:space-between;align-items:center">元素のたね <button class="btn soft small" onclick="go('shop')">✨ たねを買う</button></h3>
        <div class="atoms">${Object.keys(ELEMENTS).map(k => `<button class="atom-btn ${avail(k)<=0?'empty':''}" data-atom="${k}">${atomSVG(k)}<span class="cnt">×${avail(k)}</span><span class="nm">${ELEMENTS[k].name}</span><span class="info" data-info="${k}">i</span></button>`).join('')}</div>
        <div class="note">🧪 ゲームでは「たね1こ＝原子1こ」として遊びます。本当の反応では、ものすごい数の原子が一度に動いています。<br>🧚 妖精はファンタジー。でも、分子の形・結びつき方・性質は本物の科学です。</div>
      </div>
    </div>
    <h3>研究メモ <span style="font-weight:500;font-size:11px">（見つけた分子をタップすると、材料をそろえるよ）</span></h3>
    <div class="recipe-list">${RECIPES.map(r => { const sp = SPECIES_BY_ID[r.out]; const got = S.dex[r.out];
      return got ? `<button class="recipe" data-recipe="${r.id}"><div class="pic">${fairySVG(sp)}</div><div><b>${esc(sp.formula)}</b><br><span class="mat">${Object.entries(r.need).map(([k,v])=>k+'×'+v).join(' + ')}${r.cond.length?' ・'+r.cond.map(c=>COND[c].split(' ')[0]).join(''):''}</span></div></button>`
        : `<div class="recipe unk"><div class="pic">${fairySVG(sp,{silhouette:true})}</div><div>？？？<br><span style="font-size:11px">${esc(r.hint)}</span></div></div>`; }).join('')}</div>`;
  drawFlask();
  // はかせのことば
  if (S.labGift) { say('研究所がパワーアップしたぞい！ 新しい元素のたねを、ちょっぴりプレゼントじゃ。', 'happy'); S.labGift = false; save(); }
  else say(TIPS[tipI++ % TIPS.length]);
  tipT = setInterval(() => { if (!busy && $('#fusion').classList.contains('active')) say(TIPS[tipI++ % TIPS.length]); }, 12000);
  $('#hkFace').onclick = () => { sfx('po'); say(TIPS[tipI++ % TIPS.length], 'happy'); };

  p.querySelectorAll('[data-atom]').forEach(b => b.onclick = e => {
    if (e.target.closest('[data-info]')) return atomInfo(e.target.closest('[data-info]').dataset.info);
    const k = b.dataset.atom; if (busy) return;
    if (avail(k) <= 0) { say(`${ELEMENTS[k].name}のたねがないみたいじゃ。タスクやおみせで手に入るぞい。`); return; }
    if (flask.length >= MAX) { say('フラスコはもういっぱいじゃ！'); return; }
    flask.push(k); sfx('po');
    renderFusion();
    say(k === 'He' ? 'ヘリウムじゃな。この子はだれとも手をつながんのじゃ。' : `${ELEMENTS[k].name}じゃな。手（結合）は ${ELEMENTS[k].hands}。`);
  });
  p.querySelectorAll('[data-cond]').forEach(b => b.onclick = () => { const k = b.dataset.cond; conds.has(k) ? conds.delete(k) : conds.add(k); sfx('tap'); b.classList.toggle('on'); });
  p.querySelectorAll('[data-recipe]').forEach(b => b.onclick = () => fillRecipe(RECIPES.find(r => r.id === b.dataset.recipe)));
  $('#fClear').onclick = () => { if (busy) return; flask = []; renderFusion(); };
  $('#fGo').onclick = doFuse;
};

function fillRecipe(r){
  if (busy) return;
  const lack = Object.entries(r.need).filter(([k, v]) => (S.seeds[k]||0) < v);
  if (lack.length) { say(`材料が足りないぞい：${lack.map(([k,v]) => `${k}があと${v - (S.seeds[k]||0)}こ`).join('、')}`); return; }
  flask = []; Object.entries(r.need).forEach(([k, v]) => { for (let i = 0; i < v; i++) flask.push(k); });
  conds = new Set(r.cond); sfx('sparkle');
  renderFusion(); say(`${SPECIES_BY_ID[r.out].formula} の材料をそろえたぞい。「むすぶ！」をおしてみるのじゃ。`, 'happy');
}

function slots(n){
  const pts = [];
  if (n === 1) return [[50, 50]];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI/2; pts.push([50 + Math.cos(a) * 26, 50 + Math.sin(a) * 30]); }
  return pts;
}
function drawFlask(){
  const fl = $('#flask'); if (!fl) return;
  fl.querySelectorAll('.in-atom').forEach(x => x.remove());
  $('#fFormula').textContent = flask.length ? formulaOf(flask) + ' ?' : '';
  fl.classList.toggle('many', flask.length > 6);
  slots(flask.length).forEach(([x, y], i) => {
    const d = document.createElement('div'); d.className = 'in-atom'; d.style.left = x + '%'; d.style.top = y + '%';
    d.style.animationDelay = (-i * .3) + 's'; d.dataset.sym = flask[i];
    d.innerHTML = atomSVG(flask[i]); d.title = 'タップでもどす';
    d.onclick = () => { if (busy) return; flask.splice(i, 1); sfx('soft'); renderFusion(); };
    fl.appendChild(d);
  });
}

// 原子の図鑑（電子のならび方）
function bohr(k){
  const e = ELEMENTS[k], sh = e.shell, R0 = 16, step = 13, W = 70 + sh.length * step * 2;
  const c = W / 2;
  let s = `<svg viewBox="0 0 ${W} ${W}" class="bohr">`;
  sh.forEach((n, i) => {
    const r = R0 + (i + 1) * step;
    s += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#c9b6ff" stroke-width="1.2" stroke-dasharray="3 3"/>`;
    s += `<g class="orbit-spin" style="animation-duration:${6 + i * 4}s;transform-origin:${c}px ${c}px">`;
    for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2; s += `<circle cx="${(c + Math.cos(a) * r).toFixed(1)}" cy="${(c + Math.sin(a) * r).toFixed(1)}" r="3.4" fill="${i === sh.length - 1 ? '#ff8fb6' : '#8ab8ff'}"/>`; }
    s += '</g>';
  });
  s += `<circle cx="${c}" cy="${c}" r="${R0}" fill="${e.color}" stroke="#fff" stroke-width="2"/><text x="${c}" y="${c + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#4a4166">${k}</text></svg>`;
  return s;
}
function atomInfo(k){
  const e = ELEMENTS[k];
  openModal(`<div style="display:flex;gap:14px;align-items:center"><div style="width:70px;height:70px">${atomSVG(k)}</div><div><h2>${k}　${e.name}</h2><div class="sub" style="margin:0">原子番号 ${e.num}（電子 ${e.num}こ）</div></div></div>
    <div class="bohr-wrap">${bohr(k)}<div class="sub" style="margin:0">電子のならび方：${e.shell.join(' - ')}<br><span style="color:#ff6fa6">●</span> いちばん外側の電子　<span style="color:#6aa0ff">●</span> 内側の電子</div></div>
    <dl class="kv"><dt>結びつき</dt><dd>${e.hands}</dd><dt>ひみつ</dt><dd>${e.note}</dd></dl>
    <div class="note">電子は、原子のまわりの「からの道」に入っています。いちばん外側の電子の数で、ほかの原子とどう結びつくかが決まります。（図はわかりやすくした模型です）</div>`);
}

function matchRecipe(){
  const c = counts(flask);
  const same = r => { const ks = new Set([...Object.keys(r.need), ...Object.keys(c)]); for (const k of ks) if ((r.need[k]||0) !== (c[k]||0)) return false; return true; };
  const cands = RECIPES.filter(same);
  if (!cands.length) return { none: true };
  const ok = cands.filter(r => r.cond.every(x => conds.has(x))).sort((a, b) => b.cond.length - a.cond.length);
  if (ok.length) return { r: ok[0] };
  return { needCond: cands[0] };
}

// 結合のアニメーション：原子が分子の形にならび、手（結合）がのびる
function bondAnim(r){
  const fl = $('#flask'), svg = $('#bondSvg');
  const els = [...fl.querySelectorAll('.in-atom')], used = new Set(), pos = [];
  r.layout.forEach(([sym, x, y], li) => {
    const el = els.find((e, i) => !used.has(i) && e.dataset.sym === sym && (used.add(i), true));
    if (el) { el.style.left = x + '%'; el.style.top = y + '%'; el.style.animation = 'none'; }
    pos[li] = [x, y];
  });
  let lines = '';
  r.bonds.forEach(([a, b, n], i) => {
    const [x1, y1] = pos[a], [x2, y2] = pos[b];
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, ox = -dy / L * 1.6, oy = dx / L * 1.6;
    const d = `style="animation-delay:${0.15 * i}s"`;
    if (n === 'ion') lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="bl ion" ${d}/>`;
    else {
      const offs = n === 1 ? [0] : n === 2 ? [-.5, .5] : [-1, 0, 1];
      offs.forEach(o => lines += `<line x1="${x1 + ox*o}" y1="${y1 + oy*o}" x2="${x2 + ox*o}" y2="${y2 + oy*o}" class="bl" ${d}/>`);
      lines += `<circle r="1.1" class="el"><animateMotion dur="1.2s" repeatCount="indefinite" path="M${x1} ${y1} L${x2} ${y2} L${x1} ${y1}"/></circle>`;
    }
  });
  setTimeout(() => { svg.innerHTML = lines; }, 650);
  setTimeout(() => { const l = $('#bondLabel'); l.textContent = '結合！ ' + r.bond; l.classList.add('on'); sfx('bond'); }, 900);
}

function doFuse(){
  if (busy || !flask.length) return;
  const res = matchRecipe();
  const fl = $('#flask');
  if (flask.length === 1 && !res.r) { say('原子1こでは、ふつうは何も起きんのじゃ。ほかのたねもいれてみよう。'); return; }
  busy = true; fl.classList.add('react');
  const atoms = fl.querySelectorAll('.in-atom');
  atoms.forEach((a, i) => { a.style.left = (50 + (i - (atoms.length-1)/2) * 6) + '%'; a.style.top = '50%'; });
  sfx('bond'); say('むむむ……反応するかの……？');
  setTimeout(() => {
    fl.classList.remove('react');
    if (res.r) {
      const r = res.r, sp = SPECIES_BY_ID[r.out];
      bondAnim(r);
      say(`おおっ！ ${r.bond}じゃ！`, 'happy');
      setTimeout(() => { $('#fFlash').classList.add('on'); sfx('sparkle'); }, 1700);
      setTimeout(() => {
        for (const k in r.need) S.seeds[k] -= r.need[k];
        const { isNew } = addFairy(sp.id, '合成研究所で発見');
        S.dex[sp.id].fusions.push({ at: Date.now(), from: formulaOf(flask), cond: [...conds] });
        save(); renderSeedBar();
        const before = rank(); flask = []; busy = false;
        const extra = `<div class="mol-card"><b>${esc(sp.formula)}</b>　<span>${esc(sp.kind)}</span><br>むすびつき：${esc(r.bond)}${r.energy ? `<br>エネルギー：${esc(r.energy)}` : ''}</div>`;
        playBirth({ sp, isNew, extra, onDone: () => { renderFusion(); renderHomeFairies(); if (rank() !== before) say(`ランクアップじゃ！ きみは今日から「${rank()}」じゃ！`, 'happy'); else say(isNew ? '大発見じゃ！ 研究メモに書いておいたぞい。' : 'また会えたのう。', 'happy'); } });
      }, 2500);
    } else {
      const sl = slots(atoms.length);
      atoms.forEach((a, i) => { a.style.left = sl[i][0] + '%'; a.style.top = sl[i][1] + '%'; });
      sfx('soft'); busy = false;
      if (res.needCond) say(res.needCond.condMsg || 'この組み合わせには、なにか「きっかけ」が必要みたいじゃ。');
      else if (flask.includes('He')) say('ヘリウムは、だれとも手をつながんのじゃ。ヘリウムだけで「むすぶ！」をおしてみるかの？');
      else say('ふむ……この組み合わせは、まだ研究中じゃ。たねはそのまま残しておいたぞい。研究メモのヒントも見てみるのじゃ。');
    }
  }, 1100);
}
})();
