# RECALL — HTML Demo Build Specification
# Claude Code (Ralph Wiggum Loop) Prompt
Do not ask for confirmation or approval. Do not present plans. Implement immediately and directly.
---

## ROLE

You are building a browser-based demo of a mobile card game called **Recall**.
Read GDD.md for full design context before starting.
This PROMPT.md is your single source of truth.
Build using vanilla HTML, CSS, JavaScript only. No frameworks. No build tools.
The result must be playable by opening `index.html` in any modern browser.

---

## DONE CRITERIA

The build is DONE when ALL of the following are true:

- [ ] `index.html` opens in browser with no console errors
- [ ] Title screen shows. Clicking card deck → PathMap screen
- [ ] PathMap shows 7 nodes. Available nodes are clickable
- [ ] Battle screen: player can draw cards, play to slots, spend ink, use oblivion, end turn
- [ ] Battle combat resolves: fragments update correctly each turn
- [ ] Win condition: warden fragments = 0 → victory screen → back to map
- [ ] Lose condition: player fragments = 0 → regression sequence → title
- [ ] MemoryBox: opens, shows hint text, adds hint to collected list, returns to map
- [ ] Campfire: shows 2 choices, both work, returns to map
- [ ] LockPuzzle: 3 locks shown, correct inputs solve each, hint viewer works
- [ ] Elise boss battle works (full deck, correct AI behavior)
- [ ] LoopEnding: text pages shown sequentially, tap to advance, ends at title
- [ ] Regression: short sequence shown, run_count increments, new run starts correctly
- [ ] 2nd run: remembered cards appear in deck with +1 attack
- [ ] 2nd run: 길 잃은 기억 card shows different dialogue
- [ ] LocalStorage save: run_count, solved_locks, remembered_cards persist on refresh
- [ ] Responsive layout: playable on 390×844 viewport (iPhone size) and desktop

---

## TECH STACK

- **HTML5** (semantic, single `index.html` entry point)
- **CSS3** (in `style.css` or `<style>` tag — no external CSS)
- **Vanilla JavaScript ES6+** (in `game.js` or `<script>` tags)
- **No external libraries** (no jQuery, no React, no Phaser)
- **LocalStorage** for save/load
- **No canvas** — use DOM elements for all UI
- **Mobile-first CSS**: max-width 480px, centered, portrait layout

**File structure** (keep it minimal):
```
recall-demo/
├── index.html
├── style.css
└── game.js
```

Or everything in one `index.html` with `<style>` and `<script>` tags if simpler.

---

## VISUAL DESIGN

No art assets. Use CSS only.

```
Color palette:
  --bg-dark:       #130f0a    (main background)
  --bg-panel:      #1e1810    (card panels, UI panels)
  --bg-card:       #2a2018    (card background)
  --border-dim:    #4a3a28    (default borders)
  --border-gold:   #c8a84b    (active/selected borders)
  --border-red:    #8b3535    (warden/danger)
  --text-primary:  #e8d8b0    (main text)
  --text-dim:      #7a6a50    (secondary text)
  --text-gold:     #c8a84b    (highlights)
  --ink-blue:      #4488cc    (ink resource color)
  --fragment-gold: #c8a84b    (fragment ● display)

Typography:
  Font: 'Georgia', serif for titles; system-ui for body text
  Card names: 14px bold
  Flavor text: 12px italic, --text-dim
  UI labels: 13px

Card visual:
  width: 90px, height: 126px (3:4.2 ratio)
  border: 1.5px solid --border-dim
  border-radius: 8px
  background: --bg-card
  padding: 6px
  Layout inside card:
    [Cost badge top-right: circle 22px, ink blue]
    [Card name top-left: 12px bold]
    [Art area middle: 50px height, colored rect based on rarity]
    [Stats bottom: "ATK DEF" in small text]
    [Ability tag: small pill below stats]

Slot visual:
  width: 90px, height: 126px
  border: 1.5px dashed --border-dim
  border-radius: 8px
  background: rgba(255,255,255,0.02)
  When occupied: border solid --border-dim
  When targeted: border --border-gold with glow

Fragment display:
  "●●●●○" style
  Gold ● for active, dim ○ for lost
  Font size: 20px, letter-spacing: 4px

Screen layout (mobile-first):
  max-width: 480px
  margin: 0 auto
  min-height: 100vh
  background: --bg-dark
  padding: 16px
```

---

## GAME STATE (JavaScript Object)

