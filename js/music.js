// ===== ゆるいBGM（その場で作る音楽・音源ファイルなし） =====
(function(){
const TRACKS = {
  day:   { name:'ふわふわのひるね',     bpm:76, key:60, prog:[[0,4,7,11],[9,12,16,19],[5,9,12,16],[7,11,14,17]], mel:.55, bell:'sine',     bass:true,  drum:false, drop:false },
  night: { name:'ほしぞらのこもりうた', bpm:58, key:57, prog:[[0,3,7,10],[5,8,12,15],[3,7,10,14],[7,10,14,17]], mel:.35, bell:'sine',     bass:true,  drum:false, drop:false },
  bath:  { name:'ぷかぷかおふろ',       bpm:64, key:62, prog:[[0,4,7,11],[5,9,12,16],[0,4,7,11],[7,11,14,17]], mel:.3,  bell:'triangle', bass:false, drum:false, drop:true  },
  run:   { name:'ぽぽぽステップ',       bpm:112,key:62, prog:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],             mel:.7,  bell:'triangle', bass:true,  drum:true,  drop:false },
  lab:   { name:'ラボのひらめき',       bpm:84, key:64, prog:[[0,4,7,11],[2,5,9,12],[4,7,11,14],[5,9,12,16]], mel:.6,  bell:'sine',     bass:true,  drum:false, drop:false, arp:true },
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
let ac = null, master = null, rev = null, timer = 0, cur = null, step = 0, nextT = 0, melIdx = 3;

function setup(){
  if (ac) return ac;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
  master = ac.createGain(); master.gain.value = 0;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
  // やわらかい残響（ノイズから作るリバーブ）
  rev = ac.createConvolver();
  const len = ac.sampleRate * 2.6, buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  rev.buffer = buf;
  const wet = ac.createGain(); wet.gain.value = .45;
  rev.connect(wet).connect(lp);
  master.connect(lp); master.connect(rev);
  lp.connect(ac.destination);
  return ac;
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
function note(m, t, dur, type, vol, attack = .01, out = master){
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = hz(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05);
}
function bell(m, t, vol, type){ note(m, t, 1.6, type, vol, .005); note(m + 12, t, .6, 'sine', vol * .25, .005); }
function pad(chord, t, dur, key){
  chord.slice(0, 3).forEach((iv, i) => { [-6, 6].forEach(det => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'triangle'; o.frequency.value = hz(key - 12 + iv); o.detune.value = det;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(.022, t + dur * .35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + .1);
  }); });
}
function kick(t){ const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + .18); g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.0001, t + .22); o.connect(g).connect(master); o.start(t); o.stop(t + .25); }
function shaker(t){ const b = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length); const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'highpass'; f.frequency.value = 6000; g.gain.value = .05; s.connect(f).connect(g).connect(master); s.start(t); }
function drop(t){ const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900 + Math.random()*500, t); o.frequency.exponentialRampToValueAtTime(400, t + .12); g.gain.setValueAtTime(.06, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18); o.connect(g).connect(master); o.start(t); o.stop(t + .2); }

function schedule(){
  if (!cur) return;
  const tr = TRACKS[cur], spb = 60 / tr.bpm / 2; // 8分音符
  while (nextT < ac.currentTime + .4) {
    const bar = Math.floor(step / 8) % tr.prog.length, beat = step % 8, chord = tr.prog[bar];
    if (beat === 0) pad(chord, nextT, spb * 8.4, tr.key);
    if (tr.bass && (beat === 0 || (tr.drum && beat === 4))) note(tr.key - 24 + chord[0], nextT, spb * 3, 'sine', .07, .02);
    if (tr.drum) { if (beat % 4 === 0) kick(nextT); if (beat % 2 === 1) shaker(nextT); }
    if (tr.arp) { bell(tr.key + chord[beat % chord.length] + (beat > 3 ? 12 : 0), nextT, .025, 'sine'); }
    // メロディ：ペンタトニックをゆっくりおさんぽ
    if (Math.random() < tr.mel * (beat % 2 ? .45 : 1)) {
      melIdx = Math.max(0, Math.min(PENTA.length - 1, melIdx + Math.round((Math.random() - .5) * 3)));
      bell(tr.key + 12 + PENTA[melIdx], nextT, .045, tr.bell);
    }
    if (tr.drop && Math.random() < .18) drop(nextT + spb * Math.random());
    nextT += spb; step++;
  }
}
function fadeTo(v, sec = 1.2){ if (!master) return; const t = ac.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(v, t + sec); }
const vol = () => (S.settings.bgmVol ?? 60) / 100 * .9;

window.BGM = {
  TRACKS,
  current: () => cur,
  // 画面から自動で曲を選ぶ
  sceneTrack(screen){
    if (S.settings.bgmTrack && S.settings.bgmTrack !== 'auto') return S.settings.bgmTrack;
    if (screen === 'activity-bath') return 'bath';
    if (screen === 'activity-run') return 'run';
    if (screen === 'fusion') return 'lab';
    const w = document.getElementById('world').className;
    return w.includes('night') ? 'night' : 'day';
  },
  play(track){
    if (!S.settings.bgm) return;
    if (!setup()) return;
    if (ac.state === 'suspended') ac.resume();
    if (cur === track && timer) return;
    const start = () => { cur = track; step = 0; melIdx = 3; nextT = ac.currentTime + .1; clearInterval(timer); timer = setInterval(schedule, 120); fadeTo(vol(), 2); };
    if (timer) { fadeTo(0, .8); setTimeout(start, 850); } else start();
    updateBtn();
  },
  stop(){ if (!ac) return; fadeTo(0, .8); setTimeout(() => { clearInterval(timer); timer = 0; cur = null; }, 850); updateBtn(); },
  setVolume(){ if (timer) fadeTo(vol(), .3); },
  follow(screen){ if (S.settings.bgm) this.play(this.sceneTrack(screen)); },
};
function updateBtn(){ const b = document.getElementById('bgmBtn'); if (b) { b.textContent = S.settings.bgm ? '🎵' : '🔇'; b.classList.toggle('off', !S.settings.bgm); } }
window.toggleBGM = function(){
  S.settings.bgm = !S.settings.bgm; save();
  if (S.settings.bgm) { BGM.play(BGM.sceneTrack(document.querySelector('.screen.active')?.id)); toast('🎵 ' + TRACKS[BGM.sceneTrack(document.querySelector('.screen.active')?.id)].name); }
  else BGM.stop();
  updateBtn();
};
// ブラウザは「さいしょのタップ」まで音を出せないので、そのときに始める
const kick0 = () => { if (S.settings.bgm && !timer) BGM.follow(document.querySelector('.screen.active')?.id); removeEventListener('pointerdown', kick0); };
addEventListener('pointerdown', kick0);
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else if (S.settings.bgm) ac.resume(); });
setTimeout(updateBtn, 0);
})();
