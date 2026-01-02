import { Animated, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useRef, useEffect, memo } from "react";
import DraggablePeriodDivider from "./DraggablePeriodDivider";
import { PeriodType } from "@/types/game";
import { RenderItemParams } from "react-native-draggable-flatlist";
import { theme } from "@/theme";
import * as Haptics from "expo-haptics";

interface SwipeablePeriodDividerProps {
  periodIndex: number;
  periodType: PeriodType;
  drag: RenderItemParams<unknown>["drag"];
  isActive: boolean;
  isDraggable: boolean;
  onDelete?: () => void; // Called when period is swiped to delete
  disabled?: boolean; // Disable swipe during drag cooldown
}

function SwipeablePeriodDivider({
  periodIndex,
  periodType,
  drag,
  isActive,
  isDraggable,
  onDelete,
  disabled = false,
}: SwipeablePeriodDividerProps) {
  const swipeableRef = useRef<Swipeable>(null);

  // Q1 (index 0) cannot be deleted
  const canDelete = periodIndex !== 0 && onDelete !== undefined;

  // Close swipeable when drag starts or component is disabled
  useEffect(() => {
    if (isActive || disabled) {
      swipeableRef.current?.close();
    }
  }, [isActive, disabled]);

  const handleDelete = () => {
    // Haptic feedback for deletion
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.log("Haptics not available:", error);
    }
    swipeableRef.current?.close();
    onDelete?.();
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const trans = dragX.interpolate({
      inputRange: [-120, 0],
      outputRange: [0, 120],
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
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Period</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // If period cannot be deleted, render without swipeable wrapper
  if (!canDelete) {
    return (
      <DraggablePeriodDivider
        periodIndex={periodIndex}
        periodType={periodType}
        drag={drag}
        isActive={isActive}
        isDraggable={isDraggable}
      />
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      enabled={!disabled && !isActive}
    >
      <DraggablePeriodDivider
        periodIndex={periodIndex}
        periodType={periodType}
        drag={drag}
        isActive={isActive}
        isDraggable={isDraggable}
      />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  deleteContainer: {
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "flex-end",
    minHeight: 56,
  },
  deleteButton: {
    justifyContent: "center",
    alignItems: "center",
    width: 120,
    height: "100%",
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: theme.colorWhite,
    fontWeight: "600",
    fontSize: 14,
  },
});

export default memo(SwipeablePeriodDivider);
