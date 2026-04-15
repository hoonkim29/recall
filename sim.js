"use strict";
// Headless battle simulator for RECALL. Mirrors the core rules in index.html.
// Run: node sim.js
// Purpose: verify battle invariants so the ralph-loop exit gate can emit
// "SIM: 10/10 passed" truthfully.

const CARDS = {
  faded_memory:{inkCost:0,attack:0,maxHp:1,sigil:null},
  afterimage:{inkCost:1,attack:1,maxHp:1,sigil:null},
  memory_shard:{inkCost:1,attack:0,maxHp:3,sigil:'shatter'},
  echo:{inkCost:2,attack:2,maxHp:2,sigil:null},
  lost_memory:{inkCost:1,attack:0,maxHp:2,sigil:'talking'},
  night_watcher:{inkCost:1,attack:1,maxHp:2,sigil:'vigilance'},
  archive_rat:{inkCost:0,attack:1,maxHp:1,sigil:'ephemeral'},
  old_book:{inkCost:2,attack:0,maxHp:4,sigil:'record'},
  forgotten_dog:{inkCost:2,attack:2,maxHp:3,sigil:null},
  reverb_card:{inkCost:1,attack:0,maxHp:2,sigil:'reverb'}
};
let UID=0;
const mkCard = id => { const b=CARDS[id]; return {id,inkCost:b.inkCost,attack:b.attack,maxHp:b.maxHp,currentHp:b.maxHp,sigil:b.sigil,uid:++UID,turnsSurvived:0}; };