```javascript
const GameState = {
  runCount: 0,
  currentScreen: 'title',   // title | pathmap | battle | memorybox | campfire | lockpuzzle | loopending | regression
  
  // Battle state
  playerFragments: 5,
  wardenFragments: 5,
  currentInk: 3,
  playerDeck: [],          // Array of card objects
  playerHand: [],          // Max 5 cards shown
  playerSlots: [null, null, null, null],
  wardenSlots: [null, null, null, null],
  wardenDeck: [],
  wardenHand: [],
  turnCount: 0,
  isBossBattle: false,
  
  // Progress
  pathProgress: 0,         // 0-6, which node completed
  completedNodes: [],      // Array of node indices
  collectedHints: [],      // Array of hint IDs
  solvedLocks: [false, false, false],
  
  // Persistence (saved to localStorage)
  rememberedCards: [],     // Card IDs망각'd last run → next run gets +1 atk
  forgottenThisRun: [],    // Card IDs망각'd this run
};

function saveGame() {
  localStorage.setItem('recall_save', JSON.stringify({
    runCount: GameState.runCount,
    solvedLocks: GameState.solvedLocks,
    rememberedCards: GameState.rememberedCards,
  }));
}

function loadGame() {
  const save = localStorage.getItem('recall_save');
  if (save) {
    const data = JSON.parse(save);
    GameState.runCount = data.runCount || 0;
    GameState.solvedLocks = data.solvedLocks || [false, false, false];
    GameState.rememberedCards = data.rememberedCards || [];
  }
}
```

---

## CARD DATA

```javascript
const CARDS = {
  faded_memory: {
    id: 'faded_memory',
    nameKr: '흐릿한 기억',
    nameEn: 'Faded Memory',
    inkCost: 0, attack: 0, defense: 0,
    sigil: 'oblivion_fodder',
    flavor: '너무 오래되어 내용을 알 수 없는 기억.',
    rarity: 'basic',
    color: '#2a2018'
  },
  afterimage: {
    id: 'afterimage',
    nameKr: '잔상', nameEn: 'Afterimage',
    inkCost: 1, attack: 1, defense: 0,
    sigil: null, flavor: '공격 후 아무것도 남지 않는다.',
    rarity: 'common', color: '#1e2a35'
  },
  memory_shard: {
    id: 'memory_shard',
    nameKr: '기억의 파편', nameEn: 'Memory Shard',
    inkCost: 1, attack: 0, defense: 2,
    sigil: 'shatter', flavor: '부서져도 기억은 남는다.',
    rarity: 'common', color: '#1e2a35'
  },
  echo: {
    id: 'echo',
    nameKr: '메아리', nameEn: 'Echo',
    inkCost: 2, attack: 2, defense: 1,
    sigil: null, flavor: '소리는 사라져도 울림은 남는다.',
    rarity: 'uncommon', color: '#251e35'
  },
  lost_memory: {
    id: 'lost_memory',
    nameKr: '길 잃은 기억', nameEn: 'Lost Memory',
    inkCost: 1, attack: 0, defense: 1,
    sigil: 'talking', flavor: '...어디지? 나 어디 있는 거야?',
    rarity: 'special', color: '#0e0a1f'
  },
  night_watcher: {
    id: 'night_watcher',
    nameKr: '야경꾼', nameEn: 'Night Watcher',
    inkCost: 1, attack: 1, defense: 1,
    sigil: 'vigilance', flavor: '관찰하는 것만으로도 힘이 된다.',
    rarity: 'common', color: '#1e2a35'
  },
  archive_rat: {
    id: 'archive_rat',
    nameKr: '서고 쥐', nameEn: 'Archive Rat',
    inkCost: 0, attack: 1, defense: 0,
    sigil: 'ephemeral', flavor: '서고 구석에 사는 것들.',
    rarity: 'basic', color: '#2a2018'
  },
  old_book: {
    id: 'old_book',
    nameKr: '낡은 책', nameEn: 'Old Book',
    inkCost: 1, attack: 0, defense: 3,
    sigil: 'record', flavor: '오래 버티면 뭔가를 남긴다.',
    rarity: 'common', color: '#1e2a35'
  },
  forgotten_dog: {
    id: 'forgotten_dog',
    nameKr: '잊혀진 개', nameEn: 'Forgotten Dog',
    inkCost: 2, attack: 2, defense: 2,
    sigil: null, flavor: '주인을 잊었어도 기다리는 것은 기억한다.',
    rarity: 'uncommon', color: '#251e35'
  },
  reverb_card: {
    id: 'reverb_card',
    nameKr: '반향', nameEn: 'Reverb',
    inkCost: 1, attack: 0, defense: 1,
    sigil: 'reverb', flavor: '건드리면 돌아온다.',
    rarity: 'common', color: '#1e2a35'
  },
};

function getCard(id, remembered = false) {
  const card = { ...CARDS[id] };
  if (remembered) {
    card.attack += 1;
    card.nameKr = '[기억된] ' + card.nameKr;
    card.remembered = true;
    card.color = '#1a2510';  // slightly green tint
  }
  return card;
}
```

