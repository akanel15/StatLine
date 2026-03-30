# App Navigation Map

## Screen Tree

```
Home (Select Team)                        testID: —
├── Settings                              tap: gear icon (headerLeft)
│   └── Debug Tools                       tap: "Debug Tools" text
│       └── Debug Home                    route: /debug/home
│           ├── Team Setup                testID: debug-teamSetup
│           ├── Snapshots & Backups       testID: debug-snapshots
│           ├── Seed Data                 testID: debug-seedData
│           ├── Data Validation           testID: debug-validation
│           └── Game Simulator            testID: debug-simulation
├── New Team                              testID: new-team-button (headerRight "+")
└── [Team] (tabs)                         tap: team card text or testID: team-card-{id}
    ├── Tab: Team Info                    testID: tab-team (default after selecting team)
    │   └── Edit Team                     tap: "Edit" header button
    ├── Tab: Players                      testID: tab-players
    │   ├── Player Detail                 testID: player-card-{id}
    │   │   └── Edit Player              tap: "Edit" header button
    │   └── New Player                   testID: add-player-button (headerRight "+")
    ├── Tab: Sets                         testID: tab-sets
    │   ├── Set Detail                    tap: set card
    │   └── New Set                      tap: "+" header button
    └── Tab: Games                        testID: tab-games
        ├── Game Detail (active)          testID: game-card-{id}
        │   ├── Stat Overlay             tap: testID game-player-{id}
        │   ├── Substitution Overlay     testID: sub-players-button
        │   └── Box Score Overlay        testID: box-score-button
        ├── Game Detail (finished)        testID: game-card-{id}
        │   ├── Box Score tab            testID: tab-box-score (default)
        │   └── Play-by-Play tab         testID: tab-play-by-play
        └── New Game                      testID: new-game-button (headerRight "+")
```

## Quick Navigation Recipes

**Home → Debug Home:**
```
tap_on text: gear icon (settings)  →  tap_on text: "Debug Tools"
```

**Home → Team's Players tab:**
```
tap_on text: "{TeamName}"  →  tap_on id: "tab-players"
```

**Home → New Player:**
```
tap_on text: "{TeamName}"  →  tap_on id: "tab-players"  →  tap_on id: "add-player-button"
```

**Home → Games tab:**
```
tap_on text: "{TeamName}"  →  tap_on id: "tab-games"
```

**Home → New Game:**
```
tap_on text: "{TeamName}"  →  tap_on id: "tab-games"  →  tap_on id: "new-game-button"
```

**Home → Active Game:**
```
tap_on text: "{TeamName}"  →  tap_on id: "tab-games"  →  tap_on text: "vs {Opponent}"
```

**Home → Team Setup (debug):**
```
tap_on text: settings gear  →  tap_on text: "Debug Tools"  →  tap_on id: "debug-teamSetup"
```

**Home → Game Simulator (debug):**
```
tap_on text: settings gear  →  tap_on text: "Debug Tools"  →  tap_on id: "debug-simulation"
```

## Key testIDs Reference

| Screen | testIDs |
|--------|---------|
| Home | `new-team-button`, `team-card-{id}` |
| New Team | `team-name-input`, `create-team-button`, `team-logo-picker`, `toggle-default-logos`, `logo-option-{name}` |
| Tab Bar | `tab-team`, `tab-players`, `tab-sets`, `tab-games` |
| Players | `add-player-button`, `player-card-{id}` |
| New Player | `player-name-input`, `jersey-number-input`, `create-player-button` |
| Games | `new-game-button`, `game-card-{id}` |
| New Game | `opponent-name-input`, `period-type-quarters`, `period-type-halves`, `create-game-button` |
| Active Game | `game-player-{id}`, `game-player-opponent`, `sub-players-button`, `box-score-button`, `toggle-sets`, `set-{id}`, `reset-set` |
| Stat Overlay | `stat-make-{action}`, `stat-miss-{action}`, `stat-{action}`, `close-stat-overlay` |
| Finished Game | `tab-box-score`, `tab-play-by-play` |
| Debug Home | `debug-teamSetup`, `debug-snapshots`, `debug-seedData`, `debug-validation`, `debug-simulation` |
| Team Setup | `debug-quick-setup`, `debug-demo-teams`, `debug-custom-team-name`, `debug-custom-players`, `debug-custom-create` |
| Game Simulator | `debug-sim-team-{id}`, `debug-sim-opponent`, `debug-sim-our-min`, `debug-sim-our-max`, `debug-sim-opp-min`, `debug-sim-opp-max`, `debug-sim-quarters`, `debug-sim-halves`, `debug-sim-count`, `debug-sim-start` |
| Seed Data | `debug-seed-minimal`, `debug-seed-fullSeason`, `debug-seed-edgeCases` |

## Navigation Escape Hatches

- **Reactivate completed game:** On finished game screen, tap Edit in header → game returns to active state with full game UI (stat overlay, subs, play-by-play)
- **Auto-completion warning:** Navigating away from an active game may auto-complete it via AppState/Navigation completion triggers. Finish all testing on an active game before navigating away.
- **Fresh start:** From any screen, navigate back to Select Team and create a new game with the same settings
- **New game shortcut:** On Games tab, tap + to create a new game at any time
- **Game list access:** Back button from game detail returns to Games list, back from Games list returns to team page
