import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "large";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "large",
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={theme.colorOrangePeel} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colorWhite,
    padding: scale(20),
  },
  message: {
    marginTop: scale(16),
    fontSize: moderateScale(16),
    color: theme.colorGrey,
    textAlign: "center",
  },
});
