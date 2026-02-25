import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";
import { captureRef } from "react-native-view-shot";
import RNShare from "react-native-share";

export async function shareBoxScoreImage(
  viewRef: React.RefObject<any>,
  gameName?: string,
  fileName?: string,
): Promise<boolean> {
  try {
    // Check if sharing is available on this platform
    const isAvailable = await Sharing.isAvailableAsync();
    if (__DEV__) console.log("[shareBoxScoreImage] Sharing available:", isAvailable);
    if (!isAvailable) {
      Alert.alert("Sharing not available", "Sharing is not available on this platform");
      return false;
    }

    // Capture the view as an image
    if (__DEV__) console.log("[shareBoxScoreImage] Calling captureRef");
    const tmpUri = await captureRef(viewRef, {
      format: "png",
      quality: 0.9,
      result: "tmpfile",
    });
    if (__DEV__) console.log("[shareBoxScoreImage] captureRef done, uri:", tmpUri);

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

    if (__DEV__) console.log("[shareBoxScoreImage] Calling Sharing.shareAsync");
    await Sharing.shareAsync(shareUri, shareOptions);
    if (__DEV__) console.log("[shareBoxScoreImage] shareAsync completed");

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

export async function shareMultipleBoxScoreImages(
  refs: React.RefObject<any>[],
  fileNames: string[],
  onProgress?: (completed: number, total: number) => void,
  signal?: { cancelled: boolean },
): Promise<boolean> {
  const shareUris: string[] = [];

  try {
    // Capture views sequentially to avoid native bridge contention
    for (let i = 0; i < refs.length; i++) {
      // Check for cancellation before each capture
      if (signal?.cancelled) {
        // Clean up any files already created
        for (const uri of shareUris) {
          FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
        }
        return false;
      }

      if (__DEV__) console.log(`[shareMultiple] Capturing ref ${i + 1}/${refs.length}`);
      const tmpUri = await captureRef(refs[i], {
        format: "png",
        quality: 0.9,
        result: "tmpfile",
      });
      if (__DEV__) console.log(`[shareMultiple] Captured ${i + 1}, uri:`, tmpUri);

      const name = fileNames[i] || `BoxScore-${i + 1}.png`;
      if (FileSystem.documentDirectory) {
        const targetPath = `${FileSystem.documentDirectory}${name}`;
        await FileSystem.copyAsync({ from: tmpUri, to: targetPath });
        shareUris.push(targetPath);

        // Clean up temp file
        FileSystem.deleteAsync(tmpUri, { idempotent: true }).catch(() => {});
      } else {
        shareUris.push(tmpUri);
      }

      onProgress?.(i + 1, refs.length);
    }

    // Check cancellation one final time before sharing
    if (signal?.cancelled) {
      for (const uri of shareUris) {
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }
      return false;
    }

    // Share all files via react-native-share
    if (__DEV__)
      console.log("[shareMultiple] Calling RNShare.open with", shareUris.length, "files");
    await RNShare.open({
      urls: shareUris,
      type: "image/png",
      failOnCancel: false,
    });
    if (__DEV__) console.log("[shareMultiple] RNShare.open completed");

    // Cleanup after 30 seconds
    setTimeout(() => {
      for (const uri of shareUris) {
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }
    }, 30000);

    return true;
  } catch (error) {
    // Clean up on error
    for (const uri of shareUris) {
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
    }
    console.error("Error sharing multiple box scores:", error);
    Alert.alert(
      "Sharing failed",
      error instanceof Error ? error.message : "An unknown error occurred",
    );
    return false;
  }
}
