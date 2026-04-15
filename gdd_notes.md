# RECALL — Design Notes (Room 2+ / Ideas)

Living doc for ideas that are not yet implemented. These should be
referenced when planning Room 2 onward and the J boss encounter.

## Faded Memory semantics (Room 2+)

- Faded Memory (흐릿한 기억) is currently a shared draw pool for both
  player and warden. After player feedback, the design intent is:
  - **Most bosses** should NOT use Faded Memory in their deck. The
    boss presents their own deliberate memories. Implemented:
    elise_boss and owen_boss no longer contain faded_memory.
  - **J boss** (planned): Faded Memory IS part of the encounter, but
    with special framing — the Faded Memories represent J's slipping
    memory of the player. When the player destroys a Faded Memory in
    J's field, one of J's "real" memories (a chat bubble, a named
    card slot) fades too. The encounter tension comes from the player
    having to sacrifice memories to progress while watching J forget
    them.
  - Prototype idea: J deck composition is lightly seeded with 2–3
    Faded Memories that, when killed, trigger a scripted dialogue
    fade (gray out a chat bubble in J's phone thread, remove a love
    memory from the pool). The last Faded Memory dying could lock or
    unlock the true ending branch.

## Oblivion-cost cards (Room 2+)

- Current state: oblivionGauge (0–8) rises by 1 on card death and
  acts as a fallback payment when ink is short.
- Missing: cards that **specifically cost oblivion** as a primary
  resource. Feel: memories the player only summons AFTER enough has
  been lost. Thematic fit for Room 2 (Exhibits / past forgotten).
- Prototype ideas:
  - `shade`: 3 oblivion / ⚔3 / ❤3 — a mirror of Forgotten Dog that
    only appears when the player has lost enough to forget.
  - `null_form`: 5 oblivion / ⚔0 / ❤6 with vigilance — a wall built
    from gaps.
  - `reverie`: 2 oblivion / ⚔2 / ❤1 with ephemeral — one-shot echo.
- Implementation note: playCard currently treats oblivion as a
  fallback resource. For oblivion-cost cards, add a
  `c.oblivionCost` field and branch in playCard:
  - If `c.oblivionCost`, require `G.oblivionGauge >= c.oblivionCost`,
    subtract from oblivion ONLY, do not touch ink.
  - Render cost chip differently (purple tint) on the card.

## Fusion rule (confirmed)

- First selected card = base (form, id, art, cost stay).
- Second selected card = overlay: its attack and hp are ADDED to
  base's. Sigil of overlay wins if present, otherwise keeps base
  sigil.
- Already implemented.

## Multi-sacrifice (confirmed)

- Sacrifice button 🜂 in action bar toggles a selection mode. Any
  player-side card can be selected (not only Faded Memory). On
  confirm:
  - Ink += number sacrificed.
  - The 0/10 sacrifice counter advances ONLY for Faded Memory
    sacrifices (non-faded cards do not push memory deletion).
- Already implemented.

## Card sigil display

- Text labels at bottom of cards are too small on mobile. Replaced
  with a round emoji badge in the top-left corner. Keep the
  emoji-as-primary convention for any new sigils.

## Warden greetings

- Run 0: first battle gets the full intro line; subsequent battles
  of Run 0 get a short neutral line; Run 0 boss gets a unique line.
- Keep this pattern when adding J and any new warden.

## Open questions for J encounter design

- Does J's deck regenerate Faded Memories when one is destroyed, or
  is the pool finite?
- What is the mechanical effect when the LAST Faded Memory dies?
  (candidates: J hand locks, boss gains an 'empty' finisher, player
  forced into true ending split)
- How does this interact with the existing `sacrificeCounter` and
  the phone chat memory deletion?
