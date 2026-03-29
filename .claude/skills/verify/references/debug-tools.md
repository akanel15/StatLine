# Debug Tools Reference

Navigate: Home → Settings (gear icon) → "Debug Tools" → Debug Home

---

## Team Setup (`/debug/teamSetup`)

Create teams with players and sets quickly.

### Quick Setup
- **testID**: `debug-quick-setup`
- Creates "Vikes Div 1 Men" with 10 players and 3 sets in one tap
- After creation, can navigate to view the team

### Demo Teams
- **testID**: `debug-demo-teams`
- Creates 6 teams with ~37 total players for App Store screenshots
- Only available in `__DEV__` mode

### Custom Team
- **testIDs**: `debug-custom-team-name`, `debug-custom-players`, `debug-custom-create`
- Enter team name + players (format: "Name Number" per line) + optional sets
- Creates team, adds all players, creates sets

---

## Game Simulator (`/debug/gameSimulator`)

Simulate finished games with full box scores and play-by-play.

### Inputs
| Field | testID | Default |
|-------|--------|---------|
| Team selection | `debug-sim-team-{id}` | Current team |
| Opponent name | `debug-sim-opponent` | "Opponent" |
| Our score min/max | `debug-sim-our-min` / `debug-sim-our-max` | 80–100 |
| Opp score min/max | `debug-sim-opp-min` / `debug-sim-opp-max` | 70–95 |
| Period type | `debug-sim-quarters` / `debug-sim-halves` | Quarters |
| Game count | `debug-sim-count` | 1 (max 20) |
| Start button | `debug-sim-start` | — |

### Output
Finished games with complete box scores, play-by-play, and updated team/player records.

### Known Limitations (critical for verification)
- **No fouls generated** — personal fouls are never recorded
- **Steals/blocks/turnovers are rare** — ~15% chance per possession, our team only
- **Opponent stats limited** — only points + FG attempts (no rebounds/assists/steals/blocks)
- **Rebounds** — only tracked on our team's misses
- **Assists** — only for our team (30% on 2PT, 20% on 3PT)
- **Free throws** — always come in pairs
- **No +/- tracking**

---

## Seed Data (`/debug/seedData`)

Load pre-built datasets that **replace all current data**.

| Scenario | testID | Contents |
|----------|--------|----------|
| Minimal | `debug-seed-minimal` | 1 team, 5 players, 1 game, 2 sets |
| Full Season | `debug-seed-fullSeason` | 2 teams, 30 players, 10 games with realistic stats |
| Edge Cases | `debug-seed-edgeCases` | Intentionally broken data (negative stats, orphaned refs, wrong team IDs) |

**Warning**: Loading seed data destroys all existing data. Create a snapshot first if needed.

---

## Snapshots (`/debug/snapshots`)

Save and restore complete app state.

- **Quick Save** — one-tap snapshot of current state
- **Named Save** — snapshot with custom name and description
- **Load** — restore a saved snapshot (replaces current data)
- **Export** — share snapshot as a file
- **Delete** — remove saved snapshots

---

## Data Validation (`/debug/validation`)

Health check across all 4 stores (teams, players, games, sets).

- **Detects**: orphaned references, negative values, missing names, data inconsistencies
- **Auto-fix button**: repairs fixable issues automatically
- **Health score**: percentage per store

---

## Game Count Audit (`/debug` — original route)

Audits team/player game counts vs actual finished games.

- Accessible via the root `/debug` route (separate from `/debug/home`)
- Shows mismatches between recorded counts and ground truth
- Correction tool to recalculate from actual game data

---

## Reset Help Hints (Quick Action on Debug Home)

Resets first-time user help hints so they appear again. Available as a quick action button at the bottom of Debug Home.
