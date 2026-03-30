---
name: verify
description: Comprehensive verification of code changes in the iOS simulator using Maestro MCP. Creates a test plan with acceptance criteria scoped to what changed, spawns a background agent to execute every criterion, and reports pass/fail results. Use after implementing features, fixing bugs, or making UI changes.
user_invocable: true
---

# Comprehensive Verification System

You just made code changes. Now run a full verification — not just "does it render?" but "does it actually work end-to-end?"

This skill orchestrates a 4-phase verification process. Follow each phase in order.

## Phase 1: Scope Analysis

Determine what changed, how big the change is, and what needs testing.

### 1a. Identify changed files

Look at files you edited this conversation. List them out.

### 1b. Classify scope tier

| Tier | Criteria | AC Count |
|------|----------|----------|
| **SMALL** | 1-3 files, style-only or single component | 2-4 |
| **MEDIUM** | 4-8 files, logic + UI in one feature area | 5-10 |
| **LARGE** | 8+ files, multiple stores/types/routes, full feature | 10-20 |

### 1c. Identify affected screens

Map changed files to screens using [app-map.md](references/app-map.md):
- `app/(tabs)/games/*` → Games tab, game detail, new game
- `components/gamePage/*` → Game detail overlays
- `components/shared/*` → Shared components (box score, player averages)
- `store/*` → Data layer (verify data shows correctly on affected screens)
- `logic/*` → Business logic (verify outcomes on screens that display results)
- `types/*` → May affect multiple screens

### 1d. Derive feature name

1. Check if a doc in `docs/features/backlog/` has overlapping file paths → use that feature name (kebab-cased)
2. Otherwise: use the deepest common directory of changed files (e.g. `game-creation`)
3. Fallback: most-edited file name, kebab-cased

### 1e. Determine run number

Check `docs/test-plans/` for existing files matching today's date and feature name:
```
ls docs/test-plans/YYYY-MM-DD-<feature>-run-*.md
```
Use `max_existing + 1`, default to `1`.

### 1f. Ensure directory exists

```bash
mkdir -p docs/test-plans
```

## Phase 2: Generate Test Plan

Write the test plan to `docs/test-plans/YYYY-MM-DD-<feature>-run-<N>.md`.

Read [test-plan-guidelines.md](references/test-plan-guidelines.md) for the document template, AC writing rules, and domain-specific examples.

### Key rules for writing ACs:

- Each AC must have **numbered steps** a QA tester could follow
- **Expected outcomes must be specific and observable** — what you'd see in `inspect_view_hierarchy` or a screenshot
- **One behavior per AC** — don't test five things in one criterion
- **Cover the full flow** — don't stop at "does it render?", verify data correctness
- **Include setup steps** separately from ACs — use debug tools for state setup, never skip verification
- For LARGE scope: include E2E flow from creation through completion, data integrity across screens, export/import if affected

### AC ordering:

**Critical:** Order ACs so you complete all tests on the current flow before navigating away. Tests that check other screens or different games should come LAST. Navigating away from an active game may auto-complete it.

### Show the test plan to the user (no approval needed).

## Phase 3: Spawn Verification Agent

Spawn a background agent to execute the test plan. Use the `Agent` tool with:
- `run_in_background: true`
- `subagent_type: "general-purpose"`

### Agent prompt template

Fill in the placeholders and pass this as the agent prompt:

