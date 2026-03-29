---
name: verify
description: Verify your recent code changes in the running iOS simulator using Maestro MCP. Use this skill after making UI changes, fixing bugs, or adding features to confirm they work correctly in the app. Trigger when the user says "verify", "check the app", "does it look right", "test it", "screenshot", or any request to visually confirm work. Also proactively suggest using this after significant UI changes.
user_invocable: true
---

# Verify Changes in the Running App

You just made code changes. Now verify they work in the running simulator.

## Decision Flow

1. **What changed?** Look at files you edited this conversation → determine affected screen(s).
2. **Where is it?** Use [app-map.md](references/app-map.md) to find the navigation path.
3. **Need test data?** Use [debug-tools.md](references/debug-tools.md) to set up data via debug menu.
4. **Which tool?** Pick the right verification approach (see below).
5. **Report** — concise verdict: where, what, pass/fail.

## Three Modes

### Mode 1: Verify Recent Changes (default)
Navigate to the affected screen, check the change, report back.

### Mode 2: Set Up Test Data
Use the debug menu to create teams, simulate games, or load seed data before verifying. Navigate: Home → Settings (gear icon) → "Debug Tools" → Debug Home → pick tool.

### Mode 3: End-to-End Flow
Walk through a full user flow (e.g., create team → add players → start game → record stats → check box score).

## Tool Selection

| Tool | When to use |
|------|-------------|
| `inspect_view_hierarchy` | **Default.** Check element existence, text content, enabled/disabled state, data display. Fast. |
| `take_screenshot` | Layout/spacing, colors/styling, complex UI (tables, overlays), or user asks to "see" something. |
| `tap_on` | Navigate to screens, test button interactions. Use `text:` or `id:` (testID). |
| `input_text` | Type into focused input fields. |
| `run_flow` | Chain multiple steps, assertions (`assertVisible`), scrolling, waiting. |
| `back` | Go back one screen. |

See [maestro-commands.md](references/maestro-commands.md) for full tool reference.

## Verification by Change Type

**UI/layout** → Navigate, `take_screenshot`, visually evaluate
**Data display** → Navigate, `inspect_view_hierarchy`, check text values
**New button/interaction** → `inspect_view_hierarchy` to confirm exists, `tap_on` to test, verify result
**Bug fix** → Reproduce the scenario, verify expected behavior
**New screen/flow** → Navigate there, screenshot + hierarchy check

## Reporting

Keep it short:
- **Where**: Which screen
- **What**: What you checked
- **Result**: Pass/fail with specifics
- **Screenshot**: Include if relevant, skip if hierarchy was sufficient

## Troubleshooting

- **Can't connect**: No simulator running. Tell user to run `yarn ios`.
- **Wrong screen**: `take_screenshot` first to orient, then navigate.
- **Element not found**: App may need reload. Tell user to press `r` in Metro terminal.
- **Bundle ID**: `com.akanel.StatLine`
- **Device ID**: Use `list_devices`, look for `connected: true`.
