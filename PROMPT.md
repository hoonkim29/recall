# RECALL — Full Demo Build Specification v7
# Claude Code (Ralph Wiggum Loop)

Read game_design_document_2.md for story, characters, and world context before starting.
Verify on the browser to visually inspect the game and simulate to improve battle experience.
Write progress.txt to record your progress, so you know where to pick up each loop.
Do not stop until every DONE CRITERIA checkbox passes.

## EXIT PROTOCOL (enforced by stop-hook — you CANNOT exit without this)

To end the loop you MUST output BOTH in your final assistant message:
1. A line exactly matching: `SIM: 10/10 passed` (output of the battle sim harness after all 10 scenarios pass)
2. The completion tag: `<promise>COMPLETE</promise>`

Trivial iterations (< 40 chars, or just "Continuing"/"Done"/"OK") are rejected and fed back. Keep working — pick a concrete DONE CRITERIA item, Edit/Write the file, then describe what changed.
---

## SCOPE

Complete playable demo: Room 1 and Room 2.
Full story, branching maps, auto combat, J message system, boss gimmicks,
death card system, items, interactive room exploration, 3D-feel CSS.

Deliverable: `index.html` (inline or companion CSS/JS).
Opens in any modern browser. No frameworks. No build tools.

---

## DONE CRITERIA

**Battle**
- [ ] Cards have HP. When HP ≤ 0, card dies and slot clears
- [ ] Lane-based: cards fight opposing lane card. Empty lane = direct fragment damage
- [ ] Player always goes first
- [ ] Turn order: Draw → Play cards → [턴 종료] → auto attack → Warden turn
- [ ] [턴 종료] triggers all player cards to auto-attack left to right (animated, 0.3s per slot)
- [ ] Warden draws, places cards, then auto-attacks opposing lanes
- [ ] Warden next-move preview shown near warden portrait as silhouettes (not in slots)
- [ ] First battle: warden starts with 0 pre-placed cards
- [ ] Later battles: warden starts with 0–3 pre-placed cards per node config

**Draw & Resources**
- [ ] Starting hand: 3 from main deck + 1 흐릿한 기억 = 4 cards
- [ ] Each turn: draw exactly 1 (tap main deck fan OR 흐릿한 기억 fan on right sidebar)
- [ ] 흐릿한 기억: inkCost 0, placed freely in slot
- [ ] Sacrificing 흐릿한 기억 from slot: +1 ink, +1 sacrifice counter
- [ ] 망각 게이지: separate resource. Any card death (either side) → +1. Spend instead of ink.
- [ ] Ink resets to 0 each turn. 망각 게이지 persists within a battle.

**Sacrifice Counter & J Messages**
- [ ] Counter shows as pips (●●●○○○○○○○) next to phone mini view
- [ ] Counter persists across all battles and rooms (localStorage)
- [ ] At 10: message deletion UI opens, player selects which message to delete, counter resets
- [ ] 재분류실 흐릿한 기억 trades also increment counter
- [ ] 🔒 messages untappable until condition met
- [ ] "오빠 사랑해" deletable only when last message remaining (confirmation dialog)

**Phone UI**
- [ ] Phone mini view always on right side (all screens except title/cutscenes)
- [ ] Mini view shows: battery %, sacrifice counter pips, last 2 message lines
- [ ] Tap mini view → fullscreen phone overlay (scrollable chat, full size text)
- [ ] Fullscreen: lock icons visible, delete mode when triggered
- [ ] Tap outside or X → closes fullscreen

**Battery / Two Lives**
- [ ] Battery starts at 100%
- [ ] First defeat: battery → 50%, screen flicker, warden dialogue, player frags restore to 3, field clears, battle resumes
- [ ] Second defeat: battery → 0%, screen-off animation, death card sequence, regression
- [ ] Battery persists across battles within a run

**Death Card**
- [ ] On 2nd defeat: "잔상 감지" sequence with blank card appearing
- [ ] Sigil from longest field-survived card (across entire run, faded_memory excluded)
- [ ] Attack from most-used card
- [ ] HP from last card to die
- [ ] Name from most recently deleted J message word (or "잔상")
- [ ] Added to next run's starting deck (max 3 death cards)

**Boss Gimmicks**
- [ ] Elise turn 5: random player card fades (atk→0, disappears next turn) + dialogue
- [ ] Elise turn 7: copies one player card to warden field + dialogue
- [ ] Owen every 5 turns: one more hand card name hidden (cumulative) + dialogue

**Items**
- [ ] 8 items implemented, acquirable at [유물함] nodes
- [ ] Item bar visible in battle (max 3 held), tap to use during play phase

**재분류실**
- [ ] Trade normal card → pick 1 of 3 normal cards
- [ ] Trade high-tier card → pick 1 of 3 high-tier cards or 1 item
- [ ] Trade 흐릿한 기억 ×3 → 1 normal card (counter +3, preview shown before confirm)
- [ ] Trade 흐릿한 기억 ×5 → 1 high-tier card (counter +5, preview shown before confirm)

**기억 조합 (조합실)**
- [ ] Combine 2 cards → 1 fused card (1st gen): max atk, max HP, both sigils (max 2)
- [ ] 1st gen fused card + normal card → 2nd gen fused: max atk, max HP, sigils unchanged
- [ ] 2nd gen cards cannot be fused further
- [ ] faded_memory and death cards cannot be fused
- [ ] Fused card name: "[A의 B]" for 1st gen, "[A의 B]의 C" for 2nd gen

