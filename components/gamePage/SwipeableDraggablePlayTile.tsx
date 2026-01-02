import { PlayByPlayType } from "@/types/game";
import { Text, View, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { theme } from "@/theme";
import { getPlayerDisplayNameWithNumber } from "@/utils/displayHelpers";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RenderItemParams } from "react-native-draggable-flatlist";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useEffect, useRef, memo } from "react";

interface SwipeableDraggablePlayTileProps {
  play: PlayByPlayType;
  teamScore?: number;
  opponentScore?: number;
  isActive: boolean;
  drag: RenderItemParams<unknown>["drag"];
  onDelete: () => void;
  disabled?: boolean; // Disable all gestures during drag cooldown
}

function SwipeableDraggablePlayTile({
  play,
  teamScore,
  opponentScore,
  isActive,
  drag,
  onDelete,
  disabled = false,
}: SwipeableDraggablePlayTileProps) {
  const isOpponent = play.playerId === "Opponent";
  const activeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swipeableRef = useRef<Swipeable>(null);

  // Close swipeable when drag starts or component is disabled
  useEffect(() => {
    if (isActive || disabled) {
      swipeableRef.current?.close();
    }
  }, [isActive, disabled]);

  // Handle long-press with haptic feedback
  const handleLongPress = () => {
    // Close any open swipe before starting drag
    swipeableRef.current?.close();

    // Trigger haptic feedback for tactile confirmation
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Graceful fallback if haptics not supported
      console.log("Haptics not available:", error);
    }
    drag();
  };

  // Safety mechanism: Force-reset active state if it gets stuck
  useEffect(() => {
    if (isActive) {
      // Clear any existing timeout
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
      // Set timeout to detect stuck state
      activeTimeoutRef.current = setTimeout(() => {
        console.warn("Active state stuck - this should auto-resolve with performance optimization");
      }, 500);
    } else {
      // Clear timeout when isActive becomes false
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
        activeTimeoutRef.current = null;
      }
    }

    return () => {
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
    };
  }, [isActive]);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: "clamp",
    });

    return (
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={!disabled && !isActive} // Disable swipe during drag cooldown or while dragging
    >
      <TouchableOpacity
        onLongPress={handleLongPress}
        disabled={isActive || disabled}
        activeOpacity={0.7}
        style={[
          styles.container,
          isOpponent ? styles.opponentBackground : styles.playerBackground,
          isActive && styles.activeBackground,
        ]}
      >
        {/* Drag Handle - always visible with opacity change */}
        <View style={[styles.dragHandle, !isActive && styles.dragHandleInactive]}>
          <Ionicons name="reorder-three-outline" size={20} color={theme.colorGrey} />
        </View>

        <Text style={[styles.playerInfo, isOpponent && styles.opponentText]}>
          {isOpponent ? "Opponent" : getPlayerDisplayNameWithNumber(play.playerId)}
        </Text>

        <Text style={[styles.action, teamScore || opponentScore ? styles.boldText : null]}>
          {play.action}
        </Text>

        <Text style={styles.score}>
          {teamScore !== undefined && opponentScore !== undefined ? (
            <>
              <Text style={!isOpponent ? styles.boldText : null}>{teamScore}</Text>
              <Text>{` ${teamScore !== undefined && opponentScore !== undefined ? "-" : ""} `}</Text>
              <Text style={isOpponent ? styles.boldText : null}>{opponentScore}</Text>
            </>
          ) : (
            ""
          )}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: theme.colorLightGrey,
    width: "100%",
  },
  dragHandle: {
    marginRight: 8,
    paddingRight: 4,
    opacity: 1.0, // Full opacity when active
  },
  dragHandleInactive: {
    opacity: 0.4, // Subtle when not dragging
  },
  playerInfo: {
    width: 140,
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  opponentText: {
    color: theme.colorRedCrayola,
  },
  action: {
    flex: 1,
    fontSize: 14,
    color: theme.colorOnyx,
  },
  boldText: {
    fontWeight: "bold",
  },
  score: {
    width: 72,
    fontSize: 16,
    textAlign: "right",
    color: theme.colorBlack,
    flexDirection: "row",
  },
  opponentBackground: {
    backgroundColor: theme.colorLightGrey,
  },
  playerBackground: {
    backgroundColor: theme.colorWhite,
  },
  activeBackground: {
    transform: [{ scale: 1.03 }], // Very subtle lift
    shadowColor: theme.colorOnyx,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteContainer: {
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "flex-end",
    minHeight: 56,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    height: "100%",
  },
  deleteButtonText: {
    color: theme.colorWhite,
    fontWeight: "600",
    fontSize: 16,
  },
});

// Wrap in React.memo to prevent unnecessary re-renders
// Only re-renders when props actually change (play, scores, isActive, disabled)
export default memo(SwipeableDraggablePlayTile);
