# Test Plan Writing Guidelines

## Document Template

```markdown
# Test Plan: [Feature Name]

**Date:** YYYY-MM-DD
**Run:** N
**Scope:** SMALL | MEDIUM | LARGE
**Feature:** [Brief description of what was built/changed]

## Changed Files
- path/to/file1.tsx
- path/to/file2.ts

## Setup
[Debug tool steps needed before testing — seed data, game simulator, etc.]
[Setup is NOT verification — it prepares state so ACs can run]

## Acceptance Criteria

### AC-1: [Title]
**Steps:**
1. [Navigate to X screen]
2. [Tap Y button]
3. [Verify Z]

**Expected:** [Specific observable outcome]
**Status:** PENDING
**Observed:** —
**Agent log:**
- Thinking: —
- Actions: —

### AC-2: ...

---

## Summary
| AC | Title | Status |
|----|-------|--------|
| 1  | ...   | PASS   |
| 2  | ...   | FAIL   |

**Pass:** X | **Fail:** X | **Blocked:** X
```

### Status values
- **PENDING** — not yet tested (set by main session)
- **PASS** — feature works as expected (set by agent)
- **FAIL** — feature does NOT work as expected — this is a CODE BUG (set by agent)
- **BLOCKED** — agent exhausted all alternatives and could not reach the test scenario (set by agent)

### Agent output fields
- **Observed** — one-line summary of what the agent actually saw (contrast with Expected)
- **Agent log** — the agent's reasoning and actions:
  - **Thinking:** what the agent planned to do and why
  - **Actions:** numbered list of key tool calls (inspect, tap, assert)
  - Any conclusion, notes, or improvement suggestions

## Writing Good Acceptance Criteria

### Rules

1. **Specific and observable** — "MIN column shows 40:00 for Player 1" not "minutes work correctly"
2. **Steps a QA tester could follow** — numbered actions with screen names and element references
3. **One thing per AC** — test one behavior, not five at once
4. **Expected outcome is concrete** — what you'd see in inspect_view_hierarchy or a screenshot
5. **Cover the full flow** — don't stop at "does it render?", verify data is correct

### Bad vs Good Examples

**BAD:** "Verify the box score works"
**GOOD:** "AC-5: Box score MIN column shows correct minutes — Navigate to completed game box score. Verify MIN column exists as the first stat column. Verify Player 1 who played all 4 quarters shows 40:00. Verify Player 2 who was subbed out at 5:00 in Q1 and never returned shows 5:00."

**BAD:** "Check the toggle appears"
**GOOD:** "AC-1: Track Minutes toggle on new game screen — Navigate to Games tab → New Game. Verify Track Minutes toggle exists with testID track-minutes-toggle. Tap it. Verify Period length (min) input appears with default value 10."

**BAD:** "Test substitutions"
**GOOD:** "AC-3: Clock warning on unchanged time — Open sub overlay. Do NOT change the clock time. Verify orange warning text 'Clock unchanged since last sub' is visible. Change clock to 7:00. Verify warning disappears."

## Scope-to-Depth Mapping

### SMALL (2-4 ACs)
- Verify the specific change renders correctly
- Verify one adjacent behavior still works
- Example: color change → check the color + check the screen still functions

### MEDIUM (5-10 ACs)
- Verify the feature works end-to-end
- Verify data persistence (navigate away and back)
- Verify edge cases (empty state, max values)
- Example: new button → renders, is tappable, performs action, result visible, works on reload

### LARGE (10-20 ACs)
- Full E2E flow from creation through completion
- Data integrity across screens (game → box score → player averages)
- Export/import if affected
- Cross-screen impact (does the change break other areas?)
- Example: minutes tracking → game creation toggle, sub overlay clock, clock warning, period transitions, box score MIN column, player averages MPG, export/import

## Debug Tool Usage

### DO use debug tools for:
- Creating teams with players (Team Setup → Quick Setup)
- Generating completed games with stats (Game Simulator)
- Loading seed data for testing against existing data (Seed Data)
- Saving/restoring app state between test runs (Snapshots)

### DO NOT use debug tools to:
- Skip verification steps (always verify the result even if debug tools set it up)
- Replace user-facing flows (if the AC tests "create a game with minutes tracking", navigate through the real UI, don't use a debug shortcut)

## Domain-Specific AC Patterns

### Game Creation
- Toggle/option exists and is interactive
- Default values are correct (period length based on quarters/halves)
- Game creates successfully and navigates to game screen

### Stat Recording
- Tap stat category → tap specific stat → verify play-by-play updates
- Verify box score updates in real-time
- Verify period scores update

### Substitutions
- Sub overlay opens with correct active/bench split
- Players can be moved between active and bench
- Confirm updates the game state

### Box Score
- All columns present (check headings in hierarchy)
- Player stats match expected values
- Total row sums correctly
- Sorting works (tap header, verify order changes)

### Player Averages
- MPG/new columns appear only when applicable
- Values are calculated correctly (total / games)
- Shows "—" when no data

### Export/Import
- Export produces valid .statline file
- Import wizard opens and shows correct summary
- Imported data matches exported data