**Path Maps**
- [ ] Room 1: 12+ nodes, SVG node graph (not a list)
- [ ] Room 2: 15+ nodes, SVG node graph

**Room Exploration**
- [ ] Interactive room screen between map sections (3D-feel CSS, no image assets)
- [ ] Clickable objects reveal hints, story text, items
- [ ] Lock puzzle accessible from room exploration

**Visual**
- [ ] Cards min 110×154px, text min 14px
- [ ] Google Fonts: Cinzel + Crimson Text
- [ ] Unique SVG art per card type
- [ ] Deck fans on right sidebar: warden (top, untappable), 흐릿한 기억 (middle), main deck (bottom)
- [ ] Card draw: flip animation → slides to hand
- [ ] Attack animations: 4 types per card type, sequential left-to-right
- [ ] Hit animations: shake + red flash, death = fade + rotate
- [ ] 3D-feel room exploration (CSS perspective, shadows)
- [ ] Smooth screen transitions

**Progression**
- [ ] Room 1 → Room 2 → regression → Run 2 all work
- [ ] Remembered cards (+1 atk) and death cards appear in Run 2
- [ ] Debug overlay: D key
- [ ] Simulation suite: T key on title, 10 tests, PASS/FAIL
- [ ] No console errors

---

## BATTLE SYSTEM

### Lane Combat

```
Warden slot 1 ↔ Player slot 1
Warden slot 2 ↔ Player slot 2
Warden slot 3 ↔ Player slot 3
Warden slot 4 ↔ Player slot 4

Both have card → cards fight each other (no fragment change unless card dies with excess)
Player card, warden lane empty → hits warden fragments
Warden card, player lane empty → hits player fragments
```

### Turn Flow

```
PHASE 1 — DRAW
  Right sidebar shows two deck fans (tappable):
    🌫 흐릿한 기억 fan (middle)
    📖 Main deck fan (bottom)
  Player taps one → card flips and slides to hand
  Both fans deactivate until next turn

PHASE 2 — PLAY
  Place cards from hand into empty slots (spend ink)
  Sacrifice 흐릿한 기억 from a slot → +1 ink, +1 sacrifice counter
  Spend 망각 게이지 instead of ink (tap 망각 gauge then card)
  Use items from item bar
  When ready: click [턴 종료]

PHASE 3 — AUTO ATTACK (player)
  All player cards attack automatically, slot 0 → 1 → 2 → 3
  Each attack animates before the next (0.3s gap)
  
  For each slot i:
    p = playerSlots[i]
    if p and p.attack > 0:
      e = wardenSlots[i]
      if e:
        eff_atk = p.attack
        if e.sigil == 'vigilance': eff_atk = max(0, eff_atk - 1)
        e.currentHp -= eff_atk
        if e.currentHp <= 0:
          e dies → wardenSlots[i] = null, oblivionGauge +1
      else:
        wardenFragments -= p.attack
      if p.sigil == 'ephemeral': p dies → playerSlots[i] = null, oblivionGauge +1
  
  CHECK WIN: wardenFragments <= 0 → battle won

PHASE 4 — WARDEN TURN
  Warden draws 1 card
  Warden AI places cards (2 ink budget)
  Warden cards auto-attack opposing lanes, slot 0 → 1 → 2 → 3:
    For each slot i:
      e = wardenSlots[i]
      if e and e.attack > 0:
        p = playerSlots[i]
        if p:
          eff_atk = e.attack
          if p.sigil == 'vigilance': eff_atk = max(0, eff_atk - 1)
          p.currentHp -= eff_atk
          if p.currentHp <= 0:
            if p.sigil == 'shatter': playerFragments = min(5, playerFragments + 1)
            p dies → battleDiscard, oblivionGauge +1, playerSlots[i] = null
          else:
            if p.sigil == 'reverb': playerFragments = min(5, playerFragments + 1)
        else:
          playerFragments -= e.attack
        if e.sigil == 'ephemeral': e dies → wardenSlots[i] = null, oblivionGauge +1
  
  Apply record sigil (turnsOnField +1, at 3 → playerFragments +1, reset)
  CHECK LOSE: playerFragments <= 0 → first or second defeat
  → NEXT TURN (Phase 1)
```

### 망각 게이지

```
Any card dies (either side) → oblivionGauge +1
Max: 8 per battle
Spend: oblivionGauge -= card.inkCost → play card without spending ink
UI: separate gauge display (purple ●●●○○○○○)
```

### Two Lives & Battery

```
Start: battery = 100%

First defeat (playerFragments = 0):
  Battery drains 100% → 50% (1.5s animation)
  Screen flicker effect
  Warden dialogue (see dialogues)
  playerFragments = 3
  All slots cleared (both sides)
  Player hand cleared
  Battle resumes from Phase 1

Second defeat:
  Battery drains 50% → 0% (1.5s)
  Scanlines appear, screen dims top→bottom (2s)
  Full black → death card creation sequence → regression
```

### Warden Next-Move Preview

Above warden portrait area: small semi-transparent card silhouettes.
Shows which cards warden plans to play next turn.
Not in slots — just floating near portrait as visual hint.
Disappear when warden actually plays them.

---

## CARD DATA

```
ID             | inkCost | atk | maxHp | sigil
faded_memory   |    0    |  0  |   1   | —
afterimage     |    1    |  1  |   1   | —
memory_shard   |    1    |  0  |   3   | shatter
echo           |    2    |  2  |   2   | —
lost_memory    |    1    |  0  |   2   | talking
night_watcher  |    1    |  1  |   2   | vigilance
archive_rat    |    0    |  1  |   1   | ephemeral
old_book       |    2    |  0  |   4   | record
forgotten_dog  |    2    |  2  |   3   | —
reverb_card    |    1    |  0  |   2   | reverb
```

