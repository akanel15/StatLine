import { theme } from "@/theme";
import { StyleSheet, Text, View, Image } from "react-native";
import { useState, useEffect } from "react";

type IconAvatarProps = {
  size?: number;
  icon?: string; // For emoji/text icons like "📋"
  number?: number; // For player numbers
  imageUri?: string; // For custom images
  showBorder?: boolean; // Whether to show orange border
};

export function IconAvatar({
  size = 80,
  icon,
  number,
  imageUri,
  showBorder = true,
}: IconAvatarProps) {
  const fontSize = size * 0.52; // Scale font size proportionally
  const [showImage, setShowImage] = useState(false);

  // Reset image state when imageUri changes
  useEffect(() => {
    setShowImage(false);
  }, [imageUri]);

  // Handle image loading success
  const handleImageLoad = () => {
    setShowImage(true);
  };

  // Handle image loading error - keep showImage false
  const handleImageError = () => {
    setShowImage(false);
  };

  // Render the fallback icon/number content
  const renderFallback = () => (
    <View
      style={[
        styles.borderContainer,
        { width: size, height: size },
        !showBorder && { backgroundColor: "transparent" },
      ]}
    >
      <View
        style={[
          styles.contentContainer,
          {
            width: showBorder ? size - 6 : size,
            height: showBorder ? size - 6 : size,
          },
        ]}
      >
        <Text style={[styles.contentText, { fontSize }]}>
          {icon ?? (number !== undefined && number !== null ? number : "?")}
        </Text>
      </View>
    </View>
  );

  // If no imageUri provided, always show fallback
  if (!imageUri) {
    return renderFallback();
  }

  // If we have an imageUri, try to load it
  return (
    <View style={{ width: size, height: size }}>
      {/* Always show fallback as base layer */}
      {renderFallback()}

      {/* Image overlay - only visible when successfully loaded */}
      {showImage && (
        <Image
          source={{ uri: imageUri }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      )}

      {/* Hidden image for loading - triggers callbacks but not visible */}
      <Image
        source={{ uri: imageUri }}
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  borderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colorOrangePeel,
    borderRadius: 50,
  },
  contentContainer: {
    backgroundColor: theme.colorOnyx,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  contentText: {
    fontWeight: "bold",
    color: theme.colorWhite,
  },
});