```
You are a QA verification agent for the StatLine basketball app running in an iOS simulator.

## Your task
Execute the test plan at {{TEST_PLAN_PATH}} and update it with results for each acceptance criterion.

## Setup
1. Read the test plan file to understand what you need to verify
2. Read these reference files for navigation and tool usage:
   - .claude/skills/verify/references/app-map.md (screen routes, testIDs, and navigation escape hatches)
   - .claude/skills/verify/references/maestro-commands.md (Maestro tool reference)
   - .claude/skills/verify/references/debug-tools.md (data setup tools)
3. Find the connected device: use list_devices, look for connected: true
4. Refresh the app: stop_app then launch_app with bundle ID com.akanel.StatLine
5. If you see the Expo dev launcher ("Development Build" or "DEVELOPMENT SERVERS"), tap "StatLine, http://localhost:8081" to open the app first.

## Executing ACs

For each acceptance criterion in order:

1. The AC steps are a GUIDE, not a script. If a step doesn't work (can't navigate, element not found, wrong screen), find another way to reach the same verification goal.
2. Use inspect_view_hierarchy BEFORE every tap_on — get the exact text/id from the hierarchy, never guess.
3. After tapping navigation elements, inspect hierarchy again to confirm you're on the right screen.
4. Compare actual results to the expected outcome.
5. Update the test plan file inline for each AC using the Edit tool:
   - Change **Status** from PENDING to PASS, FAIL, or BLOCKED
   - Fill in **Observed** with what you actually saw (one line)
   - Fill in **Agent log** with your thinking, actions taken, and conclusion

### Resilience rules — IMPORTANT

- If you hit a navigation dead end, DO NOT give up. You have options:
  - Create a fresh game with the same settings
  - Use Edit on a completed game's header to reactivate it
  - Navigate a different route to reach the same screen
  - Use debug tools to set up the needed state
  - Start the entire flow from scratch
- Only mark as **FAIL** if the FEATURE ITSELF doesn't work — never because you couldn't navigate there.
- Mark as **BLOCKED** (not FAIL) only if you exhaust all alternatives and genuinely cannot test the AC. Explain what you tried.
- Navigation issues, Maestro flakiness, and test environment problems are never valid reasons for FAIL.

## Output format per AC

Update each AC block in the test plan file to look like this:

### AC-N: [Title]
**Steps:**
1. [step]
2. [step]

**Expected:** [specific outcome]
**Status:** PASS / FAIL / BLOCKED
**Observed:** [one-line summary of what actually happened]
**Agent log:**
- Thinking: [what you planned to do and why]
- Actions: [key tool calls you made, numbered]
- [conclusion or notes about the result]

## Maestro rules
- Always inspect_view_hierarchy BEFORE tap_on or take_screenshot
- Use text or id values found from hierarchy — never guess element names
- For keyboard input: tap the field first, then input_text, then tap "return" to dismiss
- run_flow YAML must start with "appId: com.akanel.StatLine" then "---" before commands
- After navigation, inspect hierarchy to confirm before asserting

## When all ACs are done

Update the Summary section at the bottom of the test plan file:

## Summary
| AC | Title | Status |
|----|-------|--------|
| 1  | ...   | PASS   |
| 2  | ...   | FAIL   |

**Pass:** X | **Fail:** X | **Blocked:** X
```

Replace `{{TEST_PLAN_PATH}}` with the absolute path to the test plan file you created in Phase 2.

## Phase 4: Review Results & Re-run Loop

When the background agent completes (you'll be notified):

1. Read the completed test plan file
2. Report to the user:
   - Summary table (pass/fail/blocked counts)
   - Details of any failures — is it a code bug or a test issue?
   - Review agent logs for any improvement notes
3. If all PASS: verification complete — stop here
4. If any FAIL: enter the re-run loop (see below)

### Re-run Loop

When failures are found, this process repeats until all ACs pass:

1. **Fix the bug** — analyze the failure, fix the code
2. **Run `yarn lint --fix && yarn test`** — ensure unit tests still pass
3. **Assess re-run scope** based on the fix size:

| Fix size | Re-run scope |
|----------|-------------|
| **Small** (1-2 lines, single file, isolated fix) | Re-test only the failed AC(s) |
| **Medium** (logic change that could affect related behavior) | Re-test failed AC(s) + any ACs that touch the same flow |
| **Large** (store/type change, cross-cutting fix) | Re-test all ACs from scratch |

4. **Create a new test plan** with incremented run number (`run-3`, `run-4`, etc.)
   - Include only the ACs being re-tested
   - Reference the previous run for context
5. **Spawn a new verification agent** (Phase 3) with the new test plan
6. **Review results** — if still failing, loop back to step 1

This loop continues until all ACs pass. Each run produces its own test plan file as a historical record.

## Troubleshooting

- **Agent can't connect to simulator**: Ensure Metro is running (`yarn start`) and simulator is open
- **Agent stuck on Expo dev launcher**: It needs to tap "StatLine, http://localhost:8081" first
- **Flaky taps**: System dialogs and keyboard interactions can be unreliable in Maestro. Note in agent log and try alternatives.
- **Bundle ID**: `com.akanel.StatLine`
