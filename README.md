# StatLine

Basketball stats tracking app for iOS. Track player statistics, manage teams, and generate shareable box scores in real-time.

## Features

- **Real-time game tracking** — tap to record points, rebounds, assists, steals, blocks, turnovers, fouls
- **Team & player management** — multiple teams, custom logos, player profiles with jersey numbers
- **Sets/lineups** — track play calls with per-set stats and effectiveness metrics
- **Sharing** — export games as `.statline` files, share via AirDrop/Messages, import with smart merge wizard
- **Box scores** — sortable live stats and shareable image exports
- **Player averages** — career stats across 25 categories with sortable tables
- **Offline-first** — all data stored locally, no account required

## Tech Stack

- **Framework:** React Native with Expo (SDK 54)
- **Navigation:** Expo Router (file-based routing)
- **State:** Zustand with AsyncStorage persistence
- **Language:** TypeScript (strict mode)
- **Testing:** Jest + Testing Library (80% global, 95% logic coverage)
- **Package Manager:** Yarn

## Quick Start

```bash
# Install dependencies
yarn

# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run tests
yarn test

# Lint and fix
yarn lint --fix
```

## Documentation

- [CLAUDE.md](./CLAUDE.md) — architecture, build commands, development guidelines
- [Release Notes v1.1.0](./docs/release-notes-v1.1.0.md) — current release details
- [App Store Assets](./docs/app-store/) — App Store description, keywords, subtitle
