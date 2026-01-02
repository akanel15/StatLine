import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "@/theme";
import { PeriodType } from "@/types/game";
import Ionicons from "@expo/vector-icons/Ionicons";
import { RenderItemParams } from "react-native-draggable-flatlist";

interface DraggablePeriodDividerProps {
  periodIndex: number;
  periodType: PeriodType;
  drag: RenderItemParams<unknown>["drag"];
  isActive: boolean;
  isDraggable?: boolean; // Whether this divider can be dragged (Q1 cannot)
}

export default function DraggablePeriodDivider({
  periodIndex,
  periodType,
  drag,
  isActive,
  isDraggable = true,
}: DraggablePeriodDividerProps) {
  const getPeriodLabel = () => {
    if (periodIndex + 1 <= periodType) {
      // Regular periods
      if (periodType === PeriodType.Quarters) {
        return `Q${periodIndex + 1}`;
      } else {
        return `Half ${periodIndex + 1}`;
      }
    } else {
      // Overtime
      return `OT${periodIndex + 1 - periodType}`;
    }
  };

  return (
    <TouchableOpacity
      onLongPress={isDraggable ? drag : undefined}
      disabled={isActive || !isDraggable}
      activeOpacity={isDraggable ? 0.7 : 1.0}
      style={[styles.container, isActive && styles.activeContainer]}
    >
      <View style={styles.labelContainer}>
        {/* Drag Handle - only visible for draggable dividers */}
        {isDraggable && (
          <View style={[styles.dragHandle, !isActive && styles.dragHandleInactive]}>
            <Ionicons name="reorder-three-outline" size={16} color={theme.colorGrey} />
          </View>
        )}
        <Text style={styles.periodLabel}>{getPeriodLabel()}</Text>
      </View>

      {/* Divider Line */}
      <View style={styles.dividerLine} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colorLightGrey,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
    width: "100%",
  },
  activeContainer: {
    transform: [{ scale: 1.02 }],
    shadowColor: theme.colorOnyx,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  dragHandle: {
    padding: 2,
    opacity: 1.0,
  },
  dragHandleInactive: {
    opacity: 0.4,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colorOnyx,
    textAlign: "center",
  },
  dividerLine: {
    height: 2,
    backgroundColor: theme.colorOrangePeel,
  },
});