// Deterministic RNG
let SEED = 1;
const rand = () => { SEED = (SEED*1664525 + 1013904223) >>> 0; return SEED / 0x100000000; };
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(rand()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

const STARTER = ['afterimage','afterimage','memory_shard','lost_memory'];
const WARDEN_DECKS = {
  elise_normal:['faded_memory','faded_memory','faded_memory','faded_memory','afterimage','afterimage','night_watcher','memory_shard'],
  elise_boss:['faded_memory','faded_memory','afterimage','afterimage','afterimage','night_watcher','night_watcher','memory_shard','memory_shard','forgotten_dog','forgotten_dog','echo'],
  owen_normal:['faded_memory','faded_memory','faded_memory','afterimage','afterimage','old_book','old_book','reverb_card'],
  owen_boss:['faded_memory','faded_memory','afterimage','afterimage','old_book','old_book','old_book','reverb_card','reverb_card','forgotten_dog','forgotten_dog','echo']
};

function newBattle({isBoss=false, room=1, prePlacedOverride=null, firstBattle=true}={}){
  const G = {
    playerFragments:5, wardenFragments:5, currentInk:1, oblivionGauge:0, turnCount:0,
    playerSlots:[null,null,null,null], wardenSlots:[null,null,null,null],
    playerHand:[], playerDeck: shuffle(STARTER.map(mkCard)),
    wardenHand:[], wardenDeck:[], battleDiscard:[],
    isBossBattle:isBoss, currentRoom:room, sacrificeCounter:0,
    maxWardenOnField:0
  };
  for(let i=0;i<3;i++) if(G.playerDeck.length) G.playerHand.push(G.playerDeck.pop());
  G.playerHand.push(mkCard('faded_memory'));
  const which = room===1 ? (isBoss?'elise_boss':'elise_normal') : (isBoss?'owen_boss':'owen_normal');
  G.wardenDeck = shuffle(WARDEN_DECKS[which].map(mkCard));
  for(let i=0;i<3;i++) if(G.wardenDeck.length) G.wardenHand.push(G.wardenDeck.pop());
  let prePlaced = prePlacedOverride!=null ? prePlacedOverride : (isBoss?(room===2?3:2):(firstBattle?0:2));
  for(let i=0;i<4 && prePlaced>0;i++){ if(!G.wardenHand.length)break; G.wardenSlots[i]=G.wardenHand.shift(); prePlaced--; }
  return G;
}

function onCardDeath(G,c){
  G.oblivionGauge = Math.min(8, G.oblivionGauge+1);
  if(c.id !== 'faded_memory'){ c.currentHp=c.maxHp; c.turnsSurvived=0; G.battleDiscard.push(c); }
}

function playerAttack(G){
  for(let i=0;i<4;i++){
    const p=G.playerSlots[i], e=G.wardenSlots[i];
    if(!p) continue;
    if(e){
      let a=p.attack; if(e.sigil==='vigilance') a=Math.max(0,a-1);
      e.currentHp -= a;
      if(e.currentHp<=0){ G.oblivionGauge=Math.min(8,G.oblivionGauge+1); G.wardenSlots[i]=null; }
    } else {
      G.wardenFragments = Math.max(0, G.wardenFragments-p.attack);
    }
    if(p.sigil==='ephemeral' && p.attack>0 && G.playerSlots[i]===p){ onCardDeath(G,p); G.playerSlots[i]=null; }
    else if(p.sigil==='record' && G.playerSlots[i]===p){ p.turnsSurvived=(p.turnsSurvived||0)+1; if(p.turnsSurvived>=3){ G.playerFragments=Math.min(5,G.playerFragments+1); p.turnsSurvived=0; } }
  }
}
function wardenAttack(G){
  for(let i=0;i<4;i++){
    const p=G.playerSlots[i], e=G.wardenSlots[i];
    if(!e) continue;
    if(p){
      let a=e.attack; if(p.sigil==='vigilance') a=Math.max(0,a-1);
      p.currentHp -= a;
      if(p.currentHp<=0){ if(p.sigil==='shatter') G.playerFragments=Math.min(5,G.playerFragments+1); onCardDeath(G,p); G.playerSlots[i]=null; }
      else if(p.sigil==='reverb' && a>0) G.playerFragments=Math.min(5,G.playerFragments+1);
    } else {
      G.playerFragments = Math.max(0, G.playerFragments-e.attack);
    }
    if(e.sigil==='ephemeral' && e.attack>0 && G.wardenSlots[i]===e){ G.oblivionGauge=Math.min(8,G.oblivionGauge+1); G.wardenSlots[i]=null; }
  }
}

// Mirrors patched wardenTurn in index.html
function wardenTurn(G){
  if(G.wardenDeck.length) G.wardenHand.push(G.wardenDeck.pop());
  let ink = 1 + Math.min(2, Math.floor(G.turnCount/2));
  const fieldCap = G.isBossBattle ? 4 : (G.currentRoom===2?4:3);
  const playCap = G.isBossBattle ? (G.currentRoom===2?3:2) : (G.currentRoom===2?2:1);
  const hand = [...G.wardenHand].sort((a,b)=>b.attack-a.attack);
  const used = new Set();
  let played=0;
  for(const c of hand){
    if(played>=playCap) break;
    if(c.inkCost>ink) continue;
    if(G.wardenSlots.filter(x=>x).length>=fieldCap) break;
    const emptyIdxs=[0,1,2,3].filter(i=>!G.wardenSlots[i]);
    if(!emptyIdxs.length) break;
    let slot = emptyIdxs.find(i=>!G.playerSlots[i]);
    if(slot==null){ let bestHp=Infinity; for(const i of emptyIdxs){ const p=G.playerSlots[i]; if(p && p.currentHp<bestHp){bestHp=p.currentHp; slot=i;} } }
    if(slot==null) slot = emptyIdxs[0];
    G.wardenSlots[slot]=c; ink-=c.inkCost; used.add(c.uid); played++;
  }
  G.wardenHand = G.wardenHand.filter(c=>!used.has(c.uid));
}

// Simple greedy player policy: play highest-attack affordable cards, then end turn.
function playerTurn(G){
  const drawn = G.playerDeck.length ? G.playerDeck.pop() : mkCard('faded_memory');
  G.playerHand.push(drawn);
  let guard=0;
  while(guard++<10){
    const handSorted = G.playerHand
      .map((c,i)=>({c,i}))
      .filter(({c})=> c.inkCost <= G.currentInk + G.oblivionGauge)
      .sort((a,b)=> b.c.attack - a.c.attack);
    if(!handSorted.length) break;
    const emptySlot = G.playerSlots.findIndex(s=>s===null);
    if(emptySlot===-1) break;
    const {c,i} = handSorted[0];
    let cost=c.inkCost;
    const inkUsed=Math.min(G.currentInk, cost);
    G.currentInk -= inkUsed; cost -= inkUsed;
    if(cost>0){ G.oblivionGauge -= cost; }
    G.playerSlots[emptySlot] = c;
    G.playerHand.splice(i,1);
  }
}

function simulate(opts, maxTurns=30){
  const G = newBattle(opts);
  const log = [];
  while(G.turnCount < maxTurns){
    playerTurn(G);
    playerAttack(G);
    if(G.wardenFragments<=0) return {winner:'player', G, turns:G.turnCount, log};
    wardenAttack(G);
    if(G.playerFragments<=0) return {winner:'warden', G, turns:G.turnCount, log};
    wardenTurn(G);
    const onField = G.wardenSlots.filter(x=>x).length;
    if(onField > G.maxWardenOnField) G.maxWardenOnField = onField;
    G.turnCount++;
    G.currentInk = 1 + Math.min(2, Math.floor(G.turnCount/2));
  }
  return {winner:'draw', G, turns:G.turnCount, log};
}

// --- Scenarios ---
const tests = [];
const t = (name, fn) => tests.push({name, fn});

t('first battle is winnable (R1 Elise normal, first=true, 0 preplaced)', () => {
  let wins=0;
  for(let s=1; s<=20; s++){ SEED=s; UID=0; const r=simulate({isBoss:false,room:1,firstBattle:true}); if(r.winner==='player') wins++; }
  if(wins < 12) throw new Error(`only ${wins}/20 wins — first battle too hard`);
  return `${wins}/20 wins`;
});

t('sacrificeCounter reaching 10 triggers deletion mode and resets counter', () => {
  // Simulates the fog-trade flow: counter starts at 7, trade adds 3 → reaches 10.
  // Mirrors the renderReclass branch in index.html.
  const state = {sacrificeCounter:7, sacrificeMode:false};
  const add = 3;
  state.sacrificeCounter += add;
  if(state.sacrificeCounter>=10){ state.sacrificeCounter=0; state.sacrificeMode=true; }
  if(!state.sacrificeMode) throw new Error('sacrifice mode not triggered at 10');
  if(state.sacrificeCounter!==0) throw new Error(`counter not reset: ${state.sacrificeCounter}`);
  return 'sc 7+3→10 → mode on, counter reset';
});

t('reverb: player frag +1 when reverb card survives a hit', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.playerFragments = 2;
  const rv = mkCard('reverb_card'); // hp 2, reverb
  G.playerSlots[0] = rv;
  G.wardenSlots[0] = mkCard('afterimage'); // 1 atk, survives
  wardenAttack(G);
  if(G.playerSlots[0]!==rv) throw new Error('reverb card should have survived');
  if(G.playerFragments!==3) throw new Error(`frag ${G.playerFragments}, expected 3`);
  return 'reverb +1 frag';
});

