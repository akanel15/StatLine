import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { StatLineExport } from "@/types/statlineExport";
import Feather from "@expo/vector-icons/Feather";

type ImportSummaryStepProps = {
  exportData: StatLineExport;
  onContinue: () => void;
  onCancel: () => void;
};

export function ImportSummaryStep({ exportData, onContinue, onCancel }: ImportSummaryStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Feather name="download" size={48} color={theme.colorOrangePeel} />
        <Text style={styles.title}>Import Game Data</Text>
        <Text style={styles.subtitle}>
          Exported on {new Date(exportData.exportDate).toLocaleDateString()}
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Feather name="users" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              Team: <Text style={styles.summaryBold}>{exportData.team.name}</Text>
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Feather name="user" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryBold}>{exportData.players.length}</Text>{" "}
              {exportData.players.length === 1 ? "player" : "players"}
            </Text>
          </View>
          {(exportData.sets || []).length > 0 && (
            <View style={styles.summaryRow}>
              <Feather name="layers" size={20} color={theme.colorOnyx} />
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>{exportData.sets.length}</Text>{" "}
                {exportData.sets.length === 1 ? "set" : "sets"}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Feather name="activity" size={20} color={theme.colorOnyx} />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryBold}>{exportData.games.length}</Text>{" "}
              {exportData.games.length === 1 ? "game" : "games"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: scale(24),
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: scale(8),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: "700",
    color: theme.colorOnyx,
    marginTop: scale(16),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    marginBottom: scale(24),
  },
  summaryCard: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(12),
    padding: scale(20),
    width: "100%",
    gap: scale(16),
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  summaryText: {
    fontSize: moderateScale(16),
    color: theme.colorOnyx,
  },
  summaryBold: {
    fontWeight: "700",
  },
  buttonContainer: {
    gap: scale(12),
  },
  continueButton: {
    backgroundColor: theme.colorOrangePeel,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
  },
  continueButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorWhite,
  },
  cancelButton: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(12),
    padding: scale(16),
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
