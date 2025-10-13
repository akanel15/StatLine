import { Image, useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";

type Props = {
  size?: number;
  imageUri?: string;
  circular?: boolean;
  defaultLogoId?: string;
};

// Default logo mapping
const DEFAULT_LOGOS = {
  basketball: require("@/assets/baskitball.png"),
  falcon: require("@/assets/falcon.png"),
  crown: require("@/assets/crown.png"),
};

export function StatLineImage({ size, imageUri, circular = false, defaultLogoId }: Props) {
  const { width } = useWindowDimensions();
  const imageSize = size || Math.min(width / 1.2, 200);
  const [imageError, setImageError] = useState(false);

  // Reset error state when imageUri changes
  useEffect(() => {
    setImageError(false);
  }, [imageUri]);

  // Function to handle image loading errors
  const handleImageError = () => {
    setImageError(true);
  };

  // Reset error state when image loads successfully
  const handleImageLoad = () => {
    setImageError(false);
  };

  // Determine image source
  const getImageSource = () => {
    // If custom URI is provided and hasn't errored, use it
    if (imageUri && !imageError) {
      // Check if imageUri is a default logo ID
      if (imageUri in DEFAULT_LOGOS) {
        return DEFAULT_LOGOS[imageUri as keyof typeof DEFAULT_LOGOS];
      }
      return { uri: imageUri };
    }

    // If a default logo ID is provided, use it
    if (defaultLogoId && defaultLogoId in DEFAULT_LOGOS) {
      return DEFAULT_LOGOS[defaultLogoId as keyof typeof DEFAULT_LOGOS];
    }

    // Fallback to default basketball
    return require("@/assets/baskitball.png");
  };

  return (
    <Image
      source={getImageSource()}
      style={{
        width: imageSize,
        height: imageSize,
        borderRadius: circular ? 50 : 8,
      }}
      resizeMode="contain"
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}