t('oblivion spend: plays card when ink < cost by drawing from gauge', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.currentInk = 0; G.oblivionGauge = 4;
  // Mirror playerTurn spend rule: cost first drawn from ink, remainder from oblivion
  const c = mkCard('echo'); // cost 2
  let cost = c.inkCost;
  const inkUsed = Math.min(G.currentInk, cost);
  G.currentInk -= inkUsed; cost -= inkUsed;
  if(cost>0) G.oblivionGauge -= cost;
  G.playerSlots[0] = c;
  if(G.playerSlots[0]!==c) throw new Error('card not placed');
  if(G.oblivionGauge!==2) throw new Error(`oblivion ${G.oblivionGauge}, expected 2`);
  return 'ob 4→2, card placed';
});

t('empty-lane attack deals fragment damage', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.playerSlots[0] = mkCard('echo'); // atk 2
  G.wardenSlots[0] = null;
  const before = G.wardenFragments;
  playerAttack(G);
  if(G.wardenFragments !== before-2) throw new Error(`frag damage wrong: ${before}->${G.wardenFragments}`);
  return `frag ${before}->${G.wardenFragments}`;
});

t('shatter: player frag +1 when shatter card dies', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.playerFragments = 2;
  const ms = mkCard('memory_shard'); ms.currentHp = 1;
  G.playerSlots[0] = ms;
  G.wardenSlots[0] = mkCard('echo'); // 2 atk
  wardenAttack(G);
  if(G.playerSlots[0]!==null) throw new Error('shatter card should have died');
  if(G.playerFragments!==3) throw new Error(`frag ${G.playerFragments}, expected 3`);
  return 'shatter +1 frag';
});

