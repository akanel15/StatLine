# Maestro MCP Tool Reference

## Navigation

### `tap_on`
Tap an element by text or testID.
- `tap_on text: "Players"` — tap element with visible text
- `tap_on id: "tab-players"` — tap element by testID
- Use text for labels/buttons, use id for testID-tagged elements

### `back`
Go back one screen in the navigation stack.

### `run_flow` with scroll/swipe
```yaml
- scroll          # Scroll down
- swipeUp         # Swipe up (for lists)
- swipeDown       # Swipe down
```

## Input

### `input_text`
Type text into the currently focused field.
- First tap the input field, then use `input_text`
- Example: `tap_on id: "player-name-input"` → `input_text text: "John Smith"`

## Verification

### `inspect_view_hierarchy`
Returns CSV of all UI elements on screen: text, testIDs, bounds, enabled/clickable state.
- **Fastest** verification method
- Use for: confirming elements exist, checking text content, verifying enabled/disabled state
- Returns structured data — parse to find specific elements

### `take_screenshot`
Returns an inline image of the current screen.
- Use for: layout checks, visual styling, complex UI evaluation
- Slower than hierarchy inspection
- Best when you need to "see" the overall result

## Assertions (via `run_flow`)

Use `run_flow` with YAML to run assertion commands:

```yaml
- assertVisible: "Player Name"           # Assert text is visible
- assertVisible:
    id: "tab-players"                    # Assert testID is visible
- assertNotVisible: "Error"              # Assert text is NOT visible
- waitForAnimationToEnd                  # Wait for animations
- wait: 2000                             # Wait N milliseconds
```

## App Lifecycle

### `launch_app`
Launch the app (bundle ID: `com.akanel.StatLine`).

### `stop_app`
Stop the running app.

### `list_devices`
List available devices. Look for `connected: true` to find the active simulator.

## Multi-Step Sequences

Use `run_flow` with a YAML block to chain multiple commands:

```yaml
- tap_on:
    id: "tab-games"
- assertVisible: "vs Lakers"
- tap_on: "vs Lakers"
- waitForAnimationToEnd
- assertVisible:
    id: "tab-box-score"
```

## Tips

- Prefer `inspect_view_hierarchy` over `take_screenshot` for speed
- Use `list_devices` once at the start to get the device ID
- After tapping navigation elements, add a brief `wait: 500` if the next check fails
- testIDs are more reliable than text matching (text can change, IDs don't)
- For scrollable lists, use `run_flow` with `- scroll` before checking off-screen elements
