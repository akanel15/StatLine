# 🔧 Debug & Development Tools

A comprehensive suite of debugging and development tools for the StatLine app, designed to help with testing, data management, and troubleshooting.

## 🚀 Getting Started

Access the debug tools by tapping **"🔧 Debug & Development Tools"** on the main home screen.

## 📸 Snapshots & Backups

### What it does
- **Complete state capture**: Saves all store data (teams, players, games, sets) to persistent files
- **Backup management**: Create, restore, delete, and export snapshots
- **Cross-device sharing**: Export snapshots via native share sheet

### Key Features
- **Quick Save**: One-tap backup with auto-generated name
- **Custom Snapshots**: Save with custom names and descriptions  
- **File Management**: View file sizes, timestamps, and manage storage
- **Export/Share**: Send snapshots via AirDrop, email, cloud storage
- **Restore**: Complete state restoration with confirmation dialogs

### Storage Architecture
```
/debugSnapshots/
├── 2025-08-18T15-13-21-000Z-MyBackup.json
├── 2025-08-18T14-30-45-000Z-QuickSave.json
└── registry (AsyncStorage)
```

### Typical Workflow
1. **Before Testing**: Create snapshot of current state
2. **Load Test Data**: Use seed data or restore different snapshot  
3. **Test Features**: Make changes without worry
4. **Restore**: Get back to original state instantly

## 🌱 Seed Data

### What it does
Pre-built datasets for consistent testing across different scenarios.

### Available Seeds

#### **Minimal Test Data** 🌱
- 1 team (Warriors)
- 5 players with basic stats
- 1 active game 
- 2 sets (Starting Five, Bench)
- **Use for**: Basic feature testing, quick setup

#### **Full Season Data** 🏀  
- 2 teams (Warriors, Lakers)
- 30 players total (15 per team)
- 10 games (mix of finished/active)
- Multiple sets per team
- Realistic stats and relationships
- **Use for**: Performance testing, UI stress testing

#### **Edge Cases & Validation Test** ⚠️
- Intentionally broken data
- Orphaned records (players without teams)
- Negative stats, invalid references
- Mismatched game counts
- **Use for**: Testing validation logic, error handling

### Usage Tips
- Always create a snapshot before loading seed data
- Use minimal data for daily development
- Use full season data to test performance with realistic volumes
- Use edge cases to verify your validation and error handling

## 🔍 Data Validation & Inspector

### What it does
Comprehensive data integrity checking with automatic fixing capabilities.

### Validation Categories

#### **Global Issues**
- Game count mismatches (integrates your existing game count audit)
- Cross-store relationship problems

#### **Teams** 🏀
- Missing names
- Negative game numbers  
- Inconsistent win/loss/draw totals
- Invalid current team selection

#### **Players** 👤
- Orphaned players (team doesn't exist)
- Missing names
- Invalid jersey numbers (outside 1-99 range)
- Duplicate jersey numbers within team
- Negative stats

#### **Games** 🎮
- Orphaned games (team doesn't exist)
- Invalid active players (players don't exist)
- Score inconsistencies (period totals vs stat totals)

#### **Sets** 👥
- Orphaned sets (team doesn't exist)  
- Missing names
- Negative run counts
- Negative stats

### Health Scoring
- **80-100%**: Excellent (green)
- **60-79%**: Good with minor issues (yellow)  
- **0-59%**: Needs attention (red)

### Auto-Fix Capabilities
Many issues can be automatically fixed:
- Remove negative values → set to 0
- Clean up orphaned references  
- Recalculate inconsistent totals
- Fix game count mismatches using your existing audit logic

### Store Inspector Tab
Browse store data with health metrics and entity counts. Future versions will include detailed JSON tree inspection and manual editing.

## 🛡️ Safety & Best Practices

### Data Safety
- **All destructive actions require confirmation**
- **Snapshots are your safety net** - use them liberally
- **Auto-fixes are reversible** via snapshot restoration
- **Export important snapshots** for backup

### Development Workflow
```
1. Snapshot current state
2. Load test data OR make changes  
3. Test features
4. Run validation to check data health
5. Fix issues or restore from snapshot
6. Repeat
```

### Production Considerations
- Debug routes can be stripped from release builds
- All debug data stored separately from production data
- No impact on app performance when not in use

## 🔧 Technical Details

### File Storage
- **Snapshots**: `FileSystem.documentDirectory/debugSnapshots/`
- **Registry**: AsyncStorage key `debug_snapshot_registry`
- **Format**: JSON with metadata and versioning

### Data Integrity
- **Version compatibility** checking
- **File existence validation**
- **Automatic registry cleanup** for missing files
- **Transaction-safe** store operations

### Performance
- **Lazy loading**: Validation runs on-demand
- **Efficient file I/O**: Only reads what's needed
- **Memory conscious**: Large files handled in chunks
- **Background operations**: Non-blocking UI

## 🚨 Troubleshooting

### Common Issues

**"Snapshot failed to save"**  
- Check device storage space
- Restart app and try again

**"Validation shows many issues"**
- Try loading the "Edge Cases" seed data first - it's designed to show validation in action
- Use "Fix All" button for auto-repairable issues

**"Export not working"**
- Ensure sharing permissions are enabled
- Try different export target (AirDrop, Files, etc.)

**"Performance slow with large datasets"**  
- Use "Minimal" seed data for daily development
- Consider creating focused snapshots with less data

### Getting Help
- Check the validation screen for specific error messages
- Use snapshots to restore to known good states
- Export problematic snapshots for debugging

## 🎯 Development Integration

### Using in Your Development Process

**Feature Development**
```
1. Create snapshot: "Before [feature] work"  
2. Load minimal test data
3. Develop feature
4. Test with full season data  
5. Validate data integrity
6. Create snapshot: "After [feature] complete"
```

**Bug Investigation**  
```
1. Export current state snapshot
2. Load edge cases seed data
3. Reproduce bug scenario
4. Use validation to identify data issues
5. Fix and verify
6. Restore original state
```

**Testing Cycles**
```
1. Load consistent seed data
2. Run test scenarios  
3. Validate results
4. Reset to clean state
5. Repeat with different seed data
```

This debug system gives you professional-grade development tools within your basketball app! 🏀