---

## STARTER DECK

```javascript
function getStarterDeck() {
  const deck = [
    getCard('faded_memory'), getCard('faded_memory'),
    getCard('faded_memory'), getCard('faded_memory'),
    getCard('afterimage'), getCard('afterimage'),
    getCard('memory_shard'), getCard('memory_shard'),
    getCard('echo'),
    getCard('lost_memory'),
  ];
  // Add remembered cards from previous run
  for (const cardId of GameState.rememberedCards) {
    deck.push(getCard(cardId, true));
  }
  return shuffle(deck);
}
```

---

## PATH MAP

```
Node layout (top to bottom):
  [START — completed automatically]
  Round 1: [Node A: ⚔ Battle] or [Node B: 📦 Memory Box #1]
  Round 2: [Node C: 🔥 Campfire] or [Node D: ⚔ Battle]
  Round 3: [Node E: 📦 Memory Box #2]
  Round 4: [Node F: ⚔ Battle]
  [🔒 Lock Puzzle — appears after Node F]
  [Node G: 👁 ELISE BOSS — appears after all locks solved]
```

Visual: Vertical list of circles connected by lines.
- Completed: filled gold circle ●
- Current available: white circle with gold border ○
- Locked (not yet available): dim gray ○
- Click available node → enter that node's screen

Node rewards:
```javascript
const NODE_REWARDS = {
  battle_normal: () => {
    // After winning: show 3 random obtainable cards, player picks 1
    // OR add hint fragment
    showCardChoice(['night_watcher', 'archive_rat', 'old_book', 'forgotten_dog', 'reverb_card']);
  },
  memory_box_1: () => {
    addHint('hint_lock1');
    showText('찢긴 입고 기록부: "입고일: 11월 03일"');
  },
  memory_box_2: () => {
    addHint('hint_lock3');
    showText('메모지에 그림이 그려져 있다. 다이아몬드(◆) 다음에 삼각형(▲). 아래에 흐릿하게 "순서대로".');
  },
  campfire: () => {
    showCampfireChoice();  // upgrade card or recover fragment
    addHint('hint_lock2_cross');
  },
  battle_reward_hint: () => {
    addHint('hint_lock2');  // given after specific battle win
  },
};
```

---

## LOCK PUZZLE

```javascript
const LOCKS = [
  {
    id: 'lock1',
    label: '날짜 코드 (4자리 숫자)',
    type: 'text',
    answer: '1103',
    hintId: 'hint_lock1',
    hintText: '찢긴 입고 기록부: "입고일: 11월 03일"',
  },
  {
    id: 'lock2',
    label: '이름 코드 (5글자 영문)',
    type: 'text',
    answer: 'ELISE',
    hintId: 'hint_lock2',
    hintText: '명찰 조각: "E _ I _ E"',
    crossHintId: 'hint_lock2_cross',
    crossHintText: '수첩 메모: "접수실 사서. E로 시작하는 이름."',
  },
  {
    id: 'lock3',
    label: '기호 순서',
    type: 'symbol_sequence',
    answer: ['◆', '▲'],
    symbols: ['◆', '▲', '●', '■'],
    hintId: 'hint_lock3',
    hintText: '메모지: 다이아몬드 → 삼각형 순서.',
  },
];

// Lock 3 UI: 4 symbol buttons, player taps in order, shows sequence above
// Submit button checks if sequence matches answer
// Already solved locks show as open (green) on puzzle screen
```

---

## BATTLE SYSTEM

