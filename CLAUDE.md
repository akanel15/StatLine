# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `yarn start` - Start Expo development server
- `yarn ios` - Run on iOS simulator
- `yarn android` - Run on Android emulator
- `yarn web` - Run in web browser

### Testing & Quality
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn test:ci` - Run tests in CI mode with coverage
- `yarn lint` - Check code style
- `yarn lint --fix` - Fix linting issues automatically

**Before marking changes complete:** Always run `yarn lint --fix && yarn test`

### Test Execution
- Run single test file: `yarn test path/to/test.ts`
- Run tests matching pattern: `yarn test --testNamePattern="pattern"`
- Debug tests: `yarn test --detectOpenHandles`

## Architecture

### Core Stack
- **Framework:** React Native with Expo (SDK 54)
- **Navigation:** Expo Router (file-based routing)
- **State Management:** Zustand with AsyncStorage persistence
- **TypeScript:** Strict mode enabled with path aliases (@/)
- **Testing:** Jest + Testing Library with coverage thresholds (80% global, 95% logic)
- **Package Manager:** Yarn exclusively (never npm/pnpm)

### Data Architecture

#### Type System
- `types/game.ts` - Game management with periods, box scores, play-by-play
- `types/player.ts` - Player profiles and identifiers
- `types/team.ts` - Team configuration and statistics
- `types/stats.ts` - Basketball statistics tracking (points, rebounds, assists, etc.)
- `types/set.ts` - Set/lineup management

#### State Stores (Zustand)
- `teamStore.ts` - Team CRUD, current team selection, cascading deletes
- `playerStore.ts` - Player management linked to teams
- `gameStore.ts` - Game state, scoring, play-by-play tracking
- `setStore.ts` - Lineup/set configurations

All stores use AsyncStorage persistence and support image storage via Expo FileSystem.

### Navigation Structure
```
app/
├── (tabs)/              # Tab-based navigation
│   ├── [teamId]/        # Dynamic team routes
│   ├── games/           # Game management
│   ├── players/         # Player management
│   └── sets/            # Set/lineup management
├── index.tsx            # Entry point
├── newTeam.tsx         # Team creation
└── debug.tsx           # Debug utilities
```

### Key Patterns

#### Theme Usage
All colors must be imported from `theme.ts`:
```typescript
import { theme } from '@/theme';
// Use: theme.colorOrangePeel, theme.colorOnyx, etc.
```

#### Image Handling
Images are copied to DocumentDirectory for persistence:
```typescript
const savedImageUri = FileSystem.documentDirectory + `${timestamp}-${filename}`;
await FileSystem.copyAsync({ from: imageUri, to: savedImageUri });
```

#### Testing Requirements
- Business logic (`logic/`): 95% coverage required
- State stores (`store/`): 85% coverage required
- UI components/screens: Integration tests preferred
- Mock files in `__mocks__/` for external dependencies

## Development Rules

From WARP.md:
1. **Testing First** - Add tests alongside features, use Jest + Testing Library
2. **Theme Colors** - Use only exported theme colors, no hard-coded values
3. **Package Management** - Use `yarn` exclusively
4. **Quality Gates** - Run `yarn lint --fix && yarn test` before completing work
5. **Code Standards** - TypeScript, functional components only
6. **Git Management** - Let user handle commits and pushes

## Basketball Domain Model

### Game Flow
1. Create team → Add players → Create optional sets (lineups)
2. Start game → Select active players/sets → Choose period type (halves/quarters)
3. Track stats in real-time with play-by-play
4. View box scores and period breakdowns
5. Export game data

### Stat Categories
Points, rebounds, assists, steals, blocks, turnovers, fouls, plus various shooting percentages tracked per player and team.

## iOS Build & Deployment

### Build Environment Management
**CRITICAL:** iOS folder is completely disposable and should be regenerated for clean builds.

**Clean Build Process:**
```bash
# Kill all running processes
pkill -f expo; pkill -f metro; pkill -f xcodebuild; pkill -f yarn

# Clean all caches and artifacts
rm -rf ~/Library/Developer/Xcode/DerivedData/*
yarn cache clean
rm -rf ios/build
rm -rf ios

# Regenerate iOS project cleanly
npx expo prebuild --platform ios
```

### Key Configuration Files
- **app.json**: `"newArchEnabled": true` - New Architecture enabled for React Native 0.81+ compatibility
- **ios/Podfile.properties.json**: Generated deployment config (iOS 15.1+, Hermes enabled)
- **plugins/fix-hermes-warning.js**: Expo plugin fixes Hermes build phase outputPaths during prebuild

### Xcode Development Builds
1. Open `ios/baskItball.xcworkspace` (never .xcodeproj)
2. Select physical device as destination
3. Configure code signing with Apple Developer account
4. Build directly from Xcode for device testing

### Bundle Identifier
- **Current**: `com.akanel.StatLine`
- **Location**: app.json → ios.bundleIdentifier

### Common Issues & Solutions
- **New Architecture**: Enabled by default for SDK 54+ compatibility with react-native-screens 4.x and react-native-reanimated 4.x
- **Hermes PhaseScriptExecution Error**: Run `node scripts/fix-hermes-build-phase.js` after pod install
- **Internal Inconsistency Errors**: Usually resolved by `cd ios && pod install` after cleaning
- **Build Database Lock**: Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData/*`
- **CocoaPods Issues**: Regenerate iOS folder instead of manual pod fixes
- **expo-dev-menu Warnings**: Configuration conflicts - non-breaking, can be ignored

### Build Commands
- `yarn ios` - Run on iOS simulator (for development only)
- `npx expo run:ios` - Run with fresh build (preferred)
- **For Production**: Use Xcode directly with .xcworkspace file