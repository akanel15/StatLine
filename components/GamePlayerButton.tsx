import { memo } from "react";
import { theme } from "@/theme";
import { StyleSheet, Text, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { PlayerType } from "@/types/player";
import { getPlayerDisplayName } from "@/utils/displayHelpers";

type Props = {
  player?: PlayerType;
  playerId?: string; // Add playerId as optional prop for fallback lookup
  onPress: (playerId: string) => void;
  opponentName?: string;
  size?: "normal" | "large";
  allowMultilineText?: boolean;
};

export const GamePlayerButton = memo(function GamePlayerButton({
  player,
  playerId,
  onPress,
  opponentName,
  size = "normal",
  allowMultilineText = true,
}: Props) {
  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress(player?.id ?? playerId ?? "Opponent");
  };

  const playerNumber = player?.number;
  const playerName = player?.name || (playerId ? getPlayerDisplayName(playerId) : "Unknown Player");

  // Determine the text to display based on whether multiline is allowed
  const getDisplayText = () => {
    if (opponentName) {
      return "Opponent";
    }

    if (playerNumber !== undefined && playerNumber !== null && playerNumber !== "") {
      // Always show number on its own line, then the name (which may wrap at word boundaries)
      return `#${playerNumber}\n${playerName}`;
    }

    return playerName;
  };

  // Create accessibility label
  const getAccessibilityLabel = () => {
    if (opponentName) {
      return `Select opponent ${opponentName}`;
    }
    if (playerNumber) {
      return `Select ${playerName}, number ${playerNumber}`;
    }
    return `Select ${playerName}`;
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint="Double tap to select this player"
      style={({ pressed }) => [
        size === "large" ? styles.buttonLarge : styles.button,
        {
          backgroundColor: opponentName ? theme.colorOnyx : theme.colorLightGrey,
        },
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        numberOfLines={allowMultilineText ? 3 : 2}
        ellipsizeMode="tail"
        style={[styles.text, { color: opponentName ? theme.colorWhite : theme.colorBlack }]}
      >
        {getDisplayText()}
      </Text>
    </Pressable>
  );
});

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