### All Sigils

```
Basic:
shatter      죽을 때 플레이어 조각 +1
talking      배치 시 대사 출력 (runCount 기반)
vigilance    공격받을 때 공격자 공격력 -1
ephemeral    공격 후 자동 사망
record       3턴 생존 시 플레이어 조각 +1, 카운터 리셋
reverb       피격 생존 시 플레이어 조각 +1

Extended (reward/rare cards):
부유          레인 무시, 수호자 직접 공격
잠식          피해 시 상대 카드 즉사
분열          인접 레인도 동시 공격
불멸          죽으면 손패로 귀환
전이          죽을 때 인장을 인접 카드에 계승
봉인          맞은편 카드 공격 불가 부여
공명          인접 동일 인장 카드 있으면 공격력 +2
각성          매 턴 공격력 +1 (최대 +3)
잠복          수호자 턴에 잠복, 공격 불가
흡수          죽인 카드의 공격력 흡수
```

### Starting Decks

Player (run start):
```
afterimage ×2, memory_shard ×1, lost_memory ×1
+ death cards from previous runs (max 3)
+ remembered cards (died prev run, +1 atk)
```

Side deck: infinite 흐릿한 기억.

Elise normal: `faded_memory ×3, afterimage ×2, night_watcher ×2, memory_shard ×1`
Elise boss: `faded_memory ×2, afterimage ×3, night_watcher ×2, memory_shard ×2, forgotten_dog ×2, echo ×1`
Owen normal: `faded_memory ×3, afterimage ×2, old_book ×2, reverb_card ×1`
Owen boss: `faded_memory ×2, afterimage ×2, old_book ×3, reverb_card ×2, forgotten_dog ×2, echo ×1`

Room 1 reward pool: night_watcher, archive_rat, old_book, forgotten_dog, reverb_card
Room 2 reward pool: echo, forgotten_dog, old_book, reverb_card, afterimage

---

## BOSS GIMMICKS

### Elise

**Turn 5 — 흐릿하게**
One random occupied player slot card becomes faded.
Visually: 40% opacity, gray filter.
Effect: that card's attack = 0 immediately.
At start of player's NEXT turn: card removed from slot.

Dialogue:
- Run 0: *"기억이 흐려지는군요."*
- Run 1+: *"또 이렇게 됐네요."*

**Turn 7 — 복사**
Elise copies one random player slot card.
Copy appears in Elise's opposing slot with same stats.
Fights for Elise.

Dialogue:
- Run 0: *"이 기억... 제가 가져도 될까요?"*
- Run 1+: *"익숙한 얼굴이네요."*

Note: turns 5 and 7 never overlap (LCM = 35, effectively never in normal play).

### Owen

**Every 5 turns — 침묵**
One additional random hand card has its name replaced with "???".
Stats (atk/hp/sigil icon) still visible. Only name hidden.
Cumulative: turn 5 = 1 hidden, turn 10 = 2 hidden, turn 15 = 3 hidden.

Dialogue:
- Turn 5: *"기억이... 잘 안 나."*
- Turn 10: *"이것도 모르겠어."*
- Turn 15+: *(침묵)*

---

## DEATH CARD SYSTEM

Track across ALL battles entire run:
```javascript
G.runStats = {
  cardFieldSurvival: {},  // cardUID → total turns survived on field
  cardUsageCount: {},     // cardID → times placed in slot
  lastDeadCard: null,     // most recently died card this run
};
```

On 2nd defeat, sequence:
```
서고: "잔상이 감지됩니다."        [2s]
서고: "기억 패턴을 분석하는 중..." [2s]

Blank card outline fades in, center screen.

Longest field-survived card silhouette overlays → its sigil stamps onto card
  (faded_memory excluded — no sigil)
서고: "가장 오래 버틴 기억..."

Most-used card's attack number rises → stamps onto card
서고: "가장 자주 소환된 기억..."

Last dead card's HP stamps onto card
서고: "마지막 순간의 기억..."

Card name = most recently deleted J message word
  (if none deleted: "잔상")
서고: "이름을 부여합니다: [name]"  [typewriter effect]
서고: "기록 완료. 이 잔상은 서고에 남습니다."

→ regression
```

Death card added to next run starting deck. Max 3 death cards.
2nd gen fused cards, faded_memory cannot be death card sources.

---

## ITEM SYSTEM

Acquired at [유물함] nodes. Max 3 items held.
Item bar below hand in battle UI. Tap to use during play phase.

```
기억 결정체    빈 슬롯에 흐릿한 기억 1장 즉시 소환
망각 결정체    적 카드 1장 즉시 제거 (탭으로 선택)
봉인된 기억    덱에서 3장 드로우, 2장 골라 되돌림
잔상 거울      적 카드 1장 복사 → 내 빈 슬롯 소환
기억 파편      플레이어 조각 +2
망각 가속기    망각 게이지 즉시 +4
서고 열쇠      자물쇠 1개 힌트 없이 해제 (배틀 외 사용)
공명석         이번 배틀 내 모든 카드 공격력 +1
```

---

## 재분류실

Card/memory exchange node.

```
A. 일반 카드 1장 → 3장 중 1장 선택 (일반)
B. 고급 카드 1장 → 3장 중 1장 선택 (고급) 또는 아이템 1개
C. 흐릿한 기억 ×3 → 일반 카드 1장
   → sacrificeCounter +3
   → show preview: "거래 후 카운터: X/10"
   → if reaches 10: warn "이 거래 후 기억을 선택해야 합니다"
D. 흐릿한 기억 ×5 → 고급 카드 1장
   → sacrificeCounter +5
   → same preview/warning as C
```