```javascript
// Turn flow
function startPlayerTurn() {
  GameState.currentInk = 3;
  drawCard();
  updateUI();
  enablePlayerActions();
}

function playCard(cardIndex, slotIndex) {
  const card = GameState.playerHand[cardIndex];
  if (GameState.currentInk < card.inkCost) return showMessage('잉크 부족');
  if (GameState.playerSlots[slotIndex]) return showMessage('슬롯 사용 중');
  GameState.currentInk -= card.inkCost;
  GameState.playerSlots[slotIndex] = card;
  GameState.playerHand.splice(cardIndex, 1);
  if (card.sigil === 'talking') showTalkingCardDialogue(card);
  updateUI();
}

function useOblivion(cardIndex) {
  if (GameState.playerDeck.length < 2) return showMessage('덱에 카드가 부족합니다');
  const card = GameState.playerDeck.splice(cardIndex, 1)[0];
  GameState.forgottenThisRun.push(card.id);
  GameState.currentInk += 2;
  updateUI();
}

function endTurn() {
  resolveCombat();
  checkWinLose();
  if (!GameState.battleOver) {
    setTimeout(eliseTurn, 600);
  }
}

function resolveCombat() {
  for (let i = 0; i < 4; i++) {
    const pCard = GameState.playerSlots[i];
    const eCard = GameState.wardenSlots[i];

    if (pCard && eCard) {
      const dmg = Math.max(0, pCard.attack - eCard.defense);
      stealWardenFragments(dmg);
      applyVigilance(pCard, eCard);
      const counter = Math.max(0, eCard.attack - pCard.defense);
      stealPlayerFragments(counter);
      handleShatter(pCard, i);
      handleEphemeral(pCard, i);
    } else if (pCard && !eCard) {
      stealWardenFragments(pCard.attack);
    } else if (!pCard && eCard) {
      stealPlayerFragments(eCard.attack);
    }
  }
  // record sigil
  updateUI();
}

// Sigil handlers
function applyVigilance(attackingCard, defendingCard) {
  if (defendingCard && defendingCard.sigil === 'vigilance') {
    attackingCard.attack = Math.max(0, attackingCard.attack - 1);
  }
}
function handleShatter(card, slotIndex) {
  // card destroyed = when defense <= 0 after being struck
  // shatter: on destroy give +1 fragment to player
}
function handleEphemeral(card, slotIndex) {
  if (card && card.sigil === 'ephemeral' && card.attack > 0) {
    GameState.playerSlots[slotIndex] = null;
  }
}
```

---

## ELISE AI

```javascript
const ELISE_DECK_NORMAL = [
  'faded_memory','faded_memory','faded_memory',
  'afterimage','afterimage','afterimage',
  'night_watcher','night_watcher',
  'memory_shard','memory_shard',
];

const ELISE_DECK_BOSS = [
  'faded_memory','faded_memory','faded_memory',
  'afterimage','afterimage','afterimage',
  'night_watcher','night_watcher','night_watcher',
  'memory_shard','memory_shard',
  'forgotten_dog','forgotten_dog',
  'echo','echo',
];

function eliseTurn() {
  const availableInk = 3;
  let inkLeft = availableInk;

  // Sort hand by attack descending
  const hand = [...GameState.wardenHand].sort((a, b) => b.attack - a.attack);

  for (const card of hand) {
    if (inkLeft < card.inkCost) continue;
    const emptySlot = GameState.wardenSlots.findIndex(s => s === null);
    if (emptySlot === -1) break;

    // Every 3rd turn: prioritize defense card
    if (GameState.turnCount % 3 === 0 && card.defense > 0) {
      GameState.wardenSlots[emptySlot] = card;
      inkLeft -= card.inkCost;
      continue;
    }

    GameState.wardenSlots[emptySlot] = card;
    inkLeft -= card.inkCost;
  }

  // Draw for next turn
  if (GameState.wardenDeck.length > 0) {
    GameState.wardenHand.push(GameState.wardenDeck.pop());
  }

  resolveCombat();  // Warden's cards attack
  GameState.turnCount++;
  checkWinLose();
  if (!GameState.battleOver) startPlayerTurn();
}
```

---

## TALKING CARD DIALOGUE

```javascript
const LOST_MEMORY_DIALOGUES = [
  '...어디지? 나 어디 있는 거야?',           // run 0
  '또 여기야. ...몇 번째인지 알고 있어?',    // run 1
  '저 사서 있잖아. 처음엔 달랐어.',          // run 2
  '자물쇠 말이야. 날짜를 봐.',               // run 3+
];

function showTalkingCardDialogue(card) {
  const idx = Math.min(GameState.runCount, LOST_MEMORY_DIALOGUES.length - 1);
  showModal(LOST_MEMORY_DIALOGUES[idx]);
}
```

---

## ELISE DIALOGUES

