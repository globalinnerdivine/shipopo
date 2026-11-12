// ===== はじまり =====
(function(){
const renders = { task: renderTask, fusion: renderFusion, collection: renderCollection, island: renderIsland, activity: renderActivity, science: renderScience, shop: renderShop };
const NAMES = ['home','task','fusion','collection','island','activity','science','shop'];

window.go = function(name, push = true){
  if (!NAMES.includes(name)) name = 'home';
  if (name !== 'activity') leaveActivity();
  if (name !== 'island') leaveIsland();
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === name));
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === name));
  if (renders[name]) renders[name]();
  if (name === 'home') updateHomeCard();
  if (window.BGM) BGM.follow(name);
  if (push) { try { history.replaceState(null, '', name === 'home' ? location.pathname : '#' + name); } catch(e) { location.hash = name === 'home' ? '' : name; } }
};
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => { sfx('tap'); go(b.dataset.go); });
document.getElementById('settingsBtn').onclick = () => { sfx('tap'); openSettings(); };
document.getElementById('logoBtn').onclick = () => go('home');
document.getElementById('seedBar').onclick = () => go('fusion');

document.getElementById('ptBar').onclick = () => { sfx('tap'); go('shop'); };
window.renderSeedBar = function(){
  document.getElementById('ptNum').textContent = S.points || 0;
  document.getElementById('seedBar').innerHTML = Object.keys(ELEMENTS).map(k => `<span><b style="background:${ELEMENTS[k].color}">${k}</b>${S.seeds[k]||0}</span>`).join('');
};

window.updateHomeCard = function(){
  const today = todayStr();
  const open = S.tasks.filter(t => !t.done && (!t.date || t.date <= today)).length;
  const doneToday = S.history.filter(h => todayStr(new Date(h.at)) === today).length;
  const h = new Date().getHours();
  const greet = h < 5 ? 'しずかな夜だね' : h < 11 ? 'おはよう' : h < 16 ? 'こんにちは' : h < 19 ? 'ゆうやけの時間' : 'こんばんは';
  let msg;
  if (!S.fairies.length) msg = `${greet}。ここは粒子の向こうの、しぽぽの世界。`;
  else if (doneToday) msg = `${greet}。きょうは <b>${doneToday}</b> この ふわふわが生まれたよ。`;
  else msg = `${greet}。なにもしない日も、みんなここにいるよ。`;
  document.getElementById('homeCard').innerHTML = `<div class="msg">${msg}</div>${open ? `<button class="btn small" onclick="go('task')">きょうのこと ${open}</button>` : ''}`;
};

window.refreshAll = function(){
  renderSeedBar(); renderHomeFairies();
  const cur = document.querySelector('.screen.active')?.id || 'home';
  go(cur, false);
};

// データを守る：IndexedDB から復元・消えにくい保存
restoreFromIDB().then(r => { if (r) { refreshAll(); toast('保存していたデータをもとにもどしたよ ✨'); } });
const per = () => { askPersist(); removeEventListener('pointerdown', per); }; addEventListener('pointerdown', per);
// オフラインでも開けるように（自分のURLで公開したとき）
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) { try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch(e) {} }
addEventListener('hashchange', () => go(location.hash.slice(1) || 'home', false));
let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(renderHomeFairies, 300); });

if (!S.welcomed) { ['fuwamoko','shizukun','mebae'].forEach(id => addFairy(id, 'はじめての出会い（ようこそ！）')); S.welcomed = true; save(); }
renderSeedBar();
renderHomeFairies();
go(location.hash.slice(1) || 'home', false);
})();