흐릿한 기억 trades use cards from hand (not deck).

---

## 기억 조합 (조합실)

Appears once per room, late in map. Player selects 2 cards from deck.

```
GENERATION 1 (normal + normal):
  Name:   "[A의 B]"
  Attack: max(A.atk, B.atk)
  HP:     max(A.maxHp, B.maxHp)
  Sigils: A.sigil + B.sigil (max 2, none if both have none)
  Art:    SVG blend (A at 60% + B at 40% opacity)
  Flag:   fusionGen = 1

GENERATION 2 (gen1 fused + normal card):
  Name:   "[A의 B]의 C"
  Attack: max(fused.atk, C.atk)
  HP:     max(fused.maxHp, C.maxHp)
  Sigils: unchanged from gen1 (no additional sigils added)
  Art:    SVG blend (gen1 art at 70% + C at 30%)
  Flag:   fusionGen = 2

RESTRICTIONS:
  fusionGen = 2 → cannot be selected in 조합실
  faded_memory → cannot be selected
  death cards → cannot be selected
  Both input cards are consumed (removed from deck)
```

Example:
```
잔상 (1/1) + 기억의 파편 (0/3/파쇄) = 잔상의 기억의 파편 (1/3/파쇄) [gen1]
잔상의 기억의 파편 (1/3/파쇄) + 메아리 (2/2) = 잔상의 기억의 파편의 메아리 (2/3/파쇄) [gen2]
→ no further fusion allowed
```

---

## PATH MAP LAYOUTS

SVG node graph. NOT a list. Circles + curved connecting lines.
States: completed (gold filled), available (white pulse), locked (dim gray).

### Room 1 (12 nodes)

```
                    [INTRO BATTLE]
                    (auto-start)
                          |
           ┌──────────────┼──────────────┐
        [battle]      [유물함]        [battle*]
           |              |               |
       [reading]      [battle]        [chest A]
           |              |               |
           └──────┬────────┘           [battle]
                  |                       |
              [chest B]             [reading]
                  |                       |
                  └──────────┬────────────┘
                          [vault]
                              |
               ┌──────────────┼──────────────┐
           [battle]      [재분류실]        [chest C]
               |               |               |
           [chest D]       [조합실]        [battle]
               |               |               |
               └───────┬────────┘──────────────┘
                       |
                  [탐색: 접수실]
                       |
                   [LOCKS ×3]
                       |
                  [ELISE BOSS]
```

### Room 2 (15 nodes)

```
                   [ROOM 2 ENTRY]
                         |
          ┌──────────────┼──────────────┐
       [battle]      [chest A]      [mystery A]
          |               |               |
       [vault]         [battle]      [chest B]
          |               |               |
       [chest C]      [reading]      [battle]
          |               |               |
          └──────┬──────────┘              |
                 |                   [mystery B]
             [battle]                     |
                 |                        |
          ┌──────┴─────────────────────────┘
          |               |
      [유물함]        [재분류실]
          |               |
       [chest D]      [조합실]
          |               |
          └──────┬──────────┘
                 |
           [mystery C]
                 |
          ┌──────┴───────┐
       [battle]       [chest E]
          |               |
       [reading]      [battle]
          |               |
          └──────┬──────────┘
                 |
           [탐색: 복도]
                 |
             [LOCKS ×4]
                 |
           [OWEN BOSS]
```

Node types:
- battle: fight. Win → pick 1 of 3 reward cards. battle* grants hint_lock2 on win.
- chest: memory box. Hint text. Add hint ID.
- reading: upgrade 1 deck card (+1 atk).
- vault: choose +1 fragment OR restore last deleted J message (costs 1 fragment).
- 유물함: 1 random item.
- 재분류실: card/memory exchange.
- 조합실: fuse 2 cards.
- mystery: Room 2 only. Story text + optional rare card.
- 탐색: interactive room exploration. Access lock puzzle.
- LOCKS: lock puzzle screen.
- BOSS: boss battle.

### Warden Pre-Placed Cards

```javascript
const NODE_CONFIG = {
  intro:         { prePlaced: 0 },
  r1_battle_a:   { prePlaced: 1 },
  r1_battle_b:   { prePlaced: 0 },
  r1_battle_c:   { prePlaced: 1 },
  r1_battle_d:   { prePlaced: 2 },
  r1_battle_e:   { prePlaced: 1 },
  r1_elise_boss: { prePlaced: 2 },
  r2_battle_a:   { prePlaced: 1 },
  r2_battle_b:   { prePlaced: 2 },
  r2_battle_c:   { prePlaced: 2 },
  r2_battle_d:   { prePlaced: 2 },
  r2_battle_e:   { prePlaced: 3 },
  r2_owen_boss:  { prePlaced: 3 },
};
```

---

## LOCK PUZZLES

### Room 1 — 3 Locks

```
Lock 1: 4-digit number | Answer: 1103
  Hint: chest A or 탐색 desk
  Text: "찢긴 입고 기록부. 입고일: 11월 03일."

Lock 2: 5-letter name (case-insensitive) | Answer: ELISE
  Hint: battle* win → "명찰 조각: E _ I _ E"
  Cross-hint: reading node → "E로 시작하는 이름."

Lock 3: 2-symbol sequence | Answer: ◆ then ▲
  Input: 4 symbol buttons, tap in order, submit
  Hint: chest B → "다이아몬드, 그 다음 삼각형. 순서대로."
```

