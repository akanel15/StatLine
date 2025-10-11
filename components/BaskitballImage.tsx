import { Image, useWindowDimensions } from "react-native";
import { useState, useEffect } from "react";

type Props = {
  size?: number;
  imageUri?: string;
  circular?: boolean;
};

export function BaskitballImage({ size, imageUri, circular = false }: Props) {
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
    // If no imageUri provided or there was an error loading the image, use default
    if (!imageUri || imageError) {
      return require("@/assets/baskitball.png");
    }
    return { uri: imageUri };
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
