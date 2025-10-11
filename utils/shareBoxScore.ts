import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";
import { captureRef } from "react-native-view-shot";

export async function shareBoxScoreImage(
  viewRef: React.RefObject<any>,
  gameName?: string,
  fileName?: string,
): Promise<boolean> {
  try {
    // Check if sharing is available on this platform
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Sharing not available", "Sharing is not available on this platform");
      return false;
    }

    // Capture the view as an image
    const tmpUri = await captureRef(viewRef, {
      format: "png",
      quality: 0.9,
      result: "tmpfile",
    });

    let shareUri = tmpUri;

    // If a custom filename is provided, copy to a new location with that name
    if (fileName && FileSystem.documentDirectory) {
      try {
        const targetPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({
          from: tmpUri,
          to: targetPath,
        });
        shareUri = targetPath;

        // Clean up the original temp file since we copied it
        FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {
          // Ignore cleanup errors
        });
      } catch (copyError) {
        console.warn("Failed to create named file, using original:", copyError);
        // Fall back to original temp file if copy fails
        shareUri = tmpUri;
      }
    }

    // Share the image with proper options
    const shareOptions: any = {
      mimeType: "image/png",
      dialogTitle: gameName ? `Share ${gameName} Box Score` : "Share Box Score",
      UTI: "public.png",
    };

    // Add filename to share options if provided
    if (fileName) {
      shareOptions.filename = fileName;
    }

    await Sharing.shareAsync(shareUri, shareOptions);

    // Cleanup temp file after 30 seconds to avoid cache bloat
    setTimeout(() => {
      FileSystem.deleteAsync(shareUri, { idempotent: true }).catch(() => {
        // Ignore cleanup errors
      });
    }, 30000);

    return true;
  } catch (error) {
    console.error("Error sharing box score:", error);
    Alert.alert(
      "Sharing failed",
      error instanceof Error ? error.message : "An unknown error occurred",
    );
    return false;
  }
}