### Room 2 — 4 Locks

```
Lock 4: 3-letter word | Answer: OWN
  Hint: chest A → "케이스 태그: property of _ _ _"

Lock 5: 1-digit number | Answer: 7
  Hint: mystery A → "일곱 번째 줄만 새로 쓰여있다."

Lock 6: color (English) | Answer: BLUE
  Hint: chest B → "천의 색. 한때는."

Lock 7: single symbol | Answer: ●
  Input: symbol button grid (◆ ▲ ● ■)
  Hint: mystery B → "넷 중 하나만 남아있다."
```

---

## J MESSAGE SYSTEM

### Phone Layout

**Mini view** (always visible, right edge):
```
┌─────────────────┐
│ 🔋 100%         │
│ ●●●●○○○○○○     │
│ J               │
│ 나 여기 있어... │
└─────────────────┘
```
Tap → fullscreen overlay

**Fullscreen overlay** (centered, phone-frame SVG):
- Header: J's name + profile circle (→ "알 수 없는 번호" + gray when all deleted)
- Scrollable message list, 15px text, 1.6 line-height
- Lock icons on protected messages
- Delete mode: red tint on deletable messages, tap to select

### Sacrifice → Deletion

sacrificeCounter reaches 10:
1. Phone mini pulses
2. Fullscreen opens in delete mode
3. "기억을 하나 선택하세요"
4. Player taps deletable message → fade out (0.4s) → deleted
5. sacrificeCounter = 0, phone closes

### Message List (53 messages)

```javascript
const J_MESSAGES = [
  // Oldest — protected by 'last' rule
  { id:0,  sender:'J',  text:'오늘 고마웠어',                           locked:false },
  { id:1,  sender:'me', text:'뭐가',                                    locked:false },
  { id:2,  sender:'J',  text:'그냥 다',                                 locked:false },
  { id:3,  sender:'me', text:'ㅋㅋ뭔 말이야',                           locked:false },
  { id:4,  sender:'J',  text:'됐어 자',                                 locked:false },
  { id:5,  sender:'me', text:'ㅋㅋ잘자',                                locked:false },
  { id:6,  sender:'me', text:'어제 내가 이상한 말 한 것 같아서',         locked:false },
  { id:7,  sender:'J',  text:'아니야',                                  locked:false },
  { id:8,  sender:'J',  text:'나도 사실 좀 그랬어',                     locked:false },
  { id:9,  sender:'me', text:'뭐가',                                    locked:false },
  { id:10, sender:'J',  text:'그냥',                                    locked:false },
  { id:11, sender:'me', text:'뭔데',                                    locked:false },
  { id:12, sender:'J',  text:'오빠 사랑해',                             locked:'last' },
  // Hard times
  { id:13, sender:'J',  text:'나 요즘 좀 힘든 것 같아',                 locked:false },
  { id:14, sender:'me', text:'왜? 무슨 일 있어?',                       locked:false },
  { id:15, sender:'J',  text:'그냥 다 모르겠어',                        locked:false },
  { id:16, sender:'me', text:'나 지금 나갈 수 있어',                    locked:false },
  { id:17, sender:'me', text:'어디야',                                  locked:false },
  { id:18, sender:'J',  text:'괜찮아 별거 아니야',                      locked:false },
  { id:19, sender:'me', text:'별거 아닌 거 맞아?',                      locked:false },
  { id:20, sender:'J',  text:'응',                                      locked:false },
  { id:21, sender:'me', text:'그래도 나가',                             locked:false },
  { id:22, sender:'me', text:'나 심심해',                               locked:false },
  { id:23, sender:'J',  text:'괜찮아?',                                 locked:false },
  { id:24, sender:'me', text:'응',                                      locked:false },
  { id:25, sender:'J',  text:'진짜로?',                                 locked:false },
  { id:26, sender:'me', text:'응 그냥 피곤했나봐',                      locked:false },
  { id:27, sender:'J',  text:'알겠어',                                  locked:false },
  { id:28, sender:'J',  text:'나 여기 있어',                            locked:'room1_lock2' },
  // Daily life
  { id:29, sender:'J',  text:'나 오늘 시험 완전 망했어',                locked:false },
  { id:30, sender:'me', text:'얼마나?',                                 locked:false },
  { id:31, sender:'J',  text:'그냥 다 틀린 것 같아 ㅠ',                 locked:false },
  { id:32, sender:'me', text:'괜찮아 나도 망했어',                      locked:false },
  { id:33, sender:'J',  text:'ㅋㅋㅋ우리 같이 망했다',                  locked:false },
  { id:34, sender:'me', text:'밥이나 먹으러 가자',                      locked:false },
  { id:35, sender:'J',  text:'오늘 하늘 진짜 예쁘다',                   locked:'room2_chest_a' },
  { id:36, sender:'me', text:'어디서',                                  locked:false },
  { id:37, sender:'J',  text:'공대 앞',                                 locked:false },
  { id:38, sender:'J',  text:'[사진]',                                  locked:'room2_chest_a' },
  { id:39, sender:'me', text:'진짜네',                                  locked:false },
  { id:40, sender:'J',  text:'도서관 자리 맡아놨어',                    locked:false },
  { id:41, sender:'me', text:'몇 층?',                                  locked:false },
  { id:42, sender:'J',  text:'3층 창가',                                locked:false },
  { id:43, sender:'me', text:'가는 중',                                 locked:false },
  // Recent — newest, suggested first for deletion
  { id:44, sender:'J',  text:'야 요즘 Recall이라는 앱 유행하던데 알아?', locked:false },
  { id:45, sender:'me', text:'모르는데',                                locked:false },
  { id:46, sender:'J',  text:'진짜 신기한 게임이야 한번 해봐',           locked:false },
  { id:47, sender:'J',  text:'나 어제 밤새했는데 멈출 수가 없었음',      locked:false },
  { id:48, sender:'me', text:'나중에',                                  locked:false },
  { id:49, sender:'J',  text:'ㅋㅋ알겠어',                              locked:false },
  { id:50, sender:'J',  text:'오늘 저녁 같이 먹을 수 있어?',             locked:false },
  { id:51, sender:'me', text:'오늘 좀 바쁠 것 같아',                    locked:false },
  { id:52, sender:'J',  text:'그래 다음에',                             locked:false },
];
```

