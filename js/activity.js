// ===== アクティビティ：おふろぽーん！ / ぽぽぽラン！ =====
(function(){
const $ = (s, r = document) => r.querySelector(s);
let loops = [], tick = 0, mode = null;
const clearLoops = () => { loops.forEach(clearInterval); loops.forEach(clearTimeout); loops = []; clearInterval(tick); };
const bathToday = () => S.bath.filter(b => b.pt && todayStr(new Date(b.at)) === todayStr()).length;
const mmss = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function buddy(){
  const own = S.fairies.filter(f => SPECIES_BY_ID[f.sp].fam !== 'molecule');
  if (own.length) return { sp: SPECIES_BY_ID[own[own.length-1].sp], guest: false };
  return { sp: SPECIES_BY_ID.shizukun, guest: true };
}
let pickedSp = null;

window.renderActivity = function(){
  clearLoops(); mode = null; stopGeo();
  if (window.BGM) BGM.follow('activity');
  const p = $('#activityPanel');
  const b = buddy(); pickedSp = pickedSp || b.sp;
  const own = [...new Set(S.fairies.map(f => f.sp))].filter(id => SPECIES_BY_ID[id].fam !== 'molecule');
  p.innerHTML = `<h2>🛁 あそぶ</h2>
    <p class="sub">毎日の行動を、妖精といっしょに楽しい時間に。記録はするけど、比べたり評価したりはしません。</p>
    <div class="act-pick">
      <button class="act-card" id="goBath"><div class="ic">🛁</div><div class="t">おふろぽーん！</div><div class="d">おふろからあがったらポチッ。${POINT_RULES.bath}ptもらえるよ。</div></button>
      <button class="act-card" id="goRun"><div class="ic">🏃</div><div class="t">ぽぽぽラン！</div><div class="d">GPSで走ったきょりをはかって、100mごとに${POINT_RULES.runPer100m}pt。</div></button>
    </div>
    <h3>いっしょに行く子</h3>
    <div class="row" id="buddyRow">${(own.length ? own : ['shizukun']).slice(-10).map(id => `<button class="chip ${pickedSp.id===id?'on':''}" data-bud="${id}"><span style="width:26px;height:26px;display:inline-block">${fairySVG(SPECIES_BY_ID[id])}</span>${esc(SPECIES_BY_ID[id].name)}${own.length?'':'（おきゃくさん）'}</button>`).join('')}</div>
    <h3>これまでの記録</h3>
    <div class="hist">${[...S.bath.map(x => ({...x, k:'bath'})), ...S.runs.map(x => ({...x, k:'run'}))].sort((a,b) => b.at - a.at).slice(0, 12).map(x =>
      x.k === 'bath' ? `<div><span>🛁 ${fmtDate(x.at)} おふろ</span><span>${x.sec ? mmss(x.sec) : ''}</span></div>`
      : `<div><span>🏃 ${fmtDate(x.at)} ラン</span><span>${mmss(x.sec)}${x.km ? ' ・ ' + x.km + 'km' : ''}</span></div>`).join('') || '<div><span>まだ記録はありません。気が向いたときにどうぞ。</span></div>'}</div>`;
  $('#goBath').onclick = startBath;
  $('#goRun').onclick = startRun;
  p.querySelectorAll('[data-bud]').forEach(x => x.onclick = () => { pickedSp = SPECIES_BY_ID[x.dataset.bud]; renderActivity(); });
};

// =========================================================
// おふろぽーん！
// =========================================================
function startBath(){
  clearLoops(); mode = 'bath'; if (window.BGM) BGM.follow('activity-bath');
  const sp = pickedSp || buddy().sp;
  const p = $('#activityPanel');
  p.innerHTML = `<h2>🛁 おふろぽーん！</h2>
    <p class="sub">おふろに入ったら、あがったときに下のボタンをポチッ。${POINT_RULES.bath}pt もらえます。<br>きょうのポイント：${bathToday()} / ${POINT_RULES.bathPerDay} 回</p>
    <div class="scene bath" id="bScene">
      <div class="tiles"></div><div class="floor"></div>
      <div class="faucet"></div><div class="stream" id="bStream"></div>
      <div class="tubback"><div class="water" id="bWater"></div></div>
      <div class="bfairy walk" id="bF"><div class="towel" id="bTowel"></div><div class="inner">${fairySVG(sp)}</div></div>
      <div class="surface" id="bSurf"></div>
      <div class="tubfront"></div><div class="feetL"></div><div class="feetR"></div>
    </div>
    <div class="timer-big" id="bTime" style="font-size:18px;opacity:.6">00:00</div>
    <div class="ctrl"><button class="btn soft" id="bBack">もどる</button><button class="btn mint big pochi" id="bOut">🛁 おふろあがった！ポチッ</button></div>
    <div id="bFact" style="margin-top:12px"></div>`;
  const F = $('#bF'), scene = $('#bScene');
  $('#bBack').onclick = renderActivity;
  const T = (ms, fn) => loops.push(setTimeout(fn, ms));
  // 1. 浴室へ歩いてくる
  T(60, () => { F.style.left = 'calc(50% - 210px)'; });
  // 2. お湯が注がれる
  T(2300, () => { F.classList.remove('walk'); $('#bStream').classList.add('on'); $('#bWater').classList.add('fill'); sfx('splash'); });
  // 3. 湯船にぴょん
  T(3200, () => { F.classList.add('hop'); F.style.left = 'calc(50% - 48px)'; F.style.bottom = 'calc(16% + 50px)'; });
  T(4100, () => { F.classList.remove('hop'); sfx('splash'); ripple(); ripple(); $('#bSurf').classList.add('on'); });
  T(5600, () => { $('#bStream').classList.remove('on'); });
  // 4. ぷかぷか・あわ・湯気
  T(5800, () => {
    F.classList.add('floating');
    loops.push(setInterval(() => bubble(), 420));
    loops.push(setInterval(() => steam(), 800));
    loops.push(setInterval(() => ripple(), 1800));
  });
  // 5. 目を閉じてリラックス → タオルをのせる
  T(7500, () => { F.querySelector('.inner').innerHTML = fairySVG(sp, { mood: 'sleep' }); });
  T(8600, () => { const t = $('#bTowel'); t.classList.add('on'); t.style.top = '-2px'; sfx('soft'); });
  T(9400, () => {
    const i = Math.floor(Math.random() * BATH_FACTS.length); const f = BATH_FACTS[i]; learnFact('bath:' + i);
    $('#bFact').innerHTML = `<div class="fact-card"><span class="tag">おふろの科学</span><b>${esc(f.t)}</b>　${esc(f.s)}<div class="line">「${esc(f.line)}」</div></div>`;
  });
  // タイマー（任意）
  const t0 = Date.now();
  tick = setInterval(() => { $('#bTime').textContent = mmss((Date.now() - t0) / 1000); }, 500);

  function bubble(){
    const b = document.createElement('div'); b.className = 'bub';
    const s = rand(8, 18); b.style.width = b.style.height = s + 'px';
    b.style.left = `calc(50% + ${rand(-110, 100)}px)`; b.style.bottom = 'calc(16% + 62px)'; b.style.setProperty('--dx', rand(-30, 30) + 'px');
    scene.appendChild(b); setTimeout(() => b.remove(), 3000);
  }
  function steam(){
    const s = document.createElement('div'); s.className = 'steam';
    s.style.left = `calc(50% + ${rand(-120, 90)}px)`; s.style.bottom = 'calc(16% + 70px)'; s.style.setProperty('--dx', rand(-30, 30) + 'px');
    scene.appendChild(s); setTimeout(() => s.remove(), 4000);
  }
  function ripple(){
    const r = document.createElement('div'); r.className = 'ripple';
    r.style.left = `calc(50% + ${rand(-90, 70)}px)`; r.style.bottom = 'calc(16% + 64px)';
    scene.appendChild(r); setTimeout(() => r.remove(), 1600);
  }
  // 6. お風呂から出てふわふわに
  $('#bOut').onclick = () => {
    const sec = Math.round((Date.now() - t0) / 1000);
    clearLoops();
    F.classList.remove('floating'); F.classList.add('hop');
    F.style.left = 'calc(50% + 100px)'; F.style.bottom = '6%';
    $('#bTowel').style.top = '-80px'; $('#bTowel').classList.remove('on');
    $('#bOut').disabled = true;
    setTimeout(() => {
      F.classList.remove('hop'); F.classList.add('fluffy');
      F.querySelector('.inner').innerHTML = fairySVG(sp, { mood: 'happy' });
      F.querySelector('.inner').style.animation = 'bornBounce 1s cubic-bezier(.3,1.8,.5,1)';
      sfx('yay'); confetti(scene);
      const big = document.createElement('div'); big.className = 'birth-text pon'; big.style.top = '12%'; big.style.fontSize = '44px'; big.textContent = 'おふろぽーん！';
      scene.appendChild(big);
      const can = bathToday() < POINT_RULES.bathPerDay;
      S.bath.push({ at: Date.now(), sec, sp: sp.id, pt: can ? POINT_RULES.bath : 0 }); save();
      if (can) { addPoints(POINT_RULES.bath, 'おふろぽーん！'); addSeeds({ H: 2, O: 1 }); }
      if (!$('#bFact').innerHTML) { const i = Math.floor(Math.random() * BATH_FACTS.length); const f = BATH_FACTS[i]; learnFact('bath:' + i); $('#bFact').innerHTML = `<div class="fact-card"><span class="tag">おふろの科学</span><b>${esc(f.t)}</b>　${esc(f.s)}<div class="line">「${esc(f.line)}」</div></div>`; }
      $('#bFact').insertAdjacentHTML('afterbegin', `<div class="fact-card" style="margin-bottom:10px;text-align:center">ぽかぽか、ふわふわ。${esc(sp.name)}も ごきげんです。${can ? `<div class="seed-gain" style="margin-top:4px">+${POINT_RULES.bath}pt と 元素のたね ${atomSVG('H')}×2 ${atomSVG('O')}×1</div>` : '<div class="sub" style="margin:4px 0 0">きょうのポイントはもう満タン。ぽかぽかの記録はちゃんと残したよ。</div>'}</div>`);
      $('#bTime').textContent = mmss(sec);
      p.querySelector('.ctrl').innerHTML = `<button class="btn" id="bDone">もどる</button>`;
      $('#bDone').onclick = renderActivity;
    }, 900);
  };
}

function confetti(scene){
  const cols = ['#ffb3d1','#ffe39a','#a6ecd0','#b8c8ff','#d9c9ff'];
  for (let i = 0; i < 36; i++) {
    const c = document.createElement('div'); c.className = 'confetti';
    c.style.left = rand(5, 95) + '%'; c.style.background = pick(cols); c.style.borderRadius = Math.random() < .5 ? '50%' : '3px';
    c.style.setProperty('--dx', rand(-60, 60) + 'px'); c.style.animationDelay = rand(0, .5) + 's';
    scene.appendChild(c); setTimeout(() => c.remove(), 2800);
  }
}

// =========================================================
// ぽぽぽラン！
// =========================================================
function mets(kmh){
  // 参考：身体活動のメッツ表（ランニング）をもとにした目安
  const tbl = [[6.4, 6.0], [8.0, 8.3], [9.7, 9.8], [10.8, 10.5], [11.3, 11.0], [12.9, 11.8], [14.5, 12.8], [16.1, 14.5]];
  if (kmh <= tbl[0][0]) return Math.max(3.5, tbl[0][1] * kmh / tbl[0][0]);
  for (let i = 1; i < tbl.length; i++) if (kmh <= tbl[i][0]) { const [a, ma] = tbl[i-1], [b, mb] = tbl[i]; return ma + (mb - ma) * (kmh - a) / (b - a); }
  return tbl[tbl.length-1][1];
}
let geoWatch = null, wake = null;
function stopGeo(){ if (geoWatch != null && navigator.geolocation) navigator.geolocation.clearWatch(geoWatch); geoWatch = null; try { wake && wake.release(); } catch(e) {} wake = null; }
const hav = (a, b) => { const R = 6371000, r = Math.PI / 180; const dLa = (b.lat - a.lat) * r, dLo = (b.lon - a.lon) * r; const x = Math.sin(dLa/2)**2 + Math.cos(a.lat*r) * Math.cos(b.lat*r) * Math.sin(dLo/2)**2; return 2 * R * Math.asin(Math.sqrt(x)); };
function startRun(){
  clearLoops(); mode = 'run';
  const sp = pickedSp || buddy().sp;
  const p = $('#activityPanel');
  const geoOk = 'geolocation' in navigator;
  p.innerHTML = `<h2>🏃 ぽぽぽラン！</h2>
    <p class="sub">走ったきょりでポイントがたまります（100mごとに ${POINT_RULES.runPer100m}pt）。</p>
    <div class="act-pick">
      <button class="act-card" id="rGps" ${geoOk?'':'disabled'}><div class="ic">📍</div><div class="t">GPSで走る</div><div class="d">スマホの位置情報できょりをはかります。はじめに許可をたずねます。</div></button>
      <button class="act-card" id="rTimeOnly"><div class="ic">⏱</div><div class="t">GPSなしで走る</div><div class="d">時間だけ記録。1分ごとに ${POINT_RULES.runNoGpsPerMin}pt。</div></button>
    </div>
    <div class="note">📍 位置情報は「走る」あいだだけ使い、ゴールで止めます。保存するのはきょりと時間だけで、場所や地図は保存しません。どこにも送りません。<br>📱 走っているあいだは、このページを開いたままにしてね（画面が消えないようにします）。</div>
    <div class="row" style="justify-content:center;margin-top:12px"><button class="btn soft" id="rBack0">もどる</button></div>`;
  $('#rBack0').onclick = renderActivity;
  $('#rTimeOnly').onclick = () => runScene(sp, false);
  $('#rGps').onclick = () => {
    // 明示的な許可：ここで初めて位置情報をたずねる
    toast('位置情報の許可をたずねます…');
    navigator.geolocation.getCurrentPosition(
      pos => runScene(sp, true, pos),
      err => {
        const why = err.code === 1 ? '位置情報が許可されなかったか、この画面では使えないみたい' : 'GPSの電波がつかめなかったみたい';
        openModal(`<h2>📍 GPSが使えませんでした</h2><p class="sub" style="margin-top:8px">${why}。</p>
          <p class="sub">GPSなしでも、時間でポイントがたまります。</p>
          <div class="note">💡 Claudeの画面の中で開いているときは、安全のため位置情報が使えません。アプリを自分のURL（ホーム画面に追加したアプリなど）で開くとGPSが使えます。</div>
          <div class="row" style="justify-content:flex-end;margin-top:10px"><button class="btn soft" data-close>もどる</button><button class="btn" id="goNoGps">GPSなしで走る</button></div>`,
          c => c.querySelector('#goNoGps').onclick = () => { closeModal(); runScene(sp, false); });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
}
function runScene(sp, gps, firstPos){
  clearLoops(); stopGeo(); mode = 'run'; if (window.BGM) BGM.follow('activity-run');
  const p = $('#activityPanel');
  p.innerHTML = `<h2>🏃 ぽぽぽラン！ <span class="chip" style="font-size:11px">${gps ? '📍 GPS' : '⏱ 時間'}</span></h2>
    <div class="scene runscene" id="rScene">
      <div class="rhill"></div><div class="rtrees">${'<i></i>'.repeat(16)}</div><div class="rground"></div><div class="rpath"></div>
      <div class="goal-flag" id="rFlag">🏁</div>
      <div class="rfairy warm" id="rF"><div class="inner">${fairySVG(sp)}</div></div>
      <div class="birth-text" id="rMsg" style="top:10%;font-size:22px">じゅんびうんどう〜</div>
    </div>
    <div class="run-stats"><div><small>じかん</small><b id="rTime">00:00</b></div><div><small>きょり</small><b id="rDist">${gps ? '0.00' : '—'}</b><small>${gps ? 'km' : ''}</small></div><div><small>ペース</small><b id="rPace">—</b></div><div><small>ポイント</small><b id="rPt">0</b><small>pt</small></div></div>
    <div class="sub" id="rGpsInfo" style="text-align:center;margin:4px 0 0">${gps ? 'GPS：じゅんびOK' : ''}</div>
    <div class="ctrl" id="rCtrl"><button class="btn soft" id="rBack">やめる</button></div>
    <div id="rFact" style="margin-top:12px"></div>`;
  $('#rBack').onclick = () => { stopGeo(); renderActivity(); };
  const F = $('#rF'), scene = $('#rScene'), msg = $('#rMsg');
  let elapsed = 0, running = false, lastT = 0, meters = 0, last = null;
  if (gps && firstPos) last = { lat: firstPos.coords.latitude, lon: firstPos.coords.longitude, t: firstPos.timestamp };
  const pts = () => gps ? Math.floor(meters / 100) * POINT_RULES.runPer100m : Math.floor(elapsed / 60) * POINT_RULES.runNoGpsPerMin;
  const T = (ms, fn) => loops.push(setTimeout(fn, ms));
  T(1800, () => { msg.textContent = '3'; sfx('po'); });
  T(2600, () => { msg.textContent = '2'; sfx('po'); });
  T(3400, () => { msg.textContent = '1'; sfx('po'); });
  T(4200, () => { msg.textContent = 'よーい、ぽん！'; sfx('pon'); go(); });
  T(5600, () => { if (running) msg.textContent = ''; });
  if (gps) {
    try { navigator.wakeLock && navigator.wakeLock.request('screen').then(w => wake = w).catch(() => {}); } catch(e) {}
    geoWatch = navigator.geolocation.watchPosition(pos => {
      const c = pos.coords, cur = { lat: c.latitude, lon: c.longitude, t: pos.timestamp };
      const info = $('#rGpsInfo'); if (info) info.textContent = `GPS：せいど ±${Math.round(c.accuracy)}m`;
      if (c.accuracy > 35) return;                      // ぶれが大きいときは数えない
      if (!last) { last = cur; return; }
      const d = hav(last, cur), dt = Math.max(1, (cur.t - last.t) / 1000);
      if (d / dt > 8.5) { last = cur; return; }          // 時速30km以上のとびは無視
      if (d < Math.max(3, c.accuracy * 0.25)) return;    // 立ち止まり中の小さなぶれ
      if (running) meters += d;
      last = cur;
    }, () => { const info = $('#rGpsInfo'); if (info) info.textContent = 'GPS：電波をさがしています…'; }, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
  }
  function go(){
    running = true; lastT = Date.now();
    scene.classList.add('moving'); F.className = 'rfairy run';
    F.querySelector('.inner').innerHTML = fairySVG(sp);
    $('#rCtrl').innerHTML = `<button class="btn soft" id="rRest">ひとやすみ</button><button class="btn big" id="rGoal">ゴール！</button>`;
    $('#rRest').onclick = rest; $('#rGoal').onclick = goal;
  }
  function rest(){
    running = false; scene.classList.remove('moving'); F.className = 'rfairy rest';
    F.querySelector('.inner').innerHTML = fairySVG(sp, { mood: 'sleep' });
    msg.textContent = 'ふぅ〜、ひとやすみ';
    $('#rCtrl').innerHTML = `<button class="btn mint" id="rAgain">また走る</button><button class="btn big" id="rGoal">ゴール！</button>`;
    $('#rAgain').onclick = () => { msg.textContent = ''; go(); }; $('#rGoal').onclick = goal;
  }
  let lastPt = 0;
  tick = setInterval(() => {
    const now = Date.now();
    if (running) elapsed += (now - lastT) / 1000;
    lastT = now;
    $('#rTime').textContent = mmss(elapsed);
    if (gps) {
      $('#rDist').textContent = (meters / 1000).toFixed(2);
      if (meters > 50) { const spk = Math.round(elapsed / (meters / 1000)); $('#rPace').textContent = `${Math.floor(spk/60)}'${String(spk%60).padStart(2,'0')}"`; }
    }
    const pt = pts(); $('#rPt').textContent = pt;
    if (pt > lastPt) { lastPt = pt; sfx('po'); const b = $('#rPt'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }, 250);
  loops.push(setInterval(() => {
    if (!running) return;
    const r = F.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    const pf = document.createElement('div'); pf.className = 'puff';
    pf.style.left = (r.left - sr.left + r.width * .2) + 'px'; pf.style.top = (r.top - sr.top + r.height * .45) + 'px';
    scene.appendChild(pf); setTimeout(() => pf.remove(), 1000);
  }, 900));
  loops.push(setInterval(() => {
    if (!running || elapsed < 8) return;
    const r = F.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    const sw = document.createElement('div'); sw.className = 'sweat';
    sw.style.left = (r.left - sr.left + r.width * .75) + 'px'; sw.style.top = (r.top - sr.top + r.height * .2) + 'px';
    scene.appendChild(sw); setTimeout(() => sw.remove(), 1000);
  }, 2600));

  function goal(){
    running = false; clearLoops(); stopGeo();
    scene.classList.remove('moving'); F.className = 'rfairy goal'; $('#rFlag').classList.add('on');
    F.querySelector('.inner').innerHTML = fairySVG(sp, { mood: 'happy' });
    msg.className = 'birth-text pon'; msg.style.fontSize = '40px'; msg.textContent = 'ゴール！';
    sfx('yay'); confetti(scene);
    const sec = Math.max(1, Math.round(elapsed)), pt = pts();
    $('#rTime').textContent = mmss(sec);
    const i = Math.floor(Math.random() * RUN_FACTS.length); const f = RUN_FACTS[i]; learnFact('run:' + i);
    $('#rCtrl').innerHTML = '';
    $('#rFact').innerHTML = `
      <div class="fact-card" style="text-align:center">${mmss(sec)} 走ったよ${gps ? `、${(meters/1000).toFixed(2)} km` : ''}。${esc(sp.name)}「たのしかったね！」<div class="pt-big" style="font-size:26px;margin-top:4px">+${pt} pt</div></div>
      <div class="glass" style="padding:12px;border-radius:20px;margin-top:10px">
        <div class="row">${gps ? '' : `<span class="opt-label">きょり</span><input type="number" class="input" id="rKm" placeholder="km（なくてOK）" step="0.1" min="0" style="width:130px">`}
          <span class="opt-label">体重</span><input type="number" class="input" id="rKg" placeholder="kg（なくてOK）" min="10" style="width:130px"></div>
        <div id="rCalc" class="sub" style="margin:8px 0 0"></div>
        <div class="row" style="justify-content:flex-end;margin-top:8px"><button class="btn" id="rSave">きろくして もどる</button></div>
      </div>
      <div class="fact-card" style="margin-top:10px"><span class="tag">からだの科学</span><b>${esc(f.t)}</b>　${esc(f.s)}<div class="line">「${esc(f.line)}」</div></div>`;
    const calc = () => {
      const km = gps ? meters / 1000 : (parseFloat($('#rKm').value) || 0), kg = parseFloat($('#rKg').value) || 0;
      const h = sec / 3600; const kmh = km ? km / h : 0;
      const m = km >= 0.05 ? mets(kmh) : 7.0; const w = kg || 55;
      const kcal = Math.round(m * w * h * 1.05);
      const spk = km >= 0.05 ? Math.round(sec / km) : 0;
      const pace = spk ? `${Math.floor(spk / 60)}分${String(spk % 60).padStart(2,'0')}秒 / km` : '—';
      $('#rCalc').innerHTML = `ペース：${pace}<br>参考消費カロリー：約 ${kcal} kcal ${kg ? '' : '（体重55kgとして計算）'}<br><span style="font-size:11px">※メッツ（運動の強さの目安）をもとにした、ざっくりの参考値です。</span>`;
      return { km, kcal };
    };
    if (!gps) $('#rKm').oninput = calc; $('#rKg').oninput = calc; calc();
    $('#rSave').onclick = () => {
      const { km, kcal } = calc();
      S.runs.push({ at: Date.now(), sec, km: +km.toFixed(2) || 0, kcal, sp: sp.id, gps, pt }); addSeeds({ O: 1, C: 1 });
      addPoints(pt, gps ? `ラン ${km.toFixed(2)}km` : `ラン ${Math.floor(sec/60)}分`); save();
      toast(`きろくしたよ。元素のたね O×1・C×1 も もらったよ`); renderActivity();
    };
  }
}
window.leaveActivity = () => { if (mode) { clearLoops(); stopGeo(); mode = null; } };
})();
