import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useState, useEffect } from "react";
import { OpponentShield } from "./OpponentTeamImage";
import { theme } from "@/theme";
import { Ionicons } from "@expo/vector-icons";

type OpponentImageProps = {
  imageUri?: string;
  teamName?: string;
  size?: number;
  showOverlay?: boolean;
  onPress?: () => void;
};

export function OpponentImage({
  imageUri,
  teamName,
  size = 100,
  showOverlay = false,
  onPress,
}: OpponentImageProps) {
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUri changes
  useEffect(() => {
    setImageError(false);
  }, [imageUri]);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  // Show shield if no image or image failed to load
  const showShield = !imageUri || imageError;

  const content = showShield ? (
    <OpponentShield teamName={teamName} size={size} />
  ) : (
    <Image
      source={{ uri: imageUri }}
      style={{
        width: size,
        height: size,
        borderRadius: 8,
      }}
      resizeMode="contain"
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );

  if (showOverlay && onPress) {
    return (
      <TouchableOpacity style={styles.container} activeOpacity={0.6} onPress={onPress}>
        <View style={styles.imageContainer}>
          {content}
          <View style={styles.photoOverlay}>
            <Ionicons
              name={imageUri ? "camera" : "add-circle"}
              size={14}
              color={theme.colorWhite}
            />
            <Text style={styles.photoText}>{imageUri ? "Change Logo" : "Add Logo"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  photoText: {
    color: theme.colorWhite,
    fontSize: 10,
    fontWeight: "600",
  },
});
