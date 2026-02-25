import { useEffect, useState } from "react";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { validateStatLineFile } from "@/logic/importValidation";
import { StatLineExport } from "@/types/statlineExport";
import { storeHydration } from "@/utils/storeHydration";
import { ImportWizard } from "@/components/import/ImportWizard";
import Feather from "@expo/vector-icons/Feather";

export default function ImportScreen() {
  const { fileUri } = useLocalSearchParams<{ fileUri: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<StatLineExport | null>(null);

  useEffect(() => {
    async function loadFile() {
      try {
        if (!fileUri) {
          setError("No file provided");
          setLoading(false);
          return;
        }

        // Wait for stores to hydrate before proceeding
        await storeHydration.waitForHydration();

        const content = await FileSystem.readAsStringAsync(fileUri);
        const parsed = JSON.parse(content);

        // Validate
        const result = validateStatLineFile(parsed);
        if (!result.isValid) {
          setError(`Invalid file: ${result.errors.join(", ")}`);
          setLoading(false);
          return;
        }

        setExportData(result.export);
        setLoading(false);
      } catch (err) {
        console.error("Error loading import file:", err);
        if (err instanceof SyntaxError) {
          setError("The file is not valid JSON");
        } else {
          setError(err instanceof Error ? err.message : "Failed to read file");
        }
        setLoading(false);
      }
    }

    loadFile();
  }, [fileUri]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colorOrangePeel} />
        <Text style={styles.loadingText}>Loading game data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Feather name="alert-circle" size={48} color={theme.colorDestructive} />
        <Text style={styles.errorTitle}>Import Failed</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Text
          style={styles.backLink}
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
        >
          Go Back
        </Text>
      </View>
    );
  }

  if (exportData) {
    return <ImportWizard exportData={exportData} />;
  }

  return null;
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colorWhite,
    padding: scale(24),
    gap: scale(12),
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: theme.colorGrey,
    marginTop: scale(12),
  },
  errorTitle: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: theme.colorOnyx,
    marginTop: scale(8),
  },
  errorText: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    textAlign: "center",
    lineHeight: 20,
  },
  backLink: {
    fontSize: moderateScale(16),
    color: theme.colorOrangePeel,
    fontWeight: "600",
    marginTop: scale(16),
  },
});
