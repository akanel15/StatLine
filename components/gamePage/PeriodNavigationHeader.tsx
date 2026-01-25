import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { theme } from "@/theme";
import { PeriodType } from "@/types/game";
import Feather from "@expo/vector-icons/Feather";
import { scale, moderateScale } from "@/utils/responsive";

interface PeriodNavigationHeaderProps {
  currentPeriod: number; // 0-indexed
  periodType: PeriodType;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean; // Always true typically
}

export default function PeriodNavigationHeader({
  currentPeriod,
  periodType,
  onPrevious,
  onNext,
  canGoPrevious,
}: PeriodNavigationHeaderProps) {
  const getPeriodLabel = () => {
    if (currentPeriod + 1 <= periodType) {
      // Regular periods
      if (periodType === PeriodType.Quarters) {
        return `Q${currentPeriod + 1}`;
      } else {
        return `Half ${currentPeriod + 1}`;
      }
    } else {
      // Overtime
      return `OT${currentPeriod + 1 - periodType}`;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onPrevious}
        disabled={!canGoPrevious}
        hitSlop={20}
        style={styles.navButton}
      >
        <Feather
          name="chevron-left"
          size={20}
          color={canGoPrevious ? theme.colorBlue : theme.colorGrey}
        />
        <Text style={[styles.buttonText, !canGoPrevious && styles.buttonTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <Text style={styles.heading}>{getPeriodLabel()}</Text>

      <TouchableOpacity onPress={onNext} hitSlop={20} style={styles.navButton}>
        <Text style={styles.buttonText}>Next</Text>
        <Feather name="chevron-right" size={20} color={theme.colorBlue} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    backgroundColor: theme.colorWhite,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  heading: {
    fontSize: moderateScale(18),
    fontWeight: "700",
    color: theme.colorOnyx,
    textAlign: "center",
    minWidth: scale(60),
  },
  buttonText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: theme.colorBlue,
  },
  buttonTextDisabled: {
    color: theme.colorGrey,
  },
});
