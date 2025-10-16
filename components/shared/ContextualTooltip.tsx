import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/theme";
import { useEffect, useRef } from "react";

type ContextualTooltipProps = {
  message: string;
  onDismiss: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number; // in milliseconds
};

export function ContextualTooltip({
  message,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
}: ContextualTooltipProps) {
  const progressAnim = useRef(new Animated.Value(100)).current;

  // Auto-dismiss with animated progress bar
  useEffect(() => {
    if (autoDismiss) {
      // Start progress bar animation
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: autoDismissDelay,
        useNativeDriver: false, // Width animation requires useNativeDriver: false
      }).start();

      // Auto-dismiss after delay
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);

      return () => {
        clearTimeout(timer);
        progressAnim.stopAnimation();
      };
    }
  }, [autoDismiss, autoDismissDelay, onDismiss, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="information-circle" size={20} color={theme.colorOrangePeel} />
        <Text style={styles.message}>{message}</Text>
        <Pressable hitSlop={10} onPress={onDismiss} style={styles.closeButton}>
          <Ionicons name="close" size={20} color={theme.colorGrey} />
        </Pressable>
      </View>

      {/* Animated Progress Bar */}
      {autoDismiss && (
        <View style={styles.progressBarContainer}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colorWhite,
    borderWidth: 2,
    borderColor: theme.colorOrangePeel,
    borderRadius: 8,
    padding: 12,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colorOnyx,
  },
  closeButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: theme.colorLightGrey,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colorOrangePeel,
  },
});
