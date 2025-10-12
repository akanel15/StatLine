import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Pressable,
} from "react-native";
import { theme } from "@/theme";
import { StatLineButton } from "@/components/StatLineButton";
import { loadSnapshot, getStoreSummary } from "@/utils/debug/snapshotManager";
import {
  generateSeed,
  getSeedDescription,
  getSeedDisplayName,
  type SeedType,
} from "@/utils/debug/seedData";

const SEED_TYPES: SeedType[] = ["minimal", "fullSeason", "edgeCases"];

export default function SeedDataScreen() {
  const [loading, setLoading] = useState(false);
  const [currentSummary] = useState(getStoreSummary());

  const handleLoadSeed = (seedType: SeedType) => {
    const seedName = getSeedDisplayName(seedType);
    const description = getSeedDescription(seedType);

    Alert.alert(
      `Load ${seedName}`,
      `${description}\n\nThis will replace all current data and cannot be undone. Are you sure?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load Seed Data",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const seedSnapshot = generateSeed(seedType);
              await loadSnapshot(seedSnapshot);
              Alert.alert("Success", `Loaded ${seedName} successfully!`);
            } catch (error) {
              console.error("Error loading seed data:", error);
              Alert.alert("Error", `Failed to load seed data: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderSeedCard = (seedType: SeedType, index: number) => {
    const colors = [theme.colorBlue, theme.colorGreen, theme.colorOrangePeel];
    const icons = ["🌱", "🏀", "⚠️"];
    const color = colors[index % colors.length];
    const icon = icons[index % icons.length];

    return (
      <Pressable
        key={seedType}
        style={[styles.seedCard, { borderLeftColor: color }]}
        onPress={() => handleLoadSeed(seedType)}
        disabled={loading}
      >
        <View style={styles.seedHeader}>
          <Text style={styles.seedIcon}>{icon}</Text>
          <View style={styles.seedTitleContainer}>
            <Text style={styles.seedTitle}>{getSeedDisplayName(seedType)}</Text>
            <Text style={styles.seedDescription}>
              {getSeedDescription(seedType)}
            </Text>
          </View>
        </View>

        <View style={styles.seedFooter}>
          <StatLineButton
            title="Load This Data"
            color={color}
            onPress={() => handleLoadSeed(seedType)}
            disabled={loading}
            style={styles.loadButton}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Current State Warning */}
        <View style={styles.warningSection}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Data Replacement Warning</Text>
            <Text style={styles.warningText}>
              Loading seed data will completely replace all current data in all
              stores. Consider creating a snapshot first if you want to preserve
              your current state.
            </Text>
          </View>
        </View>

        {/* Current State Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Current Data State</Text>
          <View style={styles.currentStateCard}>
            <View style={styles.stateRow}>
              <Text style={styles.stateLabel}>Teams:</Text>
              <Text style={styles.stateValue}>{currentSummary.teams}</Text>
            </View>
            <View style={styles.stateRow}>
              <Text style={styles.stateLabel}>Players:</Text>
              <Text style={styles.stateValue}>{currentSummary.players}</Text>
            </View>
            <View style={styles.stateRow}>
              <Text style={styles.stateLabel}>Games:</Text>
              <Text style={styles.stateValue}>
                {currentSummary.games} ({currentSummary.finishedGames} finished)
              </Text>
            </View>
            <View style={styles.stateRow}>
              <Text style={styles.stateLabel}>Sets:</Text>
              <Text style={styles.stateValue}>{currentSummary.sets}</Text>
            </View>

            {currentSummary.teams === 0 && (
              <View style={styles.emptyDataNotice}>
                <Text style={styles.emptyDataText}>
                  ✨ You have no data yet - perfect time to load some seed data!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Available Seed Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Available Seed Data</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a pre-built dataset to load for testing and development
          </Text>

          {SEED_TYPES.map((seedType, index) => renderSeedCard(seedType, index))}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          <View style={styles.tipsCard}>
            <Text style={styles.tipItem}>
              • Use <Text style={styles.tipBold}>Minimal Test Data</Text> for
              basic feature testing
            </Text>
            <Text style={styles.tipItem}>
              • Use <Text style={styles.tipBold}>Full Season Data</Text> for
              performance testing
            </Text>
            <Text style={styles.tipItem}>
              • Use <Text style={styles.tipBold}>Edge Cases</Text> to test
              validation and error handling
            </Text>
            <Text style={styles.tipItem}>
              • Create a snapshot before loading seed data to preserve your work
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  scrollView: {
    flex: 1,
  },
  warningSection: {
    margin: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colorWarning,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: "#856404",
    lineHeight: 20,
  },
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 16,
    fontStyle: "italic",
  },
  currentStateCard: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 12,
  },
  stateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  stateLabel: {
    fontSize: 14,
    color: theme.colorOnyx,
  },
  stateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorBlue,
  },
  emptyDataNotice: {
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colorSuccess + "20",
    borderRadius: 6,
  },
  emptyDataText: {
    fontSize: 14,
    color: theme.colorSuccess,
    textAlign: "center",
    fontStyle: "italic",
  },
  seedCard: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 16,
  },
  seedHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  seedIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  seedTitleContainer: {
    flex: 1,
  },
  seedTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  seedDescription: {
    fontSize: 14,
    color: theme.colorGrey,
    lineHeight: 20,
  },
  seedFooter: {
    alignItems: "flex-end",
  },
  loadButton: {
    paddingHorizontal: 24,
  },
  tipsCard: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 16,
  },
  tipItem: {
    fontSize: 14,
    color: theme.colorOnyx,
    marginBottom: 8,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: "600",
    color: theme.colorBlue,
  },
});
