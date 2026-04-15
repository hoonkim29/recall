# RECALL Playtest Feedback Log

Single-source tracker since no git yet. Most recent on top within each section.

---

## ✅ 완료된 수정

### UX / Tutorial
- Tutorial narration (Run 0 only) — battle start / first place / first endTurn / first draw 각 액션마다 모달 안내

### Bug Fixes (14개)
1. **카드 stats 잘림** — `.card .art{min-height:0}` + svg `max-height:100%` (overflow:hidden이 stats 영역 밖으로 밀어낸 것 해결)
2. **전투 애니메이션 덮어써짐** — `resolveCombatStep`에서 `showScreen` 풀 재렌더를 `updateBattleFragments()` 타겟 업데이트로 교체, acted 시 550ms 대기로 애니메이션 완주
3. **playerFragments 전투 간 리셋 안 됨** — `enterBattle`에 `G.playerFragments=5` 추가
4. **덱 고갈 교착** — 덱 drawn 버튼 클릭 시 `battleDiscard`에 non-faded 카드 있으면 `shuffle`로 재구성해서 덱에 복구
5. **completedNodes 중복이 난이도 왜곡** — `enterBattle`에서 `new Set(completedNodes)`로 중복 제거 후 firstBattle / prePlaced 계산
6. **쾌속 드로우 race** — `doDraw` 시작 시 `battlePhase='drawing'` 락, 핸들러에 `if(battlePhase!=='draw')return;` 가드
7. **워든 AI 단순** — `pickWardenSlot(card)` 재작성: 플레이어 atk>0 카드 있는 레인 우선 블록, kill 가능하면 kill, 아니면 위협 최대 레인, 그 다음 empty lane
8. **맵 미선택 분기 "완료" 오표시** — `G.skippedNodes` 배열, `enterNode`에서 부모 c[] 중 선택되지 않은 형제를 skipped push. `canEnter`에서 skipped 제외, `renderMap`에서 회색 + X 표시
9. **워든 공격 애니메이션 방향** — `.warden-slot.atk-rush{animation:atk-rush-down}`, `.warden-slot.atk-arc{animation:atk-arc-down}` (translateY 양수)
10. **30턴 캡 스탤메이트 세이프가드** — `endTurn`에서 turn>=30이면 조각 많은 쪽 승리로 즉시 종료
11. **턴 종료 깜빡임** — `showScreen`에서 detached element에 render 후 `root.replaceChildren(el)` 원자 교체, battle screen `.screen{animation}` 비활성화
12. **형제 노드 잠금 추적** — `G.skippedNodes` 초기화/유지 (run 시작 시 빈 배열로 리셋)
13. **pendingNode 런간 누수** — `startNewRun()`에 `G.pendingNode=null` 추가 + victory 핸들러에서 `map[pendingNode.id]` 유효성 검사 후 push
14. **0-atk 카드 공격 애니메이션 + vigilance 0 감쇄 피드백** — `resolveCombatStep` guard에 `p.attack>0` / `e.attack>0` 체크 추가, 실제 damage(`a`) 값이 0이면 `flashHit` 스킵

### 검증 완료
- sim.js 10/10 passed
- 콘솔 에러 0
- 타이틀 → 인트로 → 튜토리얼 배틀 → 빅토리 → 맵 → 락퍼즐 → 보스 → 컷신 → Room 2 → 보스 → loopending 엔드 투 엔드 (강제 승리 시나리오로 검증)

---

## 🔨 진행 중 / 앞으로 수정

### ✅ T1 완료 — 배경 이미지 적용
- `contain` + `background-position:center` + gradient overlay로 모든 뷰포트에서 전체 이미지 가시
- 타이틀: dorm_card.jpg (책상/램프/창밖/덱 다 보임)
- 배틀 Room 1: reception_table.png
- 배틀 Room 2: corridor_table.png
- runCount≥3 시 dorm_card_vault.jpg 자동 전환
- UI 패널이 테이블 위에 자연스럽게 앉음, 위/아래는 자연스러운 페이드

