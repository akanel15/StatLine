import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { theme } from "@/theme";
import { StatLineButton } from "@/components/StatLineButton";
import { useTeamStore } from "@/store/teamStore";
import { PeriodType } from "@/types/game";
import { simulateGame, type GameSimulatorConfig } from "@/utils/debug/gameSimulator";
import { router } from "expo-router";

export default function GameSimulatorScreen() {
  const teams = useTeamStore((state) => state.teams);
  const teamList = Object.values(teams);
  const currentTeamId = useTeamStore((state) => state.currentTeamId);

  const [selectedTeamId, setSelectedTeamId] = useState(currentTeamId || teamList[0]?.id || "");
  const [opponentName, setOpponentName] = useState("Opponent");
  const [ourScoreMin, setOurScoreMin] = useState("80");
  const [ourScoreMax, setOurScoreMax] = useState("100");
  const [oppScoreMin, setOppScoreMin] = useState("70");
  const [oppScoreMax, setOppScoreMax] = useState("95");
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.Quarters);
  const [realism, setRealism] = useState<"low" | "medium" | "high">("medium");
  const [numGames, setNumGames] = useState("1");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    if (!selectedTeamId) {
      Alert.alert("Error", "Please select a team first");
      return;
    }

    const ourMin = parseInt(ourScoreMin) || 80;
    const ourMax = parseInt(ourScoreMax) || 100;
    const oppMin = parseInt(oppScoreMin) || 70;
    const oppMax = parseInt(oppScoreMax) || 95;
    const games = parseInt(numGames) || 1;

    if (ourMin > ourMax || oppMin > oppMax) {
      Alert.alert("Error", "Min score cannot be greater than max score");
      return;
    }

    if (games < 1 || games > 20) {
      Alert.alert("Error", "Number of games must be between 1 and 20");
      return;
    }

    try {
      setIsSimulating(true);

      const gameIds: string[] = [];

      for (let i = 0; i < games; i++) {
        const config: GameSimulatorConfig = {
          teamId: selectedTeamId,
          opponentName: games > 1 ? `${opponentName} ${i + 1}` : opponentName,
          targetScore: { min: ourMin, max: ourMax },
          opponentScore: { min: oppMin, max: oppMax },
          periodType,
          realism,
        };

        const gameId = await simulateGame(config);
        gameIds.push(gameId);

        // Small delay between games to avoid overwhelming the stores
        if (i < games - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      Alert.alert(
        "Success!",
        `Simulated ${games} game${games > 1 ? "s" : ""} successfully!\n\nCheck the Games tab to view results.`,
        [
          { text: "Stay Here", style: "cancel" },
          {
            text: "View Games",
            onPress: () => router.push("/games"),
          },
        ],
      );
    } catch (error) {
      console.error("Game simulation error:", error);
      Alert.alert("Error", `Failed to simulate game: ${error}`);
    } finally {
      setIsSimulating(false);
    }
  };

  if (teamList.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🏀</Text>
          <Text style={styles.emptyStateTitle}>No Teams Available</Text>
          <Text style={styles.emptyStateText}>
            You need to create at least one team before simulating games.
          </Text>
          <StatLineButton
            title="Go to Teams"
            onPress={() => router.push("/")}
            color={theme.colorOrangePeel}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Game Simulator</Text>
          <Text style={styles.sectionDescription}>
            Generate realistic game data with actual play-by-play using real game functions
          </Text>
        </View>

        {/* Team Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Select Team</Text>
          <ScrollView horizontal style={styles.teamSelector} showsHorizontalScrollIndicator={false}>
            {teamList.map((team) => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.teamChip,
                  selectedTeamId === team.id && styles.teamChipSelected,
                ]}
                onPress={() => setSelectedTeamId(team.id)}
              >
                <Text
                  style={[
                    styles.teamChipText,
                    selectedTeamId === team.id && styles.teamChipTextSelected,
                  ]}
                >
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Opponent Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Opponent Name</Text>
          <TextInput
            style={styles.input}
            value={opponentName}
            onChangeText={setOpponentName}
            placeholder="Lakers"
            placeholderTextColor={theme.colorGrey}
          />
        </View>

        {/* Score Ranges */}
        <View style={styles.section}>
          <Text style={styles.label}>Our Score Range</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={ourScoreMin}
              onChangeText={setOurScoreMin}
              keyboardType="numeric"
              placeholder="Min"
            />
            <Text style={styles.rangeText}>to</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={ourScoreMax}
              onChangeText={setOurScoreMax}
              keyboardType="numeric"
              placeholder="Max"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Opponent Score Range</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={oppScoreMin}
              onChangeText={setOppScoreMin}
              keyboardType="numeric"
              placeholder="Min"
            />
            <Text style={styles.rangeText}>to</Text>
            <TextInput
              style={[styles.input, styles.smallInput]}
              value={oppScoreMax}
              onChangeText={setOppScoreMax}
              keyboardType="numeric"
              placeholder="Max"
            />
          </View>
        </View>

        {/* Period Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Period Type</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                periodType === PeriodType.Quarters && styles.toggleButtonActive,
              ]}
              onPress={() => setPeriodType(PeriodType.Quarters)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  periodType === PeriodType.Quarters && styles.toggleButtonTextActive,
                ]}
              >
                Quarters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                periodType === PeriodType.Halves && styles.toggleButtonActive,
              ]}
              onPress={() => setPeriodType(PeriodType.Halves)}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  periodType === PeriodType.Halves && styles.toggleButtonTextActive,
                ]}
              >
                Halves
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Realism Level */}
        <View style={styles.section}>
          <Text style={styles.label}>Realism / Variance</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.toggleButton, realism === "low" && styles.toggleButtonActive]}
              onPress={() => setRealism("low")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  realism === "low" && styles.toggleButtonTextActive,
                ]}
              >
                Low
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, realism === "medium" && styles.toggleButtonActive]}
              onPress={() => setRealism("medium")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  realism === "medium" && styles.toggleButtonTextActive,
                ]}
              >
                Medium
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, realism === "high" && styles.toggleButtonActive]}
              onPress={() => setRealism("high")}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  realism === "high" && styles.toggleButtonTextActive,
                ]}
              >
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Number of Games */}
        <View style={styles.section}>
          <Text style={styles.label}>Number of Games to Simulate</Text>
          <TextInput
            style={styles.input}
            value={numGames}
            onChangeText={setNumGames}
            keyboardType="numeric"
            placeholder="1"
            placeholderTextColor={theme.colorGrey}
          />
          <Text style={styles.helperText}>Maximum: 20 games</Text>
        </View>

        {/* Simulate Button */}
        <View style={styles.section}>
          <StatLineButton
            title={isSimulating ? "Simulating..." : "Simulate Game(s)"}
            onPress={handleSimulate}
            color={theme.colorOrangePeel}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              The simulator creates realistic games by:
              {"\n"}• Playing through each quarter/half
              {"\n"}• Using real game store functions
              {"\n"}• Generating actual play-by-play entries
              {"\n"}• Distributing stats across active players
              {"\n"}• Creating complete, finished games
            </Text>
            <Text style={styles.infoText}>
              Use this to quickly generate test data for analytics and statistics features.
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
  section: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colorGrey,
    lineHeight: 20,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colorOnyx,
  },
  smallInput: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rangeText: {
    fontSize: 16,
    color: theme.colorGrey,
    fontWeight: "500",
  },
  teamSelector: {
    flexDirection: "row",
  },
  teamChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colorLightGrey,
    marginRight: 8,
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
  },
  teamChipSelected: {
    backgroundColor: theme.colorOrangePeel,
    borderColor: theme.colorOrangePeel,
  },
  teamChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  teamChipTextSelected: {
    color: theme.colorWhite,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colorLightGrey,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
  },
  toggleButtonActive: {
    backgroundColor: theme.colorBlue,
    borderColor: theme.colorBlue,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  toggleButtonTextActive: {
    color: theme.colorWhite,
  },
  helperText: {
    fontSize: 12,
    color: theme.colorGrey,
    marginTop: 4,
    fontStyle: "italic",
  },
  infoSection: {
    margin: 16,
    backgroundColor: theme.colorBlue + "15",
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colorBlue,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colorOnyx,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colorGrey,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
});