### Lock Conditions

```javascript
function isLocked(msg) {
  if (!msg.locked) return false;
  if (msg.locked === 'last')
    return G.jMessages.filter(m => !m.deleted && m.locked !== 'last').length > 0;
  if (msg.locked === 'room1_lock2') return !G.solvedLocks[1];
  if (msg.locked === 'room2_chest_a') return !G.completedNodes.includes('r2_chest_a');
  return false;
}
```

### "오빠 사랑해" Confirmation

```
"이 기억을 지우면 돌아오지 않아요. 정말로요."
[지운다]    [돌아간다]
```
After deletion: J name → "알 수 없는 번호", profile → gray circle.

---

## INTERACTIVE ROOM EXPLORATION

### 3D-Feel CSS (no image assets)

```css
.room-scene {
  perspective: 900px;
  perspective-origin: 50% 35%;
  position: relative;
}
.floor {
  transform: rotateX(55deg) translateZ(-80px);
  background: repeating-linear-gradient(
    90deg, #1a1216 0px, #1a1216 40px, #1e1519 40px, #1e1519 80px
  );
}
.wall-back {
  transform: translateZ(-250px);
  background: linear-gradient(180deg, #0d0a0e 0%, #1a1418 100%);
}
.object {
  transform: translateZ(15px);
  box-shadow: 0 15px 30px rgba(0,0,0,0.7), 0 5px 10px rgba(0,0,0,0.5);
  transition: transform 0.2s, box-shadow 0.2s;
}
.object:hover {
  transform: translateZ(22px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.8);
  cursor: pointer;
}
.object::before {
  /* ambient occlusion — darker at base */
  content: '';
  position: absolute;
  bottom: -8px;
  left: 10%;
  width: 80%;
  height: 8px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.6) 0%, transparent 70%);
  filter: blur(4px);
}
```

### Room 1 탐색 (접수실)

```
Objects:
접수 데스크    탭 → 서랍 열림 애니메이션 → 힌트 or 빈 서랍
벽 게시판      탭 → 공지문 텍스트 (배경 설정)
선반 상자      탭 → "잠겨있습니다" (Lock 1 풀면 열림, 아이템 획득)
낡은 방명록    탭 → J의 이름 포함 페이지
자물쇠 패널    탭 → 자물쇠 퍼즐 화면
```

### Room 2 탐색 (복도)

```
Objects:
유리 케이스 A  탭 → 내부 물건 + 태그 (힌트)
유리 케이스 B  탭 → 잠김 (Lock 4 풀면 열림)
복도 끝 문     탭 → "잠겨있습니다" (보스 전까지)
벽 메모        탭 → Owen의 메모 조각
자물쇠 패널    탭 → 자물쇠 퍼즐 화면
```

---

## WARDEN AI

2 ink per turn.

```
1. Draw 1 card
2. Sort hand: attack descending
3. For each card (inkLeft >= inkCost, empty slot exists):
   Priority 1: slot opposing empty player lane (fragment damage)
   Priority 2: slot opposing player's weakest HP card
   Priority 3: any empty slot
4. Place faded_memory (cost 0) in any remaining empty slot as blocker
```

---

## DIALOGUES

Battery 50% — Elise:
- Run 0: *"배터리가 절반이네요. 오래 버티셨어요."*
- Run 1+: *"또 여기까지예요. 익숙해지셨나요?"*

Battery 50% — Owen:
- Run 0: *(침묵)*
- Run 1+: *"...절반이 남았군요. 저도 그랬어요."*

Battery 0% — Elise:
- Run 0: *"배터리가 다 됐군요. 다음엔 충전하고 오세요."*
- Run 3+: *"...오래 걸렸네요. 이제 기록될 거예요."*

Battery 0% — Owen:
- Run 0: *(침묵)*
- Run 2+: *"꺼지는군요. 저도 이렇게 됐을 거예요."*

Elise battle start:
- Run 0: *"처음 오셨군요. 카드로 길을 여는 곳이에요."*
- Run 1–5: *"또 왔네요. 몇 번째죠?"*
- Run 6+: *"오래 있으면 안 돼요. 나처럼 되기 전에."*

Elise player frags ≤ 2: *"거의 다 왔네요. 하지만 여기서 끝이에요."*
Elise defeated: *"...그래요. 가도 돼요. 하지만 다음 방은 더 깊어요."*
Elise player defeated: *"오래 걸리진 않을 거예요. 다들 그렇게 생각했으니까."*

Owen battle start:
- Run 0: *(침묵)*
- Run 1: *"여기 왔었죠."*
- Run 2: *"누군가를 찾고 있죠?"*
- Run 3+: *"저도 찾고 있었어요. 지금은 누구였는지 모르겠어요."*