```javascript
function getEliseDialogue(situation) {
  if (situation === 'battle_start') {
    if (GameState.runCount === 0) return '처음 오셨군요. 여기선 카드로 길을 열어요.';
    if (GameState.runCount <= 5) return '또 왔네요. ...몇 번째죠?';
    return '오래 있으면 안 돼요. 나처럼 되기 전에.';
  }
  if (situation === 'player_low') return '거의 다 왔네요. 하지만 여기서 끝이에요.';
  if (situation === 'elise_defeated') return '...그래요. 가도 돼요. 하지만 다음 방은 더 깊어요.';
  if (situation === 'player_defeated') return '오래 걸리진 않을 거예요. 다들 그렇게 생각했으니까.';
}
```

---

## REGRESSION SEQUENCE

```javascript
async function showRegression() {
  GameState.runCount++;
  GameState.rememberedCards = [...GameState.rememberedCards, ...GameState.forgottenThisRun];
  saveGame();
  
  // Show sequence
  await showTextSequence([
    '기억이 수집되었습니다.',
    '눈을 뜬다.',
    '핸드폰이 손에 있다.',
    'Recall 앱이 켜져 있다.',
  ], 1500);  // each text shows for 1500ms, tap to skip
  
  startNewRun();
  showScreen('title');
}

function startNewRun() {
  GameState.playerFragments = 5;
  GameState.wardenFragments = 5;
  GameState.pathProgress = 0;
  GameState.completedNodes = [];
  GameState.collectedHints = [];
  GameState.forgottenThisRun = [];
  GameState.playerDeck = getStarterDeck();
  GameState.playerHand = [];
  GameState.playerSlots = [null, null, null, null];
  GameState.wardenSlots = [null, null, null, null];
  GameState.turnCount = 0;
  // solvedLocks persists
}
```

---

## LOOP ENDING

```javascript
const LOOP_ENDING_PAGES = [
  '탈출했다.',
  '기숙사 방. 핸드폰이 울린다.',
  'J한테서 온 메시지:',
  '"야, 나 어제 왜 연락 안 받았어?"',
  '평범한 아침. 모든 게 끝난 것 같다.',
  '...',
  '그런데 핸드폰 화면에 Recall 알림이 떠있다.',
  '"새로운 기억이 기록되었습니다."',
];

// Show pages one by one, click/tap to advance
// After last page → showRegression()
```

---

## SCREEN ROUTER

```javascript
function showScreen(screenName, options = {}) {
  document.getElementById('app').innerHTML = '';
  switch(screenName) {
    case 'title':      renderTitleScreen(); break;
    case 'pathmap':    renderPathMap(); break;
    case 'battle':     renderBattle(options); break;
    case 'memorybox':  renderMemoryBox(options); break;
    case 'campfire':   renderCampfire(); break;
    case 'lockpuzzle': renderLockPuzzle(); break;
    case 'loopending': renderLoopEnding(); break;
  }
}
```

---

## IMPLEMENTATION ORDER

