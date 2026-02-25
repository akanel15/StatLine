import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { Alert } from "react-native";
import { StatLineExport } from "@/types/statlineExport";
import { sanitizeFileName } from "@/utils/filename";

/**
 * Writes a StatLineExport to a .statline file and shares it via the native share sheet.
 * Cleans up the temp file after 30 seconds.
 */
export async function shareStatLineFile(
  exportData: StatLineExport,
  teamName: string,
): Promise<boolean> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert("Sharing not available", "Sharing is not available on this platform");
      return false;
    }

    const fileName = sanitizeFileName(teamName, "statline");
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData));

    await Sharing.shareAsync(filePath, {
      mimeType: "application/octet-stream",
      dialogTitle: `Share ${teamName} Game Data`,
      UTI: "com.akanel.statline.export",
    });

    // Cleanup after 30 seconds
    setTimeout(() => {
      FileSystem.deleteAsync(filePath, { idempotent: true }).catch(() => {});
    }, 30000);

    return true;
  } catch (error) {
    console.error("Error sharing game data:", error);
    Alert.alert(
      "Sharing failed",
      error instanceof Error ? error.message : "An unknown error occurred",
    );
    return false;
  }
}