Owen defeated: *"...가져가요. 뭘 찾으러 왔든."*

Talking card (lost_memory):
- Run 0: *"...어디지? 나 어디 있는 거야?"*
- Run 1: *"또 여기야. 몇 번째인지 알고 있어?"*
- Run 2: *"저 사서 있잖아. 처음엔 달랐어."*
- Run 3+: *"자물쇠 말이야. 날짜를 봐."*

---

## STORY BEATS

Room 1 intro (before auto-battle):
Elise: *"카드가 손에 잡혔군요. 여기선 그게 시작이에요."*

After first win (map appears):
Elise: *"이제 길이 보이나요. 하지만 하나가 아니에요."*

After Elise boss: *"문이 생겼다. 원래 없던 자리에."* → Room 2

Room 2 mysteries:
- Mystery A: *"7번 케이스. 유리가 뿌옇다. 안에 손목밴드가 있다. 이름은 없다."*
- Mystery B: *"사진 한 장. 네 명. 세 얼굴이 가려져 있다."*
- Mystery C: *"노트. 필체가 중간부터 바뀐다."*

Loop ending (click to advance):
```
"탈출했다."
"기숙사 방. 아침."
"J의 문자: '야 어제 어디 있었어?'"
"평범한 하루인 것 같다."
"..."
"핸드폰에 Recall 알림이 떴다."
"'두 개의 새로운 기억이 기록되었습니다.'"
```

Regression:
```
"기억이 수집되었습니다."
"눈을 뜬다."
"핸드폰이 손에 있다."
"Recall이 켜져 있다."
```

---

## VISUAL REQUIREMENTS

### Battle Layout

```
┌─────────────────────────────────┬──────────────┐
│ 수호자명  ●●●●●  [실루엣][실루]  │  수호자 덱   │
│                                 │  (팬, 탭불가)│
│ [slot0][slot1][slot2][slot3]    │              │
│ ─────────────────────────────  ├──────────────┤
│ [slot0][slot1][slot2][slot3]    │ 🌫 흐릿한기억│
│                                 │  (팬, 탭가능)│
│ ●●●●●  💧잉크:2  🟣망각:3       │              │
│ 🔋100%  ●●●●○○○○○○             ├──────────────┤
│                                 │ 📖 메인 덱   │
│ [손패 — 가로 스크롤]            │  (팬, 탭가능)│
│                                 │              │
│ [아이템1][아이템2][아이템3]      │              │
│ [턴 종료]                       │              │
└─────────────────────────────────┴──────────────┘
        [핸드폰 미니뷰 — 우하단 고정]
```

### Sizing

```
Cards:          110 × 154px minimum
Slots:          110 × 154px minimum
Card name:      15px Cinzel bold
Stats:          14px
Fragment ●:     24px, letter-spacing 5px
Ink/망각:       16px
Buttons:        16px minimum
Dialogue:       16px Crimson Text
Phone mini:     130px wide, 210px tall
Phone full:     320px wide, 72vh tall
```

### Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Text:ital,wght@0,400;1,400&display=swap" rel="stylesheet">
```

### Colors

```css
--bg-deep:      #09070a
--bg-dark:      #110d0f
--bg-panel:     #1a1418
--bg-card:      #221820
--border-dim:   #3d2838
--border-gold:  #c8a84b
--border-red:   #7a2e2e
--text-bright:  #f0ddc8
--text-main:    #d4a898
--text-dim:     #7a5858
--text-gold:    #c8a84b
--ink-color:    #6ab0e0
--oblivion:     #9b6abf
--fragment:     #c8a84b
--remembered:   #5a9a6a
```

### Card SVG Art (70×50px)

```
faded_memory:   3 concentric fading circles, opacity ~0.06
afterimage:     5 diagonal offset lines
memory_shard:   4 triangles from center
echo:           3 expanding rings
lost_memory:    ? mark, 8 dissolving dots
night_watcher:  minimal eye, two arcs
archive_rat:    rat silhouette path
old_book:       open book, 3 text lines
forgotten_dog:  dog silhouette, head away
reverb_card:    two mirrored sine waves
```

### Attack Animations (sequential, 0.3s between slots)

```
돌진형 (afterimage, forgotten_dog, echo):
  translateY: 0 → -20px → -140px → 0  (0.5s)

파장형 (lost_memory, reverb_card):
  opacity 1→0.3→1 + ripple at target  (0.6s)

진동형 (memory_shard, old_book, night_watcher):
  translateX ±6px × 3 + shockwave pulse  (0.4s)

튀기형 (archive_rat):
  parabolic arc + impact + fade (ephemeral)  (0.5s)
```

### Hit Animations

```
일반 피격:   shake (translateX ±6px) + red brightness flash, 0.25s
카드 사망:   scale 1→0.7, rotate 0→-15deg, opacity 1→0, 0.4s
빈 슬롯 피격: screen edge red flash + fragment ● pulse
```

### Battery Animations

```
50% drain:  SVG battery fill animates half-empty, screen flicker, 1.5s
0% drain:   battery empties → scanlines CSS overlay →
            clip-path dims top-to-bottom → full black, 2.5s total
