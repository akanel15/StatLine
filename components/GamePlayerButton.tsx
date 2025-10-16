import { theme } from "@/theme";
import { StyleSheet, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { PlayerType } from "@/types/player";
import { getPlayerDisplayName } from "@/utils/displayHelpers";

type Props = {
  player?: PlayerType;
  playerId?: string; // Add playerId as optional prop for fallback lookup
  onPress: () => void;
  opponentName?: string;
  size?: "normal" | "large";
};

export function GamePlayerButton({
  player,
  playerId,
  onPress,
  opponentName,
  size = "normal",
}: Props) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const playerNumber = player?.number;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        size === "large" ? styles.buttonLarge : styles.button,
        {
          backgroundColor: opponentName ? theme.colorOnyx : theme.colorLightGrey,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        style={[styles.text, { color: opponentName ? theme.colorWhite : theme.colorBlack }]}
      >
        {opponentName
          ? "Opponent"
          : playerNumber
            ? `#${playerNumber}\n${player?.name || (playerId ? getPlayerDisplayName(playerId) : "Unknown Player")}`
            : player?.name || (playerId ? getPlayerDisplayName(playerId) : "Unknown Player")}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 18,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    justifyContent: "center",
    height: 80,
    width: 120,
    marginVertical: 2,
    backgroundColor: theme.colorLightGrey,
  },
  buttonLarge: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    justifyContent: "center",
    height: 100,
    width: 120,
    marginVertical: 2,
    backgroundColor: theme.colorLightGrey,
  },
  buttonPressed: {
    backgroundColor: theme.colorOrangePeel,
  },
});