### ✅ T2 완료 — 워든 카드 뒷면 + 플립 애니메이션
- `wardenTurn(done)` 비동기화 — 카드 한 장씩 순차 배치
- 각 카드: 뒷면으로 등장 (warden-dealing 0.5s) → 플립 (warden-flipping 0.55s) → 앞면 공개
- 총 카드당 ~1.3s, 여러 장이면 순차적으로
- `.card.facedown` CSS: 어두운 그라디언트 + "◈" 문양
- 검증: t=94(empty) → t=942(facedown) → t=1037(dealing) → t=1496(flipping) → t=2041(faceup)

### 지나간 초안 — T1. 배경 이미지 적용
**자산**:
- `image/dorm_card.jpg` → 타이틀 배경 (runCount 0~2)
- `image/dorm_card_vault.jpg` → 타이틀 배경 (runCount 3+)
- `image/reception_table.png` → Room 1 배틀 배경
- `image/corridor_table.png` → Room 2 배틀 배경
- `image/dorm_no_card.jpg` → 예약 (나중에)

**주의사항**:
- 카드/슬롯/조각/버튼이 배경에 잘리지 않게 layout 재확인
- 가독성을 위해 배경 위에 반투명 어두운 오버레이 필요 시 `rgba(0,0,0,0.3~0.5)` 추가

### T2. 워든 카드 뒷면 배치 + 플립 애니메이션
- 현재: `wardenTurn()` for-loop으로 즉시 여러 장 한꺼번에 배치
- 목표: 한 장씩 순차 (0.7~1s 간격)로 placed — 먼저 뒷면 card가 슬롯에 등장 → 플립 애니메이션으로 앞면 공개
- 구현:
  - `.card.facedown` CSS (RECALL 문양 뒷면)
  - `.card.flipping` 키프레임 `rotateY(180deg) → rotateY(0)`
  - `wardenTurn()`을 `async` 로 변환, 각 배치마다 `await sleep(700)`
  - 튜토리얼 첫 상대 턴에서 "상대도 카드를 놓았어요" 나레이션

### ✅ T3 완료 — 스포트라이트 튜토리얼 시스템
**9단계 시퀀스** (Run 0 전용, 튜토리얼 완료 시 플래그):
1. **intro** — 게임 컨셉 모달 (대화박스 중앙)
2. **ink** — 💧 잉크 하이라이트 + 설명
3. **hand** — 손패 영역 하이라이트
4. **field** — 배틀 필드 하이라이트
5. **frags** — 상대 조각 ✦✦✦✦✦ 하이라이트
6. **placeAction** — 잔상 카드만 밝게, 사용자가 배치하면 다음 진행 (waitForAction)
7. **inkSpent** — 배치 후 💧 숫자 줄어든 것 하이라이트 + 피드백
8. **fadedIntro** — 흐릿한 기억만 밝게, 사용자가 배치+재클릭(희생)하면 다음 진행
9. **sacFeedback** — 잉크 회복 + 카운터 +1 하이라이트 + 피드백
10. **endTurn** — 턴 종료 버튼 하이라이트, 클릭하면 전투 시작
11. **attackResult** — 전투 후 워든 조각 ✦✦✦✦✧ 하이라이트 + "하나 줄었죠?"

**구현 디테일**:
- `tutorialStep(opts)` 헬퍼: target selector or highlightCard(덱의 카드 id)
- `box-shadow: 0 0 0 9999px rgba(0,0,0,0.72)` 트릭으로 대상 외 영역 어둡게 — 이중 masking 버그 있어 수정함 (target 있으면 별도 mask div 안 생성)
- 대화박스 자동 position: 대상 아래 공간 충분하면 아래, 아니면 위, 아니면 기본
- waitForAction 모드: 대상만 클릭 가능하도록 mask pointer-events:none
- 기존 `tutorialTip` 기반 모달들 제거 (중복 발동 방지)
- 액션 트리거 hook: `playCard`(card.id 검사), `requestSacrifice`, `endTurn`, 전투 완료 시 (`wardenTurn` 콜백 후)

### 지나간 초안 — T3. 스포트라이트 튜토리얼 시스템 전면 개편
**Phase 1 — 게임 개념 소개** (모달 1장)
> "카드로 상대의 조각(✦)을 깎으세요. 조각이 0이 되면 승리."

