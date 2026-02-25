import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatLineButton } from "@/components/StatLineButton";
import { GameStatButton } from "@/components/GameStatButton";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import {
  ActionType,
  DefensiveStat,
  FoulTurnoverStat,
  ReboundAssistStat,
  ShootingStatMake,
  ShootingStatMiss,
} from "@/types/stats";

type StatOverlayProps = {
  onClose: () => void;
  onStatPress: (category: ActionType, action: string) => void;
  playerLabel?: string;
};

// Wrapped with memo to prevent unnecessary re-renders when parent state changes
const StatOverlay = memo(function StatOverlay({
  onClose,
  onStatPress,
  playerLabel,
}: StatOverlayProps) {
  return (
    <View style={styles.container}>
      {playerLabel ? (
        <>
          <Text style={styles.playerLabel}>{playerLabel}</Text>
          <View style={styles.playerLabelDivider} />
        </>
      ) : null}
      <Text style={styles.heading}>Shooting</Text>
      <View style={styles.rowContainer}>
        {Object.values(ShootingStatMake).map(action => (
          <GameStatButton
            key={action}
            title={action}
            onPress={() => onStatPress(ActionType.ShootingMake, action)}
            backgroundColor={theme.colorMindaroGreen}
          />
        ))}
      </View>
      <View style={styles.rowContainer}>
        {Object.values(ShootingStatMiss).map(action => (
          <GameStatButton
            key={action}
            title={action}
            onPress={() => onStatPress(ActionType.ShootingMiss, action)}
            backgroundColor={theme.colorRedCrayola}
          />
        ))}
      </View>

      <Text style={styles.heading}>Assists + Rebs</Text>
      <View style={styles.rowContainer}>
        {Object.values(ReboundAssistStat).map(action => (
          <GameStatButton
            key={action}
            title={action}
            onPress={() => onStatPress(ActionType.ReboundAssist, action)}
            backgroundColor={theme.colorMayaBlue}
          />
        ))}
      </View>

      <Text style={styles.heading}>Defence</Text>
      <View style={styles.rowContainer}>
        {Object.values(DefensiveStat).map(action => (
          <GameStatButton
            key={action}
            title={action}
            onPress={() => onStatPress(ActionType.DefensivePlay, action)}
          />
        ))}
      </View>

      <Text style={styles.heading}>Fouls + TOs</Text>
      <View style={styles.rowContainer}>
        {Object.values(FoulTurnoverStat).map(action => (
          <GameStatButton
            key={action}
            title={action}
            onPress={() => onStatPress(ActionType.FoulTurnover, action)}
          />
        ))}
      </View>

      <View style={styles.closeButtonContainer}>
        <StatLineButton onPress={onClose} title="Close" />
      </View>
    </View>
  );
});

export default StatOverlay;

const styles = StyleSheet.create({
  container: {},
  playerLabel: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    textAlign: "center",
    color: theme.colorOrangePeel,
    marginBottom: scale(4),
  },
  playerLabelDivider: {
    height: 1,
    backgroundColor: theme.colorLightGrey,
    marginHorizontal: scale(40),
    marginBottom: scale(6),
  },
  heading: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: scale(4),
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(6),
    marginBottom: scale(4),
    flexWrap: "wrap",
  },
  closeButtonContainer: {
    marginTop: scale(8),
  },
});