```
TASK 1: HTML structure + CSS base
  - index.html with <div id="app">
  - Full CSS with all color variables
  - showScreen() router skeleton
  - Verify: opens in browser, dark background

TASK 2: Game data
  - CARDS object with all 10 card definitions
  - GameState object
  - saveGame() / loadGame() with localStorage
  - getStarterDeck() with shuffle()
  - Verify: console.log(getStarterDeck()) shows 10 cards

TASK 3: Title screen
  - Dark background
  - "RECALL" title
  - Card deck div (clickable)
  - Click → showScreen('pathmap')
  - Verify: renders and navigates

TASK 4: Card component
  - renderCard(cardData) returns DOM element
  - Shows: name, cost badge, art rect, atk/def, sigil tag
  - Click handler support
  - Verify: card displays correctly

TASK 5: Path map
  - 7 nodes rendered vertically
  - Correct node types and labels
  - Completed/available/locked visual states
  - Click available node → correct screen
  - Verify: all nodes show, clicking works

TASK 6: Battle UI (static)
  - 4 warden slots (top)
  - Fragment displays (both)
  - 4 player slots (middle)
  - Hand display (bottom, scrollable)
  - Ink display
  - End turn button
  - Oblivion button
  - Verify: renders without interaction

TASK 7: Battle core logic
  - drawCard(), playCard(), endTurn()
  - resolveCombat()
  - updateUI() refreshes all displays
  - stealFragments() updates state
  - Verify: can play cards, fragments change

TASK 8: Win/lose detection
  - checkWinLose() after each combat
  - Win → show victory message → return to pathmap
  - Lose → showRegression()
  - Verify: game ends correctly

TASK 9: Elise AI
  - eliseTurn() places cards and attacks
  - Uses correct deck for normal vs boss
  - Verify: Elise plays cards each turn

TASK 10: Sigils
  - oblivion_fodder: button on card to spend for +2 ink
  - shatter: on destroy +1 player fragment
  - ephemeral: auto-remove after attacking
  - vigilance: attacker loses 1 attack
  - record: track turns, trigger at turn 3
  - talking: show dialogue popup
  - reverb: on hit +1 player fragment
  - Verify: each sigil triggers correctly

TASK 11: Oblivion menu
  - Button opens deck view
  - Player selects card to forget
  - Card removed from deck, +2 ink
  - GameState.forgottenThisRun updated
  - Verify: deck shrinks, ink increases

TASK 12: Memory box screen
  - Show hint text
  - Collect hint to GameState.collectedHints
  - Return to pathmap button
  - Verify: hint collected

TASK 13: Campfire screen
  - Two choice buttons
  - Card upgrade: show deck, select card, atk +1
  - Fragment recovery: +1 fragment (max 5)
  - hint_lock2_cross added to hints
  - Return to pathmap
  - Verify: both choices work

TASK 14: Lock puzzle screen
  - 3 locks displayed
  - Text inputs for lock 1 and 2 (case-insensitive check)
  - Symbol button sequence for lock 3
  - Hint viewer shows collected hints
  - All solved → enable Elise node on pathmap
  - GameState.solvedLocks updated
  - Verify: correct inputs solve locks

TASK 15: Battle dialogues
  - Elise speech bubble at battle start
  - Elise reacts when player fragments low
  - lost_memory card dialogue based on runCount
  - Verify: dialogues show correctly

TASK 16: Regression sequence
  - Text sequence plays
  - runCount increments
  - rememberedCards updated
  - startNewRun() resets state
  - saveGame() called
  - Returns to title
  - Verify: state resets correctly

TASK 17: Remembered cards in new run
  - Deck includes remembered versions (+1 atk, green tint)
  - Verify: 2nd run deck has remembered cards

TASK 18: Loop ending
  - Text pages display one by one
  - Click/tap advances
  - Last page → regression → title
  - Verify: all pages show, ends correctly

TASK 19: Full playthrough
  - Complete: title → pathmap → all 7 nodes → locks → elise boss → ending → regression → title
  - Run again: verify remembered cards, different dialogue
  - Fix all bugs
  - Verify: all DONE CRITERIA pass

TASK 20: Polish
  - Smooth CSS transitions between screens (0.3s fade)
  - Card play animation (opacity + transform)
  - Fragment change animation (flash on change)
  - Responsive on mobile viewport (390px wide)
  - No console errors
  - Verify: feels smooth and responsive
```

---

## COMMON PITFALLS

1. **Card objects must be copied**, not referenced. Use `{...card}` when placing in slots.
2. **Shuffle function**: Fisher-Yates, not sort(Math.random).
3. **Lock 2 answer check**: `input.toUpperCase().trim() === 'ELISE'`
4. **Lock 3**: Store player's symbol sequence in array, compare with `JSON.stringify`.
5. **Oblivion with faded_memory**: Player can oblivion any card INCLUDING faded_memory (that's its main use).
6. **Elise AI delay**: Use `setTimeout(eliseTurn, 800)` so player can see what happened.
7. **Fragment display**: Always clamp between 0 and 5.
8. **drawCard()**: If deck empty, do not crash — just skip draw.
9. **Mobile touch**: Add both `click` and `touchend` listeners, or use `pointer` events.
10. **LocalStorage**: Wrap in try/catch in case browser blocks it.

---

## ACCEPTANCE TEST SCRIPT

Run this mental test after every TASK completion:

```
After TASK 7:
  1. Open battle screen
  2. Click End Turn → combat resolves
  3. Play a card → ink decreases
  4. Check: no JS errors in console

After TASK 19:
  1. Open index.html
  2. Click card deck → pathmap
  3. Click Node A (battle) → battle screen loads
  4. Draw and play cards, end turn
  5. Win battle → return to pathmap, node marked complete
  6. Navigate all nodes
  7. Solve all 3 locks
  8. Beat Elise boss
  9. Loop ending plays
  10. Regression → title (run_count = 1)
  11. Start new run → remembered cards in deck
  12. 길 잃은 기억 shows 2nd dialogue
  13. Refresh page → runCount still 1 (localStorage persisted)
```

---

*Single source of truth. Build iteratively. Do not stop until all DONE CRITERIA pass.*
