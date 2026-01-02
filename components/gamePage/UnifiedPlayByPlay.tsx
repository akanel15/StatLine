import { useGameStore } from "@/store/gameStore";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import SwipeableDraggablePlayTile from "./SwipeableDraggablePlayTile";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import { getPointsForPlay } from "@/utils/basketball";
import { theme } from "@/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PlayByPlayType, Team } from "@/types/game";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
  DragEndParams,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import PeriodNavigationHeader from "./PeriodNavigationHeader";
import SwipeablePeriodDivider from "./SwipeablePeriodDivider";

// Time in ms to lock gestures after a drag completes
const DRAG_COOLDOWN_MS = 300;

type UnifiedPlayByPlayProps = {
  gameId: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
};

type PlayItem = {
  id: string;
  type: "play";
  play: PlayByPlayType;
  periodIndex: number;
  indexInPeriod: number; // Index within original period array (for deletion)
};

type DividerItem = {
  id: string;
  type: "divider";
  periodIndex: number;
};

type ListItem = PlayItem | DividerItem;

export default function UnifiedPlayByPlay({
  gameId,
  isExpanded = false,
  onToggleExpand,
}: UnifiedPlayByPlayProps) {
  const game = useGameStore(state => state.games[gameId]);
  const removePlayFromPeriod = useGameStore(state => state.removePlayFromPeriod);
  const reorderPlaysInPeriod = useGameStore(state => state.reorderPlaysInPeriod);
  const movePlayBetweenPeriods = useGameStore(state => state.movePlayBetweenPeriods);
  const createNewPeriod = useGameStore(state => state.createNewPeriod);
  const updateAllPeriods = useGameStore(state => state.updateAllPeriods);
  const deletePeriod = useGameStore(state => state.deletePeriod);

  // Period navigation state - start at last period for in-progress games
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    if (game && !game.isFinished && game.periods.length > 0) {
      return game.periods.length - 1;
    }
    return 0;
  });
  const flatListRef = useRef<FlatList>(null);

  // Drag lock to prevent gesture conflicts after drag ends
  const [isDragLocked, setIsDragLocked] = useState(false);
  const dragLockTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref to track current period for the viewable items callback
  // This avoids stale closure issues when scrolling back to Q1
  const currentPeriodRef = useRef(currentPeriod);
  currentPeriodRef.current = currentPeriod;

  // Track viewable items to auto-update header when scrolling
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems || viewableItems.length === 0) return;

    const topItem = viewableItems[0]?.item;
    if (!topItem) return;

    let newPeriod = 0;

    if (topItem.type === "divider") {
      newPeriod = topItem.periodIndex;
    } else if (topItem.type === "play") {
      newPeriod = topItem.periodIndex;
    }

    // Use ref to get current value, avoiding stale closure
    if (newPeriod !== currentPeriodRef.current) {
      setCurrentPeriod(newPeriod);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10, // Item is "visible" when 10% on screen
    waitForInteraction: false, // Update even when not interacting
  }).current;

  // Flatten all periods into single array with dividers
  // Uses stable IDs based on database position (periodIndex-indexInPeriod) to prevent
  // rendering glitches when items are reordered
  const listItems = useMemo<ListItem[]>(() => {
    if (!game?.periods) return [];

    const items: ListItem[] = [];

    // Iterate through periods in chronological order (Q1 → Q2 → Q3 → Q4)
    game.periods.forEach((period, periodIndex) => {
      // Add divider at start of each period (including Q1 for consistent detection)
      items.push({
        id: `divider-${periodIndex}`,
        type: "divider",
        periodIndex,
      });

      // Add plays for this period
      if (!period || !period.playByPlay || !Array.isArray(period.playByPlay)) {
        return;
      }

      // Plays are stored newest-first (unshift), so reverse to get chronological order
      const chronologicalPlays = period.playByPlay.slice().reverse();

      chronologicalPlays.forEach((play, displayIndex) => {
        // Map display index back to original database index
        const dbIndex = period.playByPlay.length - 1 - displayIndex;
        items.push({
          // Use play's own unique ID for stable rendering during drag operations
          id: play.id,
          type: "play",
          play,
          periodIndex,
          indexInPeriod: dbIndex,
        });
      });
    });

    return items;
  }, [game?.periods]);

  // One-time scroll to end for in-progress games
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (
      !hasScrolledRef.current &&
      game &&
      !game.isFinished &&
      listItems.length > 0 &&
      flatListRef.current
    ) {
      // Small delay for layout to complete (initialNumToRender ensures all items are measured)
      const timeout = setTimeout(() => {
        try {
          (flatListRef.current as any).scrollToEnd({ animated: false });
          setCurrentPeriod(game.periods.length - 1);
          hasScrolledRef.current = true;
        } catch (error) {
          console.warn("Initial scroll failed:", error);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [game, listItems.length]);

  // Pre-calculate cumulative scores for all plays (optimized with useMemo)
  // This runs once when listItems changes, instead of recalculating on every render
  const scoresMap = useMemo(() => {
    const scores = new Map<string, { teamScore: number; opponentScore: number }>();
    let teamScore = 0;
    let opponentScore = 0;

    // Calculate cumulative scores in chronological order (skip dividers)
    listItems.forEach(item => {
      if (item.type === "play") {
        const points = getPointsForPlay(item.play);
        if (item.play.playerId === "Opponent") {
          opponentScore += points;
        } else {
          teamScore += points;
        }
        // Store cumulative scores for this play
        scores.set(item.id, { teamScore, opponentScore });
      }
    });

    return scores;
  }, [listItems]);

  // Helper function to determine new period and position after drag
  const calculateNewPosition = (newData: ListItem[], dropIndex: number) => {
    const droppedItem = newData[dropIndex];
    if (droppedItem.type !== "play") {
      return { toPeriod: 0, toIndexInPeriod: 0 };
    }

    // CRITICAL FIX: Detect target period by scanning backwards for dividers
    // This determines which period ZONE the play was dropped into
    let toPeriod = 0; // Default to period 0 (Q1) if no divider found

    for (let i = dropIndex - 1; i >= 0; i--) {
      if (newData[i].type === "divider") {
        // Found a divider before the dropped play
        // The play is in this divider's period
        toPeriod = newData[i].periodIndex;
        break;
      }
    }

    // Count plays in the target period zone that come before this drop position
    let toIndexInPeriod = 0;
    let currentZonePeriod = 0; // Track which period zone we're currently scanning

    for (let i = 0; i < dropIndex; i++) {
      if (newData[i].type === "divider") {
        // Update which period zone we're in
        currentZonePeriod = newData[i].periodIndex;
      } else if (newData[i].type === "play" && currentZonePeriod === toPeriod) {
        // Count this play if we're in the target period zone
        toIndexInPeriod++;
      }
    }

    // Convert to database index (newest-first storage)
    // Count total plays that will be in target period after this drag
    let totalPlaysInTargetZone = 0;
    currentZonePeriod = 0;

    for (const item of newData) {
      if (item.type === "divider") {
        currentZonePeriod = item.periodIndex;
      } else if (item.type === "play" && currentZonePeriod === toPeriod) {
        totalPlaysInTargetZone++;
      }
    }

    const databaseIndex = totalPlaysInTargetZone - 1 - toIndexInPeriod;

    return { toPeriod, toIndexInPeriod: databaseIndex };
  };

  // Validate that a divider drop position maintains period order
  // Returns false if the divider would be placed before previous or after next divider
  const isValidDividerPosition = (
    divider: DividerItem,
    newData: ListItem[],
    dropIndex: number,
  ): boolean => {
    const periodIndex = divider.periodIndex;

    // Q1 (periodIndex 0) can never be moved
    if (periodIndex === 0) return false;

    // Find positions of adjacent dividers in the NEW data array
    let prevDividerIndex = -1;
    let nextDividerIndex = -1;

    newData.forEach((item, idx) => {
      if (item.type === "divider" && item.id !== divider.id) {
        if (item.periodIndex === periodIndex - 1) {
          prevDividerIndex = idx;
        } else if (item.periodIndex === periodIndex + 1) {
          nextDividerIndex = idx;
        }
      }
    });

    // Divider must be AFTER the previous period's divider
    if (prevDividerIndex !== -1 && dropIndex <= prevDividerIndex) {
      return false;
    }

    // Divider must be BEFORE the next period's divider
    if (nextDividerIndex !== -1 && dropIndex >= nextDividerIndex) {
      return false;
    }

    return true;
  };

  // Handle divider drag to reassign plays between periods
  const handleDividerDrag = (divider: DividerItem, newData: ListItem[], dropIndex: number) => {
    // STEP 1: Build period zone map from newData (position-based, not metadata)
    const playPeriodAssignments = new Map<string, number>();
    let currentZone = 0;

    newData.forEach(item => {
      if (item.type === "divider") {
        currentZone = item.periodIndex;
      } else if (item.type === "play") {
        playPeriodAssignments.set(item.id, currentZone);
      }
    });

    // STEP 2: Initialize new periods structure (preserve existing structure, clear plays)
    const newPeriods = game.periods.map(period => ({
      [Team.Us]: 0,
      [Team.Opponent]: 0,
      playByPlay: [] as PlayByPlayType[],
    }));

    // STEP 3: Collect plays for each period in chronological order
    const periodsPlaysChronological = newPeriods.map(() => [] as PlayByPlayType[]);

    newData.forEach(item => {
      if (item.type !== "play") return;

      const targetPeriod = playPeriodAssignments.get(item.id) || 0;
      periodsPlaysChronological[targetPeriod].push(item.play);
    });

    // STEP 4: Reverse plays to newest-first and calculate scores
    newPeriods.forEach((period, pIndex) => {
      period.playByPlay = periodsPlaysChronological[pIndex].reverse();

      // Calculate period scores
      period.playByPlay.forEach(play => {
        const points = getPointsForPlay(play);
        const team = play.playerId === "Opponent" ? Team.Opponent : Team.Us;
        period[team] += points;
      });
    });

    // STEP 5: Single atomic update to store
    updateAllPeriods(gameId, newPeriods);

    console.log(
      `Divider drag complete: Rebuilt ${newPeriods.length} periods from new play assignments`,
    );
  };

  // Engage drag lock to prevent gesture conflicts
  const engageDragLock = useCallback(() => {
    // Clear any existing timeout
    if (dragLockTimeoutRef.current) {
      clearTimeout(dragLockTimeoutRef.current);
    }
    setIsDragLocked(true);

    // Release lock after cooldown
    dragLockTimeoutRef.current = setTimeout(() => {
      setIsDragLocked(false);
      dragLockTimeoutRef.current = null;
    }, DRAG_COOLDOWN_MS);
  }, []);

  const handleDragEnd = ({ data: newData, from, to }: DragEndParams<ListItem>) => {
    // Always engage drag lock after any drag operation
    engageDragLock();

    if (from === to) return; // No movement

    const movedItem = listItems[from];

    if (movedItem.type === "divider") {
      // Validate that divider drop position maintains period order
      if (!isValidDividerPosition(movedItem, newData, to)) {
        // Invalid position - don't update state, DraggableFlatList will snap back
        return;
      }

      // Divider was dragged - reassign plays that crossed the boundary
      handleDividerDrag(movedItem, newData, to);
      return;
    }

    // Play was dragged
    const fromPeriod = movedItem.periodIndex;
    const fromIndexInPeriod = movedItem.indexInPeriod;

    // Calculate new position in database coordinates
    const { toPeriod, toIndexInPeriod } = calculateNewPosition(newData, to);

    console.log(
      `Drag: from period ${fromPeriod}[${fromIndexInPeriod}] to period ${toPeriod}[${toIndexInPeriod}] (cross-period: ${fromPeriod !== toPeriod})`,
    );

    // Note: DraggableFlatList handles animations internally, no need for LayoutAnimation

    // Update game store
    if (fromPeriod === toPeriod) {
      // Same period - reorder
      reorderPlaysInPeriod(gameId, fromPeriod, fromIndexInPeriod, toIndexInPeriod);
    } else {
      // Cross-period move
      movePlayBetweenPeriods(gameId, fromPeriod, fromIndexInPeriod, toPeriod, toIndexInPeriod);
    }
  };

  const handleDelete = (periodIndex: number, indexInPeriod: number) => {
    removePlayFromPeriod(gameId, periodIndex, indexInPeriod);
  };

  const handleDeletePeriod = (periodIndex: number) => {
    deletePeriod(gameId, periodIndex);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    // Create a wrapped drag function that respects the lock
    const safeDrag = isDragLocked ? () => {} : drag;

    if (item.type === "divider") {
      const isDraggable = item.periodIndex !== 0; // Q1 cannot be dragged

      return (
        <ScaleDecorator>
          <SwipeablePeriodDivider
            periodIndex={item.periodIndex}
            periodType={game.periodType}
            drag={isDraggable ? safeDrag : () => {}}
            isActive={isActive}
            isDraggable={isDraggable}
            onDelete={() => handleDeletePeriod(item.periodIndex)}
            disabled={isDragLocked}
          />
        </ScaleDecorator>
      );
    }

    // Render play tile
    const scores = scoresMap.get(item.id) || { teamScore: 0, opponentScore: 0 };
    const isMadeShot = item.play.action.includes("made");

    return (
      <ScaleDecorator>
        <SwipeableDraggablePlayTile
          play={item.play}
          teamScore={isMadeShot ? scores.teamScore : undefined}
          opponentScore={isMadeShot ? scores.opponentScore : undefined}
          isActive={isActive}
          drag={safeDrag}
          onDelete={() => handleDelete(item.periodIndex, item.indexInPeriod)}
          disabled={isDragLocked}
        />
      </ScaleDecorator>
    );
  };

  if (!game) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No game data available</Text>
      </View>
    );
  }

  // Check if there are any plays (not just dividers)
  const hasPlays = listItems.some(item => item.type === "play");

  if (!hasPlays) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No plays recorded yet</Text>
        <Text style={styles.emptySubtext}>Plays will appear here as the game progresses</Text>
      </View>
    );
  }

  // Scroll to a specific period
  const scrollToPeriod = (periodIndex: number) => {
    // Find the divider or first play for this period
    const targetIndex = listItems.findIndex(item => {
      if (item.type === "divider" && item.periodIndex === periodIndex) return true;
      if (item.type === "play" && item.periodIndex === periodIndex) return true;
      return false;
    });

    if (targetIndex !== -1 && flatListRef.current) {
      try {
        (flatListRef.current as any).scrollToIndex({
          index: targetIndex,
          animated: true,
          viewPosition: 0, // Scroll to top of viewport
        });
      } catch (error) {
        console.warn("Scroll to index failed:", error);
      }
    }
  };

  // Scroll to the end of the list (for new/empty periods)
  const scrollToEnd = () => {
    if (flatListRef.current) {
      try {
        (flatListRef.current as any).scrollToEnd({ animated: true });
      } catch (error) {
        console.warn("Scroll to end failed:", error);
      }
    }
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentPeriod > 0) {
      const newPeriod = currentPeriod - 1;
      setCurrentPeriod(newPeriod);
      scrollToPeriod(newPeriod);
    }
  };

  const handleNext = () => {
    const nextPeriod = currentPeriod + 1;
    const isAtLastPeriod = currentPeriod === game.periods.length - 1;
    const currentPeriodHasNoPlays = !game.periods[currentPeriod]?.playByPlay?.length;

    // Small delay to ensure store has updated (especially after divider drags)
    setTimeout(() => {
      if (game.periods[nextPeriod]) {
        // Period exists, just scroll to it
        setCurrentPeriod(nextPeriod);
        scrollToPeriod(nextPeriod);
      } else if (isAtLastPeriod && currentPeriodHasNoPlays) {
        // At last period with no plays - scroll to bottom to show the header
        scrollToEnd();
      } else {
        // Create new period
        const newPeriodIndex = createNewPeriod(gameId);
        setCurrentPeriod(newPeriodIndex);
        // Scroll to end to show the new empty period header
        setTimeout(() => scrollToEnd(), 300);
      }
    }, 100);
  };

  return (
    <GestureHandlerRootView style={[styles.container, isExpanded && styles.expandedContainer]}>
      {/* Period Navigation Header */}
      <PeriodNavigationHeader
        currentPeriod={currentPeriod}
        periodType={game.periodType}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={currentPeriod > 0}
        canGoNext={true}
      />

      {/* Draggable List */}
      <DraggableFlatList
        ref={flatListRef as any}
        data={listItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onDragEnd={handleDragEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // For in-progress games, render all items so scrollToEnd has full content measured
        initialNumToRender={game && !game.isFinished ? listItems.length : 10}
        onScrollToIndexFailed={info => {
          // Retry after a delay if scroll fails (used by period navigation)
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            (flatListRef.current as any)?.scrollToIndex({
              index: info.index,
              animated: false,
            });
          });
        }}
        containerStyle={styles.listContainer}
        contentContainerStyle={styles.listContentContainer}
        autoscrollSpeed={200}
        activationDistance={10}
      />

      {/* Floating Expand/Collapse Button */}
      {onToggleExpand && (
        <TouchableOpacity style={styles.floatingButton} onPress={onToggleExpand} hitSlop={10}>
          <Ionicons
            name={isExpanded ? "contract-outline" : "expand-outline"}
            size={22}
            color={theme.colorOrangePeel}
          />
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  expandedContainer: {
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
  },
  listContentContainer: {
    paddingBottom: 540, // Large bottom padding allows scrolling until divider is at top
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorGrey,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colorGrey,
    textAlign: "center",
  },
  floatingButton: {
    position: "absolute",
    top: 46, // Just below header (header ~40px + small gap)
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1.5,
    borderColor: theme.colorOrangePeel,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: theme.colorOnyx,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 100,
  },
});