**Phase 2 — UI 투어** (각 스텝: 해당 요소만 밝게, 나머지는 어둡게, 대화박스는 해당 요소를 가리지 않는 위치)
- 2-1. 잉크(💧) → "이번 턴 쓸 수 있는 자원"
- 2-2. 손패 영역 → "당신의 카드들, 좌상단 숫자는 배치 비용"
- 2-3. 배틀필드 → "위는 상대, 아래는 당신. 같은 레인의 카드끼리 싸웁니다"
- 2-4. 조각(✦) → "이 생명선. 0이 되면 패배"

**Phase 3 — 액션 가이드** (사용자 실제 수행)
- 3-1. 손패 중 "잔상"만 밝게 → "잔상을 선택해 필드에 놓으세요" → 배치 완료 시 잉크 하이라이트 → "잉크가 1 소모됐죠?"
- 3-2. 손패 중 "흐릿한 기억"만 밝게 → "이건 공격은 안 되지만 희생하면 잉크 +1" → 필드에 놓고 다시 클릭 → 잉크 복구 + 희생 카운터 0/10→1/10 하이라이트 → "10개 모으면 기억 삭제 모드가 열려요"
- 3-3. "턴 종료" 하이라이트 → 클릭 → 전투 애니메이션 → 상대 조각 하이라이트 → "조각이 하나 깎였어요"

**구현**:
- CSS: `.tutorial-overlay` (full-screen black 0.7), `.tutorial-spotlight` (clip-path/mask로 대상만 뚫기), `.tutorial-dialog` (말풍선)
- JS: `tutorialSpotlight(targetSelector, text, {onProceed, position})` 헬퍼
- 위치 계산: 대상 rect → 대화박스는 대상 반대쪽 (rect.y < viewport/2 이면 아래, 아니면 위)

### T4. 검증
- 튜토리얼 전 단계 수동 플레이로 UX 흐름 확인
- 배경 이미지에서 카드 잘림/가독성 문제 없는지 스크린샷 검증

---

## 🧪 플레이테스트 라운드 2 (20회 목표)

### Test 1 — 튜토리얼 흐름 ✅
- 11단계 전부 정상 동작, 액션 트리거 정확

### Test 2 — Vigilance 차단 피드백 추가 ✅
- 유저 지적: 야경꾼(vigilance)을 1-atk로 공격 시 HP 안 깎임 → 피드백 없음
- 스펙상 "경계: 공격자 공격력 -1"이므로 1→0 damage 정상
- 그러나 시각적 피드백 부재로 버그처럼 보임
- **해결**: `showBlocked()` 함수 추가, effective atk=0일 때 "🛡 차단" 팝업 애니메이션 (1.4s, 위로 올라가며 페이드)
- 튜토리얼 endTurn 단계에 vigilance 설명 + 🛡 차단 안내 포함

### Test 3 — 전투 자동 플레이 관찰
- 튜토리얼 이후 배틀 진행: pF=5 유지, wF=1까지 감소 가능한 경우 있음
- Starter deck에 atk>0 카드 2장뿐이라 튜토리얼에서 1장 쓰면 1장만 남음 → 후반부 drawing에 의존

### Test 4 — 실제 stalemate 관찰
- 양쪽 모두 0-atk 카드만 보유 → pF=3, wF=2에서 여러 턴 진전 없음
- 유저 지적: "stalemate 해결 필요"

### Test 6 — 튜토리얼이 다른 화면에 누수 🐛→✅
- 증상: 강제 승리로 battle→victory 전환 시 setTimeout에 의해 튜토리얼 intro가 victory 위에 겹쳐 표시
- 수정: `tutorialStep`에 `G.screen!=='battle'` 가드, `showScreen(name!=='battle')` 호출 시 `tutorialClose()` 자동 호출

### Test 7-10 — 빅토리→카드선택→맵 흐름 ✅
- cardchoice에서 highest-atk 카드 선택 작동
- map에 분기/시블링 잠금 유지 (skippedNodes)
- campfire(열람실)에서 "카드 연마" 선택 → afterimage ⚔1→⚔2로 업그레이드 확인
- relic 노드에서 .item-btn 기반 유물 선택 작동

