// ===== 妖精のSVGを組み立てる =====
(function(){
let uid = 0;

// ===== フワフワの毛並み =====
const NS = 'http://www.w3.org/2000/svg';
const furCache = {};
let sampler = null;
const sr = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function strands(pts, len, key){
  // pts: [{x,y,nx,ny,tx,ty}]  -> 2本のパス（体の色 / ハイライト）
  let a = '', b = '', h = '';
  pts.forEach((p, i) => {
    const r1 = sr(i + key), r2 = sr(i * 3.7 + key), L = len * (0.6 + r1 * 0.75);
    const sw = (r2 - 0.5) * len * 0.9;
    const bx = p.x - p.nx * 1.6, by = p.y - p.ny * 1.6;
    const cx = p.x + p.nx * L * 0.55 + p.tx * sw * 0.3, cy = p.y + p.ny * L * 0.55 + p.ty * sw * 0.3;
    const ex = p.x + p.nx * L + p.tx * sw, ey = p.y + p.ny * L + p.ty * sw;
    const seg = `M${bx.toFixed(1)} ${by.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    if (i % 2) a += seg; else b += seg;
    if (p.ny < -0.35 && i % 3 === 0) h += `M${(p.x - p.nx*0.5).toFixed(1)} ${(p.y - p.ny*0.5).toFixed(1)}Q${(cx - p.nx).toFixed(1)} ${(cy - p.ny).toFixed(1)} ${(ex - p.nx*1.5).toFixed(1)} ${(ey - p.ny*1.5).toFixed(1)}`;
  });
  return { a, b, h, top: pts.reduce((m, p) => p.y < m.y ? p : m, pts[0]) };
}
function pathFur(d, len = 4.6, step = 2.2){
  const key = d.length + ':' + len;
  if (furCache[d + len]) return furCache[d + len];
  if (!sampler) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    sampler = document.createElementNS(NS, 'path'); svg.appendChild(sampler); document.body.appendChild(svg);
  }
  sampler.setAttribute('d', d);
  const L = sampler.getTotalLength(), raw = [];
  for (let l = 0; l < L; l += step) raw.push(sampler.getPointAtLength(l));
  let area = 0;
  raw.forEach((p, i) => { const q = raw[(i + 1) % raw.length]; area += p.x * q.y - q.x * p.y; });
  const pts = raw.map((p, i) => {
    const q = raw[(i + 1) % raw.length], o = raw[(i - 1 + raw.length) % raw.length];
    let tx = q.x - o.x, ty = q.y - o.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = area > 0 ? ty : -ty, ny = area > 0 ? -tx : tx;
    return { x: p.x, y: p.y, nx, ny, tx, ty };
  });
  return (furCache[d + len] = strands(pts, len, d.length));
}
function circlePts(cx, cy, r, step = 2.6){
  const n = Math.max(12, Math.round(2 * Math.PI * r / step)), pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const nx = Math.cos(a), ny = Math.sin(a); pts.push({ x: cx + nx * r, y: cy + ny * r, nx, ny, tx: -ny, ty: nx }); }
  return pts;
}
function furSvg(f, c1, c2, w = 2.1){
  return `<g class="fur" stroke-linecap="round" fill="none">
    <path d="${f.b}" stroke="${c1}" stroke-width="${w}"/>
    <path d="${f.a}" stroke="${c2}" stroke-width="${w * 0.85}"/>
    <path d="${f.h}" stroke="#fff" stroke-width="${w * 0.6}" opacity=".85"/></g>`;
}
function circleFur(cx, cy, r, c1, c2, len = 3.2){
  return furSvg(strands(circlePts(cx, cy, r), len, Math.round(cx * 7 + cy)), c1, c2, 1.7);
}

// 形ごとの体のパス（viewBox 0 0 120 120、体の中心は 60,68 付近）
// face: 顔の中心と大きさ / feet: 足を出すか
const SHAPES = {
  round:   { d:'M60 26 C86 26 98 46 98 68 C98 92 82 104 60 104 C38 104 22 92 22 68 C22 46 34 26 60 26Z', face:[60,66,1], feet:true, hands:[22,98,72] },
  cloud:   { d:'M30 94 C16 94 12 78 22 70 C14 58 26 44 38 50 C38 34 58 28 66 40 C74 28 96 34 92 52 C106 54 108 74 96 80 C100 92 88 98 80 94 Z', face:[60,70,1], feet:true, hands:[18,102,76] },
  drop:    { d:'M60 18 C66 34 96 54 96 76 C96 96 80 106 60 106 C40 106 24 96 24 76 C24 54 54 34 60 18Z', face:[60,76,1], feet:true, hands:[24,96,80] },
  star:    { d:'M60 18 Q66 18 70 40 Q72 46 78 46 Q100 46 100 52 Q100 56 84 70 Q80 74 82 80 Q90 102 84 104 Q80 106 64 92 Q60 90 56 92 Q40 106 36 104 Q30 102 38 80 Q40 74 36 70 Q20 56 20 52 Q20 46 42 46 Q48 46 50 40 Q54 18 60 18Z', face:[60,64,0.85], feet:false, hands:null },
  crescent:{ d:'M74 18 C46 22 28 44 28 66 C28 90 48 106 72 106 C84 106 94 100 100 92 C78 96 58 82 58 60 C58 40 68 26 74 18Z', face:[48,66,0.8], feet:false, hands:null },
  jelly:   { d:'M24 66 C24 40 40 26 60 26 C80 26 96 40 96 66 C96 72 92 74 88 72 C84 76 80 76 76 72 C72 76 68 76 64 72 C60 76 56 76 52 72 C48 76 44 76 40 72 C36 76 32 76 28 72 C24 74 24 70 24 66Z', face:[60,54,0.95], feet:false, hands:null, tentacles:true },
  bubble:  { d:'M60 24 C86 24 100 44 100 66 C100 90 84 106 60 106 C36 106 20 90 20 66 C20 44 34 24 60 24Z', face:[60,66,1], feet:false, hands:null, bubble:true },
  bean:    { d:'M60 36 C90 36 106 52 106 72 C106 92 88 102 60 102 C32 102 14 92 14 72 C14 52 30 36 60 36Z', face:[60,72,1], feet:true, hands:[14,106,78] },
  wave:    { d:'M26 100 C18 80 24 56 44 42 C60 30 82 30 94 44 C80 40 70 48 72 58 C74 66 84 66 90 60 C98 76 96 100 80 104 C62 108 38 108 26 100Z', face:[52,80,0.9], feet:true, hands:[22,96,86] },
  mushroom:{ d:'M40 64 L80 64 C84 64 86 70 86 80 C86 96 76 104 60 104 C44 104 34 96 34 80 C34 70 36 64 40 64Z', face:[60,82,0.85], feet:true, hands:[34,86,86], cap:true },
  acorn:   { d:'M60 40 C84 40 94 58 92 74 C90 94 76 106 60 108 C44 106 30 94 28 74 C26 58 36 40 60 40Z', face:[60,78,0.9], feet:true, hands:[28,92,82] },
  fuzzy:   { d:null, face:[60,68,1], feet:true, hands:[20,100,74], fuzzy:true },
  cube:    { d:'M34 34 L86 34 C96 34 100 40 100 50 L100 90 C100 100 94 104 86 104 L34 104 C26 104 20 100 20 90 L20 50 C20 40 24 34 34 34Z', face:[60,70,1], feet:true, hands:[20,100,76] },
  pudding: { d:'M38 44 L82 44 C88 44 90 48 92 56 L100 92 C102 100 96 104 88 104 L32 104 C24 104 18 100 20 92 L28 56 C30 48 32 44 38 44Z', face:[60,78,0.9], feet:false, hands:[22,98,84], caramel:true },
  spiky:   { d:null, face:[60,66,0.9], feet:true, hands:null, spiky:true },
  berry:   { d:'M60 108 C40 100 22 80 22 60 C22 44 36 38 50 40 C54 41 57 43 60 44 C63 43 66 41 70 40 C84 38 98 44 98 60 C98 80 80 100 60 108Z', face:[60,66,0.9], feet:false, hands:[22,98,68], seeds:true },
  dango:   { d:null, face:[60,64,0.75], feet:false, hands:null, dango:true },
  ghost:   { d:'M24 64 C24 40 40 22 60 22 C80 22 96 40 96 64 L96 100 C92 106 88 98 84 98 C80 98 78 106 72 106 C66 106 64 98 60 98 C56 98 54 106 48 106 C42 106 40 98 36 98 C32 98 28 106 24 100Z', face:[60,60,1], feet:false, hands:[24,96,72] },
  tall:    { d:'M60 22 C82 22 92 44 92 66 C92 92 80 108 60 108 C40 108 28 92 28 66 C28 44 38 22 60 22Z', face:[60,70,0.9], feet:true, hands:[28,92,78] },
  prism:   { d:'M60 18 C64 18 66 22 68 26 L100 90 C104 98 100 104 92 104 L28 104 C20 104 16 98 20 90 L52 26 C54 22 56 18 60 18Z', face:[60,76,0.85], feet:true, hands:null },
  egg:     { d:'M60 18 C84 18 98 52 98 76 C98 96 82 108 60 108 C38 108 22 96 22 76 C22 52 36 18 60 18Z', face:[60,74,0.95], feet:true, hands:null },
};

function atom(cx, cy, r, color, gid, label){
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid}a)" />
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity=".55"/>
  ${circleFur(cx, cy, r - 0.5, color, '#ffffff', r > 20 ? 3.4 : 2.6)}
  <ellipse cx="${cx - r*0.35}" cy="${cy - r*0.42}" rx="${r*0.38}" ry="${r*0.24}" fill="#fff" opacity=".8"/>
  ${label ? `<text x="${cx}" y="${cy + r*0.72}" font-size="${Math.max(7, r*0.42)}" text-anchor="middle" fill="rgba(60,60,90,.55)" font-weight="700">${label}</text>` : ''}`;
}

// 分子の妖精：原子の玉のならびそのものが体
const MOLS = {
  mol_h2: g => ({ body: atom(42,66,24,'#e4e9ff',g,'H') + atom(78,66,24,'#e4e9ff',g,'H'), face:[60,64,0.8], bond:'M54 66 L66 66' }),
  mol_o2: g => ({ body: atom(40,66,26,'#ffc4c4',g,'O') + atom(80,66,26,'#ffc4c4',g,'O'), face:[60,64,0.8] }),
  mol_n2: g => ({ body: atom(40,66,25,'#bcd2ff',g,'N') + atom(80,66,25,'#bcd2ff',g,'N'), face:[60,64,0.8] }),
  // 水：約104.5°に曲がった形
  mol_h2o: g => ({ body: atom(30,86,17,'#e4e9ff',g,'H') + atom(90,86,17,'#e4e9ff',g,'H') + atom(60,60,30,'#a9e2ff',g,''), face:[60,58,0.85] }),
  // 二酸化炭素：一直線
  mol_co2: g => ({ body: atom(22,68,19,'#ffc4c4',g,'O') + atom(98,68,19,'#ffc4c4',g,'O') + atom(60,68,24,'#c7c9d4',g,''), face:[60,66,0.7] }),
  // 塩化ナトリウム：立方体の結晶（交互のならび）
  mol_nacl: g => {
    let s = '';
    const pts = [[38,48],[60,48],[82,48],[38,70],[60,70],[82,70],[38,92],[60,92],[82,92]];
    pts.forEach((p,i)=>{ const na = i%2===0; s += atom(p[0],p[1], na?10:13, na?'#ffe08a':'#c8f59a', g, ''); });
    return { body: `<rect x="24" y="34" width="72" height="72" rx="14" fill="rgba(255,255,255,.55)" stroke="rgba(170,190,220,.7)" stroke-width="2"/>` + s, face:[60,70,0.7], faceBg:true };
  },
  // メタン：真ん中に炭素、まわりに水素4こ
  mol_ch4: g => ({ body: atom(24,46,14,'#e4e9ff',g,'H') + atom(96,46,14,'#e4e9ff',g,'H') + atom(30,98,14,'#e4e9ff',g,'H') + atom(90,98,14,'#e4e9ff',g,'H') + atom(60,70,28,'#b6e8c8',g,''), face:[60,68,0.8] }),
  // アンモニア：三角すい
  mol_nh3: g => ({ body: atom(26,94,15,'#e4e9ff',g,'H') + atom(94,94,15,'#e4e9ff',g,'H') + atom(60,102,13,'#e4e9ff',g,'H') + atom(60,62,29,'#cdbfff',g,''), face:[60,60,0.85] }),
  // 黒鉛：六角形の層
  mol_graphite: g => {
    const hex = (cx,cy,r)=>{ let p=''; for(let i=0;i<6;i++){ const a=Math.PI/3*i+Math.PI/6; p+=(i?'L':'M')+(cx+r*Math.cos(a)).toFixed(1)+' '+(cy+r*Math.sin(a)).toFixed(1);} return p+'Z'; };
    return { body: `
      <path d="M18 92 L102 92 L94 104 L26 104Z" fill="#7b8192" opacity=".55"/>
      <path d="M14 78 L106 78 L98 92 L22 92Z" fill="#8f95a6" opacity=".75"/>
      <rect x="22" y="34" width="76" height="46" rx="16" fill="url(#${g}b)"/>
      <path d="${hex(42,57,11)} ${hex(61,57,11)} ${hex(80,57,11)}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`, face:[60,56,0.75] };
  },
  // オゾン：3つの酸素が少し曲がってならぶ
  mol_o3: g => ({ body: atom(26,84,19,'#ffc4c4',g,'O') + atom(94,84,19,'#ffc4c4',g,'O') + atom(60,60,27,'#c8dcff',g,''), face:[60,58,0.8] }),
  // 一酸化炭素：2つ
  mol_co: g => ({ body: atom(40,66,25,'#c7c9d4',g,'C') + atom(80,66,22,'#ffc4c4',g,'O'), face:[44,64,0.75] }),
  // 塩化水素：小さなHと大きなCl
  mol_hcl: g => ({ body: atom(26,70,15,'#e4e9ff',g,'H') + atom(70,64,31,'#d6f7b8',g,''), face:[72,62,0.85] }),
  // 水酸化ナトリウム：Na⁺ と OH⁻
  mol_naoh: g => ({ body: atom(28,72,20,'#ffe08a',g,'Na⁺') + atom(72,60,26,'#ffd0c4',g,'') + atom(102,40,12,'#e4e9ff',g,'H') + `<text x="88" y="98" font-size="11" font-weight="800" fill="rgba(60,60,90,.5)">OH⁻</text>`, face:[72,58,0.75] }),
  // エタノール：C-C-O のつながりと水素
  mol_ethanol: g => ({ body: [[14,44],[16,90],[30,24],[56,26],[60,104],[106,46]].map(([x,y])=>atom(x,y,10,'#e4e9ff',g,'')).join('') + atom(36,66,19,'#c7c9d4',g,'') + atom(94,68,18,'#ffc4c4',g,'O') + atom(64,64,23,'#ddd0ff',g,''), face:[64,62,0.7] }),
  // 炭酸カルシウム：貝がらの形 + Ca
  mol_caco3: g => ({ body: `<path d="M60 22 C30 22 14 50 18 78 C22 100 98 100 102 78 C106 50 90 22 60 22Z" fill="url(#${g}a)"/>
      <path d="M60 24 L60 96 M60 24 L36 94 M60 24 L84 94 M60 24 L22 80 M60 24 L98 80" stroke="${'#f0c2b0'}" stroke-width="2.5" opacity=".7"/>
      <path d="M60 22 C30 22 14 50 18 78 C22 100 98 100 102 78 C106 50 90 22 60 22Z" fill="none" stroke="#fff" stroke-width="2"/>` + atom(96,30,11,'#f4efe4',g,'Ca'), face:[60,70,0.8] }),
  // 酸化鉄：さびっぽいかたまり
  mol_fe2o3: g => ({ body: atom(26,82,15,'#ffc4c4',g,'O') + atom(94,82,15,'#ffc4c4',g,'O') + atom(60,28,15,'#ffc4c4',g,'O') + atom(38,62,24,'#d9a184',g,'') + atom(82,62,24,'#d9a184',g,'') + `<ellipse cx="60" cy="70" rx="26" ry="22" fill="url(#${g}a)"/>`, face:[60,68,0.75] }),
  // 硫化水素：水とにた形（すこし角度がせまい）
  mol_h2s: g => ({ body: atom(32,90,15,'#e4e9ff',g,'H') + atom(88,90,15,'#e4e9ff',g,'H') + atom(60,60,31,'#fff2a0',g,'') + `<path d="M40 22 C36 14 44 10 42 2 M60 20 C56 12 64 8 62 0 M80 22 C76 14 84 10 82 2" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`, face:[60,58,0.85] }),
  // 酸化マグネシウム：白い結晶
  mol_mgo: g => {
    let s = '';
    [[38,48],[60,48],[82,48],[38,70],[60,70],[82,70],[38,92],[60,92],[82,92]].forEach((p,i)=>{ const mg = i%2===0; s += atom(p[0],p[1], mg?10:12, mg?'#e6edf7':'#ffc4c4', g, ''); });
    return { body: `<circle cx="60" cy="70" r="54" fill="#fff7c9" opacity=".35"/><rect x="24" y="34" width="72" height="72" rx="14" fill="rgba(255,255,255,.7)" stroke="rgba(170,190,220,.7)" stroke-width="2"/>` + s + `<circle cx="60" cy="70" r="20" fill="rgba(255,255,255,.8)"/>`, face:[60,70,0.7] };
  },
  // ヘリウム：ひとりで浮かぶ風船
  mol_he: g => ({ body: `<path d="M60 92 C56 100 66 106 60 116 C56 122 62 126 60 130" stroke="#c9b6ff" stroke-width="2" fill="none"/><path d="M54 92 L66 92 L60 86Z" fill="#ff9cd0"/>` + atom(60,56,36,'#ffd6f0',g,''), face:[60,54,1] }),
  // ダイヤモンド：宝石の形
  mol_diamond: g => ({ body: `
      <path d="M34 34 L86 34 L104 56 L60 108 L16 56Z" fill="url(#${g}b)" stroke="rgba(255,255,255,.9)" stroke-width="2"/>
      <path d="M16 56 L104 56 M34 34 L48 56 L60 108 M86 34 L72 56 L60 108 M48 56 L60 34 L72 56" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/>
      <path d="M34 34 L48 56 L16 56Z" fill="#fff" opacity=".35"/>`, face:[60,66,0.7] }),
};

function accessory(acc, sp, g){
  const c3 = sp.c3;
  switch(acc){
    case 'sprout': return `<g class="sway"><path d="M60 38 C60 30 60 26 60 22" stroke="#6bbf5a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M60 26 C50 14 40 20 42 26 C46 30 56 28 60 26Z" fill="#8ee07a"/><path d="M60 24 C70 12 82 18 78 24 C74 28 64 28 60 24Z" fill="#a7ec8f"/></g>`;
    case 'swirl': return `<path class="sway" d="M60 20 C60 10 72 8 74 16 C76 22 68 24 66 19" stroke="${c3}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'rainbow': return `<g class="sway" fill="none" stroke-width="4" stroke-linecap="round"><path d="M34 32 C40 10 80 10 86 32" stroke="#ffb3c7"/><path d="M39 33 C44 16 76 16 81 33" stroke="#ffe39a"/><path d="M44 34 C48 22 72 22 76 34" stroke="#a6ecd0"/><path d="M49 35 C52 28 68 28 71 35" stroke="#b8c8ff"/></g>`;
    case 'bolt': return `<path class="sway" d="M64 4 L50 24 L60 24 L54 40 L72 18 L62 18 L68 4Z" fill="#ffd84d" stroke="#f5b800" stroke-width="1.5" stroke-linejoin="round"/>`;
    case 'snow': return `<g class="spin-slow" style="transform-origin:60px 18px" stroke="#9fd6ff" stroke-width="2.5" stroke-linecap="round"><path d="M60 6 L60 30 M49.6 12 L70.4 24 M49.6 24 L70.4 12"/></g>`;
    case 'coral': return `<g class="sway" fill="${c3}"><path d="M42 42 C40 30 34 26 36 18 C40 16 42 24 44 28 C46 20 50 18 52 22 C50 30 48 36 50 42Z"/><path d="M70 42 C72 32 70 24 76 20 C80 22 76 30 78 32 C82 26 86 28 84 32 C80 36 78 40 78 44Z"/></g>`;
    case 'petals': return `<g class="sway">${[0,1,2,3,4].map(i=>{const a=-Math.PI/2+(i-2)*0.42;const x=60+Math.cos(a)*34,y=46+Math.sin(a)*34;return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="13" fill="${i%2?'#ffc2e0':'#ffd6ea'}" transform="rotate(${(a*180/Math.PI+90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}).join('')}<circle cx="60" cy="14" r="5" fill="#ffe38a"/></g>`;
    case 'acorncap': return `<path d="M24 54 C24 34 42 28 60 28 C78 28 96 34 96 54 C84 50 72 48 60 48 C48 48 36 50 24 54Z" fill="#a8784a"/><path d="M30 46 L90 46 M28 40 L92 40" stroke="#8c5f35" stroke-width="1.5" opacity=".6"/><path d="M60 28 L62 18" stroke="#8c5f35" stroke-width="3" stroke-linecap="round"/>`;
    case 'ring': return `<ellipse cx="60" cy="72" rx="56" ry="14" fill="none" stroke="${c3}" stroke-width="5" opacity=".85" transform="rotate(-12 60 72)" class="ring-front"/>`;
    case 'tail': return `<path d="M96 60 C112 50 118 40 120 30 C114 46 110 56 98 72Z" fill="${c3}" opacity=".6"/><path d="M98 66 C114 62 120 58 122 52 C116 62 110 70 98 76Z" fill="${c3}" opacity=".4"/>`;
    case 'sparkle': return `<g class="twinkle" fill="#fff"><path d="M98 24 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3Z"/><path d="M20 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" opacity=".8"/></g>`;
    case 'leaves': return `<g><path d="M60 46 C50 32 36 36 38 42 C46 46 54 46 60 46Z" fill="#7ad36a"/><path d="M60 46 C70 32 84 36 82 42 C74 46 66 46 60 46Z" fill="#7ad36a"/><path d="M60 46 C58 36 60 32 64 30" stroke="#5aa94c" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
    case 'antenna': return `<g class="sway" stroke="#9bc94a" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M50 30 C46 18 40 14 36 12"/><path d="M70 30 C74 18 80 14 84 12"/></g><circle cx="36" cy="12" r="5" fill="#eaff8a" class="glow-dot"/><circle cx="84" cy="12" r="5" fill="#eaff8a" class="glow-dot"/>`;
    case 'nightcap': return `<path d="M34 40 C36 14 70 6 88 22 C96 30 100 40 102 50 C94 36 82 30 72 30 C60 30 46 34 34 40Z" fill="#b9c4ff"/><circle cx="103" cy="52" r="6" fill="#fff"/><path d="M34 40 C50 32 70 30 86 34" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    case 'crack': return `<path d="M30 60 L42 54 L50 62 L60 52 L70 62 L80 54 L90 60" stroke="${c3}" stroke-width="2.5" fill="none" stroke-linejoin="round"/>`;
    case 'hakase': return `<g><path d="M30 34 L60 20 L90 34 L60 46Z" fill="#6b5fa0"/><rect x="48" y="36" width="24" height="10" rx="3" fill="#6b5fa0"/><path d="M88 34 L92 50" stroke="#ffd36b" stroke-width="2.5"/><circle cx="92" cy="52" r="3.5" fill="#ffd36b"/></g>`;
    case 'cherry': return `<circle cx="62" cy="30" r="9" fill="#ff5e7e"/><ellipse cx="59" cy="27" rx="3" ry="2" fill="#fff" opacity=".8"/><path d="M62 22 C62 14 68 10 72 8" stroke="#6b9b4c" stroke-width="2" fill="none"/>`;
    default: return '';
  }
}

function eyes(type, fx, fy, k, mood, lid = '#fff'){
  const ex = 15*k, ey = fy - 2*k, r = 8.5*k;
  if (mood === 'sleep' || type === 'closed') {
    return `<g class="eyes" stroke="#4a3f66" stroke-width="${2.6*k}" fill="none" stroke-linecap="round">
      <path d="M${fx-ex-6*k} ${ey} Q${fx-ex} ${ey+6*k} ${fx-ex+6*k} ${ey}"/><path d="M${fx+ex-6*k} ${ey} Q${fx+ex} ${ey+6*k} ${fx+ex+6*k} ${ey}"/></g>`;
  }
  if (mood === 'happy') {
    return `<g class="eyes" stroke="#4a3f66" stroke-width="${2.8*k}" fill="none" stroke-linecap="round">
      <path d="M${fx-ex-6*k} ${ey+3*k} Q${fx-ex} ${ey-6*k} ${fx-ex+6*k} ${ey+3*k}"/><path d="M${fx+ex-6*k} ${ey+3*k} Q${fx+ex} ${ey-6*k} ${fx+ex+6*k} ${ey+3*k}"/></g>`;
  }
  const ry = type === 'sleepy' ? r*0.7 : r;
  const one = (x)=>`<ellipse cx="${x}" cy="${ey}" rx="${r*0.86}" ry="${ry}" fill="#3d335a"/>
    <ellipse cx="${x}" cy="${ey + ry*0.45}" rx="${r*0.6}" ry="${ry*0.35}" fill="#7b6bb5" opacity=".7"/>
    <circle cx="${x - r*0.3}" cy="${ey - ry*0.38}" r="${r*0.34}" fill="#fff"/>
    <circle cx="${x + r*0.32}" cy="${ey + ry*0.2}" r="${r*0.15}" fill="#fff"/>
    ${type==='sparkle' ? `<path d="M${x+r*0.25} ${ey-ry*0.6} l${r*0.12} ${r*0.25} ${r*0.25} ${r*0.12} -${r*0.25} ${r*0.12} -${r*0.12} ${r*0.25} -${r*0.12} -${r*0.25} -${r*0.25} -${r*0.12} ${r*0.25} -${r*0.12}Z" fill="#fff"/>` : ''}
    ${type==='sleepy' ? `<path d="M${x-r*1.05} ${ey-ry*0.15} Q${x} ${ey-ry*1.5} ${x+r*1.05} ${ey-ry*0.15} Q${x} ${ey-ry*0.55} ${x-r*1.05} ${ey-ry*0.15}Z" fill="${lid}"/><path d="M${x-r*1.05} ${ey-ry*0.15} Q${x} ${ey-ry*0.55} ${x+r*1.05} ${ey-ry*0.15}" stroke="#3d335a" stroke-width="${1.6*k}" fill="none" stroke-linecap="round"/>` : ''}`;
  return `<g class="look"><g class="eyes">${one(fx-ex)}${one(fx+ex)}</g></g>`;
}

function face(sp, fx, fy, k, mood){
  const mouth = mood==='surprise'
    ? `<ellipse cx="${fx}" cy="${fy+11*k}" rx="${3.5*k}" ry="${4.5*k}" fill="#5a3f66"/>`
    : mood==='sleep'
      ? `<path d="M${fx-3*k} ${fy+11*k} Q${fx} ${fy+13*k} ${fx+3*k} ${fy+11*k}" stroke="#5a3f66" stroke-width="${2*k}" fill="none" stroke-linecap="round"/>`
      : `<path d="M${fx-5*k} ${fy+9*k} Q${fx} ${fy+15*k} ${fx+5*k} ${fy+9*k}" stroke="#5a3f66" stroke-width="${2.2*k}" fill="${mood==='happy'?'#ff8fab':'none'}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `${eyes(sp.eyes, fx, fy, k, mood, sp.c2)}
    <ellipse cx="${fx-25*k}" cy="${fy+7*k}" rx="${6*k}" ry="${3.6*k}" fill="#ff9cbc" opacity=".55"/>
    <ellipse cx="${fx+25*k}" cy="${fy+7*k}" rx="${6*k}" ry="${3.6*k}" fill="#ff9cbc" opacity=".55"/>
    ${mouth}`;
}

// silhouette: 未発見 / mood: normal|happy|sleep|surprise
window.fairySVG = function(sp, opt = {}){
  const g = 'f' + (uid++);
  const mood = opt.mood || 'normal';
  const sil = !!opt.silhouette;
  const S = SHAPES[sp.shape];
  let body = '', fx = 60, fy = 66, k = 1, extra = '', back = '';
  const defs = `<defs>
    <radialGradient id="${g}a" cx="38%" cy="30%" r="75%">
      <stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>
      <stop offset=".35" stop-color="${sp.c2}"/>
      <stop offset="1" stop-color="${sp.c1}"/>
    </radialGradient>
    <linearGradient id="${g}b" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${sp.c2}"/><stop offset="1" stop-color="${sp.c3}"/>
    </linearGradient>
  </defs>`;

  if (MOLS[sp.shape]) {
    const m = MOLS[sp.shape](g);
    body = m.body; [fx, fy, k] = m.face;
  } else {
    [fx, fy, k] = S.face;
    const fill = `url(#${g}a)`;
    if (S.fuzzy) {
      let p = ''; const n = 22;
      for (let i = 0; i <= n; i++) { const a = i/n*Math.PI*2; const rr = (i%2? 38 : 42); p += (i?'L':'M') + (60+Math.cos(a)*rr).toFixed(1) + ' ' + (68+Math.sin(a)*rr*0.92).toFixed(1); }
      body = `<path d="${p}Z" fill="${fill}" stroke="${sp.c3}" stroke-width="2" stroke-linejoin="round"/>`;
      for (let i=0;i<7;i++){ body += `<circle cx="${36+i*8}" cy="${58+(i%3)*12}" r="2" fill="${sp.c3}" opacity=".4"/>`; }
      body += circleFur(60, 68, 38, sp.c1, sp.c2, 5.5);
    } else if (S.spiky) {
      let p=''; const n=16;
      for(let i=0;i<=n*2;i++){ const a=i/(n*2)*Math.PI*2; const rr=i%2?32:40; p+=(i?'L':'M')+(60+Math.cos(a)*rr).toFixed(1)+' '+(66+Math.sin(a)*rr).toFixed(1); }
      body = `<path d="${p}Z" fill="${fill}" stroke="${sp.c3}" stroke-width="3" stroke-linejoin="round"/>`;
    } else if (S.dango) {
      body = `<path d="M60 4 L60 116" stroke="#d6b48a" stroke-width="4" stroke-linecap="round"/>
        <circle cx="60" cy="24" r="18" fill="#ffd0dc"/><circle cx="60" cy="64" r="22" fill="${fill}" stroke="#f3e8ec" stroke-width="1.5"/><circle cx="60" cy="100" r="17" fill="#cfeec0"/>
        <ellipse cx="53" cy="18" rx="5" ry="3" fill="#fff" opacity=".7"/><ellipse cx="54" cy="95" rx="5" ry="3" fill="#fff" opacity=".7"/>`
        + circleFur(60, 24, 17.5, '#ffd0dc', '#fff', 3.5) + circleFur(60, 64, 21.5, '#f6eef2', '#fff', 4) + circleFur(60, 100, 16.5, '#cfeec0', '#fff', 3.5);
    } else {
      body = `<path d="${S.d}" fill="${fill}"/>`;
      if (S.cap) body = `<path d="M18 66 C18 38 38 20 60 20 C82 20 102 38 102 66 C90 70 30 70 18 66Z" fill="${sp.c3}"/>
        <circle cx="40" cy="44" r="7" fill="#fff" opacity=".85"/><circle cx="66" cy="34" r="6" fill="#fff" opacity=".85"/><circle cx="84" cy="52" r="5" fill="#fff" opacity=".85"/>` + body;
      if (S.caramel) body += `<path d="M38 44 L82 44 C88 44 90 48 91 54 C84 62 80 54 74 60 C68 66 64 56 58 62 C52 66 46 58 40 62 C34 64 30 58 29 54 C30 48 32 44 38 44Z" fill="${sp.c3}" opacity=".9"/>`;
      if (S.seeds) for (let i=0;i<10;i++){ const x=36+((i*13)%48), y=56+((i*7)%36); body += `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.4" fill="#ffe9a8"/>`; }
      if (S.tentacles) extra += `<g class="tentacles" stroke="${sp.c3}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7">
        <path d="M34 74 C30 86 38 94 32 106"/><path d="M48 76 C46 90 52 96 48 110"/><path d="M62 76 C62 90 68 96 64 112"/><path d="M76 76 C78 88 72 96 76 108"/><path d="M88 74 C92 84 86 94 90 104"/></g>`;
      if (S.bubble) body += `<path d="${S.d}" fill="none" stroke="url(#${g}b)" stroke-width="3" opacity=".8"/><path d="M36 50 C40 38 50 32 60 32" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`;
      // ふち（ガラスのような）
      if (S.d && S.bubble) body += `<path d="${S.d}" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"/>`;
      // 下の影
      if (S.d && !S.bubble) body += `<path d="${S.d}" fill="url(#${g}b)" opacity=".28" style="mix-blend-mode:multiply"/>`;
      // ハイライト
      if (S.d && !S.bubble) {
        const len = ['prism','cube','pudding'].includes(sp.shape) ? 3.2 : 4.6;
        const f = pathFur(S.d, len);
        body += furSvg(f, sp.c1, sp.c2);
        if (sp.acc === 'none' && !S.cap) {
          const t = f.top; // アホ毛
          body += `<g class="sway" stroke="${sp.c1}" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M${t.x} ${t.y+2} C${t.x-3} ${t.y-8} ${t.x+7} ${t.y-12} ${t.x+6} ${t.y-5}"/><path d="M${t.x-2} ${t.y+2} C${t.x-8} ${t.y-6} ${t.x-10} ${t.y-1} ${t.x-7} ${t.y+1}" stroke="${sp.c2}"/></g>`;
        }
      }
      if (S.cap) body += furSvg(pathFur('M18 66 C18 38 38 20 60 20 C82 20 102 38 102 66 C90 70 30 70 18 66Z', 4), sp.c3, '#fff');
      if (!S.dango && !S.spiky) body += `<ellipse cx="${fx-20*k}" cy="${fy-24*k}" rx="${11*k}" ry="${6*k}" fill="#fff" opacity=".75" transform="rotate(-25 ${fx-20*k} ${fy-24*k})"/>`;
    }
  }

  // 手足
  let limbs = '';
  if (!MOLS[sp.shape] && S.hands) {
    const [hl, hr, hy] = S.hands;
    limbs += `<ellipse class="hand hl" cx="${hl+2}" cy="${hy}" rx="6" ry="8" fill="${sp.c1}" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/>
              <ellipse class="hand hr" cx="${hr-2}" cy="${hy}" rx="6" ry="8" fill="${sp.c1}" stroke="rgba(255,255,255,.8)" stroke-width="1.5"/>`;
  }
  let feet = '';
  if (!MOLS[sp.shape] && S.feet) {
    feet = `<ellipse class="foot fl" cx="46" cy="106" rx="9" ry="6" fill="${sp.c3}" opacity=".85"/>
            <ellipse class="foot fr" cx="74" cy="106" rx="9" ry="6" fill="${sp.c3}" opacity=".85"/>`;
  }

  const acc = accessory(sp.acc, sp, g);
  const ringBack = sp.acc==='ring' ? `<ellipse cx="60" cy="72" rx="56" ry="14" fill="none" stroke="${sp.c3}" stroke-width="5" opacity=".5" transform="rotate(-12 60 72)"/>` : '';
  const isFrontAcc = ['ring'].includes(sp.acc);
  const glasses = sp.acc === 'hakase' ? `<g fill="rgba(255,255,255,.25)" stroke="#6b5fa0" stroke-width="2.6"><circle cx="${fx-15*k}" cy="${fy-2*k}" r="${12*k}"/><circle cx="${fx+15*k}" cy="${fy-2*k}" r="${12*k}"/><path d="M${fx-3*k} ${fy-3*k} L${fx+3*k} ${fy-3*k}" fill="none"/></g><path d="M${fx-6} ${fy+26*k} L${fx} ${fy+22*k} L${fx+6} ${fy+26*k} L${fx} ${fy+30*k}Z M${fx-6} ${fy+26*k} L${fx-12} ${fy+21*k} L${fx-12} ${fy+31*k}Z M${fx+6} ${fy+26*k} L${fx+12} ${fy+21*k} L${fx+12} ${fy+31*k}Z" fill="#ff8fb6"/>` : '';

  const faceSvg = (MOLS[sp.shape] && sp.shape==='mol_nacl')
    ? `<circle cx="${fx}" cy="${fy}" r="20" fill="rgba(255,255,255,.75)"/>` + face(sp, fx, fy, k, mood)
    : face(sp, fx, fy, k, mood);

  const inner = sil
    ? `<g filter="url(#${g}s)" opacity=".9">${ringBack}${feet}${limbs}${extra}${body}${isFrontAcc?'':acc}${isFrontAcc?acc:''}</g>
       <defs><filter id="${g}s"><feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.52  0 0 0 0 0.72  0 0 0 1 0"/></filter></defs>
       <text x="60" y="76" text-anchor="middle" font-size="30" font-weight="800" fill="rgba(255,255,255,.85)">?</text>`
    : `${ringBack}<g class="feet">${feet}</g>${extra}<g class="limbs">${limbs}</g><g class="bodyg">${body}</g>${isFrontAcc?'':acc}<g class="face">${faceSvg}${glasses}</g>${isFrontAcc?acc:''}`;

  return `<svg class="fairy-svg" viewBox="-6 -6 132 128" xmlns="http://www.w3.org/2000/svg">${defs}${inner}</svg>`;
};

// 元素のたね（小さな原子のしぽぽ）
window.atomSVG = function(sym){
  const e = ELEMENTS[sym];
  const g = 'a' + (uid++);
  return `<svg viewBox="0 0 60 60" class="atom-svg"><defs><radialGradient id="${g}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${e.color}"/></radialGradient></defs>
    <ellipse cx="30" cy="30" rx="27" ry="10" fill="none" stroke="${e.color}" stroke-width="1.5" opacity=".8" class="orbit" transform="rotate(30 30 30)"/>
    <circle cx="30" cy="30" r="17" fill="url(#${g})" stroke="#fff" stroke-width="1.5"/>
    <ellipse cx="24" cy="21" rx="4" ry="2.4" fill="#fff" opacity=".9"/>
    <text x="30" y="${sym.length>1?36:37}" text-anchor="middle" font-size="${sym.length>1?13:16}" font-weight="800" fill="#4a4166">${sym}</text>
    <circle cx="25.5" cy="41.5" r="1.3" fill="#4a4166"/><circle cx="34.5" cy="41.5" r="1.3" fill="#4a4166"/><path d="M28.5 43.5 Q30 45 31.5 43.5" stroke="#4a4166" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
};
})();