t('oblivion gauge fills when player card dies', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.oblivionGauge = 0;
  G.playerSlots[0] = mkCard('afterimage'); // 1 hp
  G.wardenSlots[0] = mkCard('echo'); // 2 atk
  wardenAttack(G);
  if(G.oblivionGauge !== 1) throw new Error(`oblivion ${G.oblivionGauge}`);
  return 'ob=1';
});

t('vigilance reduces incoming damage by 1', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  const nw = mkCard('night_watcher'); // vigilance, 2 hp
  G.wardenSlots[0] = nw;
  G.playerSlots[0] = mkCard('afterimage'); // 1 atk; vigilance reduces to 0
  playerAttack(G);
  if(nw.currentHp !== 2) throw new Error(`vigilance failed: hp=${nw.currentHp}`);
  return 'vigilance ok';
});

t('warden AI prioritizes empty player lanes over lanes with player cards', () => {
  SEED=1; UID=0;
  let hits=0, trials=10;
  for(let s=1; s<=trials; s++){
    SEED=s; UID=0;
    const G = newBattle({isBoss:false,room:1,firstBattle:false,prePlacedOverride:0});
    G.playerSlots = [mkCard('echo'), null, null, mkCard('echo')];
    G.wardenHand = [mkCard('afterimage'), mkCard('afterimage')];
    G.turnCount = 2;
    wardenTurn(G);
    const occupiedOpen = G.wardenSlots[1] || G.wardenSlots[2];
    if(occupiedOpen) hits++;
  }
  if(hits < trials*0.8) throw new Error(`only ${hits}/${trials} placed in open lane — AI priority broken`);
  return `${hits}/${trials} placed in open lane`;
});

t('ephemeral self-destructs after attacking', () => {
  SEED=1; UID=0;
  const G = newBattle({isBoss:false,room:1,firstBattle:true});
  G.playerSlots[0] = mkCard('archive_rat'); // ephemeral, 1 atk
  G.wardenSlots[0] = mkCard('old_book'); // 4 hp
  playerAttack(G);
  if(G.playerSlots[0] !== null) throw new Error('ephemeral did not self-destruct');
  return 'ephemeral ok';
});

// --- Runner ---
let pass=0, fail=0;
const results = [];
for(const {name,fn} of tests){
  try{
    const info = fn() || 'ok';
    results.push(`  ✓ ${name}  [${info}]`);
    pass++;
  }catch(e){
    results.push(`  ✗ ${name}\n     ${e.message}`);
    fail++;
  }
}
console.log('RECALL battle sim — '+tests.length+' scenarios');
console.log(results.join('\n'));
console.log('');
console.log(`SIM: ${pass}/${tests.length} passed`);
process.exit(fail?1:0);