### Test 11-14 — Room 1 보스 → Room 2 전환 ✅
- 로크퍼즐 3개 해결 (1103 / ELISE / ◆▲) → 보스 노드 잠금 해제
- Elise 격파 → cutscene "문이 생겼다" → Room 2 진입 (currentRoom=2, completedNodes 리셋)
- 배경 자동 전환 bg-battle-r1 → bg-battle-r2 (corridor_table.png)

### Test 15-20 — Room 2 보스 → 데모 엔딩 ✅
- Room 2 lockpuzzle (OWN / 7 / BLUE / ●) 해결
- Owen 격파 → loopending 7 페이지 내러티브
- 최종 엔딩: "탈출했다." 표시
- regression → title (run #1 increment) 확인

### Test 5 — Stalemate 해결 ✅
**수정**:
- `checkStalemate()` 함수: 양쪽 hand/deck/discard/slots 전부 atk≤0이면 true 반환
- `endTurn`에서 stalemate 감지 시 조각 많은 쪽 승리 처리 즉시 종료
- 턴 캡 30 → 20으로 단축 (오래 끌지 않게)
- 🏳️ 항복(concede) 버튼을 action-bar에 추가 (confirm 후 pF=0으로 패배 처리, 배터리 절반 감소 플로우 진입)

검증: 0-atk만 있는 필드에서 턴 종료 → stalemate 자동 감지 → 승리 판정 (pF 높은 쪽) → victory 화면 전환

## 💡 향후 아이디어 (데모 이후)

- dorm_no_card.jpg 활용 (아직 용도 미정)
- 7회차+ 다이얼 상자 타이틀 배경 (스펙 기재, 데모 이후)
- 카드 뒷면 코스메틱 팩 지원

---

## 📝 사용자 관찰 원본 (요약)

1. "HP가 닳지 않는 카드가 있고 공격력 0인데 공격 모션이 나오는 카드가 있다" → Bug #14 수정
2. "턴 종료할 때마다 화면이 깜빡인다" → Bug #11 수정
3. "워든 공격 애니메이션 방향이 이상하다" → Bug #9 수정
4. "워든 AI가 바보 같다" → Bug #7 수정
5. "쾌속 클릭 시 흐릿한 기억 5장 뽑힌다" → Bug #6 수정
6. "맵에서 선택 안 한 경로가 황금색으로 클리어된 것처럼 보인다" → Bug #8 수정
7. "튜토리얼 나레이션 없이 게임이 시작되면 너무 어렵다" → Tutorial system 추가
8. "워든 카드가 한꺼번에 놓인다, 하나씩 뒤집히는 애니메이션으로" → T2 작업
9. "배경 이미지 세팅 필요" → T1 작업

---

## 2026-04 20-Run Playtest (in progress)

Logging new issues here so they survive context compaction. Most recent on top.

### Findings

#### Run 1 (tutorial run, lost at Elise boss)
- **I1** 타이틀에 `T = sim · D = debug` 디버그 텍스트 노출 — production에서 숨겨야 함
- **I2** 승리/카드선택/맵 화면 배경이 완전 검정 — 타이틀/배틀만 배경이미지 씀, 전환 stark
- **I3** 맵 아이콘(⚔📦🔒👁?💠⇄🚪) 무엇인지 첫방문 시 설명 부재
- **I4** lockpuzzle 메커니즘(힌트 모으기→락 해제→보스) 안내 부재
- **I5** 첫 런(runCount=0) 각 배틀마다 "처음 오셨군요" 반복 — 튜토리얼 후엔 다른 대사 필요
- **I6** 첫 런 보스전에 프리플레이스 2장(야경꾼+잔상)으로 난이도 급증 — 첫 플레이어가 쉽게 패배

#### Run 2 (regular run, reached loopending via force-unlock test)
- **I7** fuse 화면 "2세대 불가" 용어 설명 부재
- **I8** 🚨 **loopending "Escaped" 화면에 재시작/메인 버튼 없음** — 유저 stuck
- **I9** room2 map `reclass` 화면이 map UI를 렌더하지만 G.screen==='reclass' — 상태 불일치 가능성

#### Immediate high-priority fixes before more runs
1. Hide `T = sim · D = debug` hint
2. loopending: add "처음부터" / "타이틀로" 버튼
3. 첫 런 인사 반복 제거 — 첫 배틀만 풀대사, 이후 짧은 대사