```

---

## GAME STATE

```javascript
const G = {
  runCount: 0,
  screen: 'title',
  battery: 100,

  // Persistent (localStorage)
  solvedLocks: [false,false,false,false,false,false,false],
  rememberedCards: [],
  deathCards: [],          // max 3
  jMessages: J_MESSAGES.map(m => ({...m, deleted: false})),
  sacrificeCounter: 0,    // 0–9

  // Run stats (death card)
  runStats: {
    cardFieldSurvival: {},  // cardUID → turns on field (all battles)
    cardUsageCount: {},     // cardID → times placed
    lastDeadCard: null,
  },

  // Current run
  playerDeck: [],
  items: [],               // max 3

  // Current room
  currentRoom: 1,
  currentNodeId: null,
  completedNodes: [],
  collectedHints: [],

  // Current battle
  playerFragments: 5,
  wardenFragments: 5,
  currentInk: 0,
  oblivionGauge: 0,
  playerHand: [],
  playerSlots: [null,null,null,null],
  wardenSlots: [null,null,null,null],
  wardenDeck: [],
  wardenHand: [],
  wardenNextPlan: [],
  battleDiscard: [],
  isBossBattle: false,
  battlePhase: 'draw',    // draw | play | attacking | warden
  turnCount: 0,
};
```

---

## SIMULATION SUITE (T key on title)

```
TEST 1:  Lane combat — card blocks hit, no fragment change
TEST 2:  Empty player lane — warden hits fragments
TEST 3:  Empty warden lane — player hits warden fragments
TEST 4:  Card death — slot clears, oblivionGauge +1
TEST 5:  shatter — player frags +1 on death
TEST 6:  vigilance — attacker atk -1
TEST 7:  reverb — player frags +1 on survival hit
TEST 8:  ephemeral — dies after attacking, oblivionGauge +1
TEST 9:  oblivionGauge spend — play card without ink
TEST 10: sacrificeCounter → 10 triggers message deletion prompt
```

---

## IMPLEMENTATION ORDER

```
STEP 1:   HTML shell, CSS vars, Google Fonts, grain background
STEP 2:   Card data (all cards, extended sigils, SVG art function)
STEP 3:   Card component (110×154px, frame, art, stats, sigil tag)
STEP 4:   Game state G, save/load localStorage
STEP 5:   J message data, phone mini view + fullscreen overlay
STEP 6:   Sacrifice counter pips UI + animation
STEP 7:   Title screen (gothic aesthetic, animated deck)
STEP 8:   Battle layout (slots, hand, deck fans, item bar, phone mini)
STEP 9:   Deck fan rendering (warden untappable, 흐릿한기억 + main tappable)
STEP 10:  Draw flip animation (lift → rotateY → slide to hand)
STEP 11:  Draw phase (tap fan → card to hand, starting hand 3+1)
STEP 12:  Ink system + card placement from hand to slot
STEP 13:  흐릿한 기억 sacrifice → ink +1, counter +1
STEP 14:  망각 게이지 (card death → +1, spendable)
STEP 15:  Counter → 10: deletion mode in phone
STEP 16:  [턴 종료] → auto attack animation sequence (left to right)
STEP 17:  Combat resolution (lane logic, all sigils)
STEP 18:  oblivionGauge +1 on any card death
STEP 19:  WIN detection after auto attack
STEP 20:  Warden AI (draw, next-plan preview, place cards)
STEP 21:  Warden auto-attack + LOSE detection
STEP 22:  Battery UI in phone mini view
STEP 23:  First defeat flow (50%, flicker, dialogue, field clear, resume)
STEP 24:  Second defeat flow (0%, screen-off animation)
STEP 25:  Death card creation sequence
STEP 26:  Boss gimmicks (Elise turn 5/7, Owen every 5 turns)
STEP 27:  Boss gimmick dialogues
STEP 28:  Warden pre-placed cards per node config
STEP 29:  Path map SVG Room 1 (12 nodes)
STEP 30:  Map navigation (available/locked/completed states)
STEP 31:  Memory box screen (chest)
STEP 32:  Reading Room screen (card upgrade)
STEP 33:  Memory Vault screen (frag or message restore)
STEP 34:  유물함 screen + item system
STEP 35:  Items usable in battle (item bar)
STEP 36:  재분류실 screen (all 4 trade types, counter preview)
STEP 37:  조합실 screen (gen1 + gen2 fusion, restrictions)
STEP 38:  Battle reward screen (pick 1 of 3)
STEP 39:  Lock puzzle Room 1 (3 locks, symbol sequence for lock 3)
STEP 40:  Interactive room exploration Room 1 (3D CSS, clickable objects)
STEP 41:  Room 1 story beats + transition to Room 2
STEP 42:  Path map SVG Room 2 (15 nodes)
STEP 43:  Owen AI + decks
STEP 44:  Mystery node screens
STEP 45:  Lock puzzle Room 2 (4 locks)
STEP 46:  Interactive room exploration Room 2 (3D CSS)
STEP 47:  All dialogues (Elise, Owen, talking card, battery)
STEP 48:  Regression sequence + state reset
STEP 49:  Loop ending sequence
STEP 50:  Remembered cards + death cards in Run 2
STEP 51:  runStats tracking (field survival, usage, last dead)
STEP 52:  Simulation suite (T key)
STEP 53:  Debug overlay (D key)
STEP 54:  Run all 10 simulation tests — fix all failures
STEP 55:  Full playthrough: title → Room1 → Room2 → regression → Run2
STEP 56:  Fix all bugs found in step 55
STEP 57:  Visual polish (all animations, transitions, 3D room)
STEP 58:  Final DONE CRITERIA check — every item must pass
```

---

## RALPH LOOP RULES

After each step: check console, fix errors before next step.
After step 54: all 10 tests must PASS before proceeding.
After step 55: log every failing DONE CRITERIA item, fix all before step 57.
Do not stop until every DONE CRITERIA checkbox passes.

---

*Build iteratively. Simulate continuously. Do not stop until done.*