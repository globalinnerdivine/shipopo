// ===== おみせ（ポイントで買う） =====
(function(){
const $ = (s, r = document) => r.querySelector(s);
let tab = 'seed';
window.renderShop = function(){
  const p = $('#shopPanel');
  const size = S.island.size || 1;
  const today = todayStr();
  const earnedToday = S.pointLog.filter(l => l.n > 0 && todayStr(new Date(l.at)) === today).reduce((a, l) => a + l.n, 0);
  p.innerHTML = `<h2>✨ おみせ</h2>
    <div class="pt-hero"><div><div class="sub" style="margin:0">いまのポイント</div><div class="pt-big">${S.points} <small>pt</small></div></div>
      <div class="sub" style="margin:0;text-align:right">きょう集めた：${earnedToday} pt</div></div>
    <div class="note" style="margin-top:0">ポイントのもらい方：タスク完了 ${POINT_RULES.task}pt ／ おふろ ${POINT_RULES.bath}pt（1日${POINT_RULES.bathPerDay}回まで）／ ラン 100mごとに ${POINT_RULES.runPer100m}pt。お金では買えません。</div>
    <div class="seg" style="margin:12px 0;display:inline-flex">${[['seed','元素のたね'],['parts','しまのパーツ'],['island','島をひろげる'],['log','りれき']].map(([k,n])=>`<button data-tab="${k}" class="${tab===k?'on':''}">${n}</button>`).join('')}</div>
    <div id="shopBody"></div>`;
  const b = $('#shopBody');
  if (tab === 'seed') {
    b.innerHTML = `<div class="shop-grid">${Object.keys(ELEMENTS).map(k => `<div class="shop-card"><div class="pic">${atomSVG(k)}</div><b>${k} ${ELEMENTS[k].name}</b><span class="sub" style="margin:0">もってる：${S.seeds[k]||0}</span>
      <div class="row" style="justify-content:center;gap:4px"><button class="btn small" data-buy="${k}" data-n="1">${SEED_PRICE[k]}pt</button><button class="btn soft small" data-buy="${k}" data-n="5">5こ ${SEED_PRICE[k]*5}pt</button></div></div>`).join('')}</div>`;
    b.querySelectorAll('[data-buy]').forEach(x => x.onclick = () => { const k = x.dataset.buy, n = +x.dataset.n; if (spendPoints(SEED_PRICE[k] * n, k + 'のたね')) { addSeeds({ [k]: n }); toast(`${ELEMENTS[k].name}のたねを ${n}こ 手に入れたよ`); renderShop(); } });
  } else if (tab === 'parts') {
    const list = ISLAND_ITEMS.filter(i => i.price > 0);
    b.innerHTML = `<p class="sub">手に入れたパーツは、島の「🛠 つくる」でいくつでも置けます。置いたパーツは、選んで「グレードアップ」すると豪華になります（Lv2：${UPGRADE_COST[2]}pt、Lv3：${UPGRADE_COST[3]}pt）。</p>
      <div class="shop-grid">${list.map(i => { const own = S.island.owned.includes(i.id);
        return `<div class="shop-card ${own?'owned':''}"><div class="pic big">${itemArt(i.id)}</div><b>${i.name}</b>${own ? '<span class="sub" style="margin:0">✓ もってる</span>' : `<button class="btn small" data-part="${i.id}">${i.price}pt</button>`}</div>`; }).join('')}</div>
      <h3>グレードアップの見本</h3>
      <div class="shop-grid">${[1,2,3].map(l => `<div class="shop-card"><div class="pic big">${itemArt('house', l)}</div><b>${LV_NAMES.house[l-1]}</b><span class="sub" style="margin:0">Lv${l}</span></div>`).join('')}</div>`;
    b.querySelectorAll('[data-part]').forEach(x => x.onclick = () => { const it = ITEM_BY_ID[x.dataset.part]; if (spendPoints(it.price, it.name)) { S.island.owned.push(it.id); save(); toast(it.name + ' を手に入れたよ！島の「つくる」で置いてね'); renderShop(); } });
  } else if (tab === 'island') {
    b.innerHTML = `<div class="shop-grid">${[1,2,3].map(l => `<div class="shop-card ${size>=l?'owned':''}"><div class="pic big"><div class="mini-isl" style="--k:${[0,.55,.75,.95][l]}"></div></div><b>${ISLAND_SIZES[l].name}</b>
      ${size >= l ? '<span class="sub" style="margin:0">✓ いまの島</span>' : size === l - 1 ? `<button class="btn small" data-size="${l}">${ISLAND_SIZES[l].price}pt</button>` : '<span class="sub" style="margin:0">まず1つ前の大きさから</span>'}</div>`).join('')}</div>`;
    b.querySelectorAll('[data-size]').forEach(x => x.onclick = () => { const l = +x.dataset.size; if (spendPoints(ISLAND_SIZES[l].price, '島をひろげる')) { S.island.size = l; save(); toast(`島が「${ISLAND_SIZES[l].name}」になったよ！`); renderShop(); } });
  } else {
    const log = S.pointLog.slice().reverse().slice(0, 60);
    b.innerHTML = `<div class="hist">${log.map(l => `<div><span>${fmtDate(l.at)} ${esc(l.why || '')}</span><b style="color:${l.n>0?'#3fb394':'#b07ad6'}">${l.n>0?'+':''}${l.n} pt</b></div>`).join('') || '<div><span>まだありません</span></div>'}</div>`;
  }
  p.querySelectorAll('[data-tab]').forEach(x => x.onclick = () => { tab = x.dataset.tab; renderShop(); });
};
})();
