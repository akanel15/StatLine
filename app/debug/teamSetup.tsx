import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
} from "react-native";
import { theme } from "@/theme";
import { StatLineButton } from "@/components/StatLineButton";
import { router } from "expo-router";
import {
  setupTeam,
  setupDemoTeams,
  simulateDemoGames,
  VIKES_DIV1_MEN_CONFIG,
  DEMO_TEAMS_CONFIG,
  DEMO_GAME_COUNTS,
  type TeamSetupConfig,
  type PlayerData,
  type SimulationProgress,
} from "@/utils/debug/teamSetup";

export default function TeamSetupScreen() {
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState<SimulationProgress | null>(null);
  const [customTeamName, setCustomTeamName] = useState("");
  const [customPlayers, setCustomPlayers] = useState("");
  const [customSets, setCustomSets] = useState("");

  const handleDemoTeamsSetup = async () => {
    // Safety check - only allow in development
    if (!__DEV__) {
      return;
    }

    try {
      setIsGeneratingDemo(true);

      const teamIds = await setupDemoTeams();
      const totalPlayers = DEMO_TEAMS_CONFIG.reduce((sum, t) => sum + t.players.length, 0);

      Alert.alert(
        "Success!",
        `Created ${teamIds.length} demo teams with ${totalPlayers} total players for App Store screenshots!`,
        [{ text: "OK" }],
      );
    } catch (error) {
      console.error("Demo teams setup error:", error);
      Alert.alert("Error", `Failed to create demo teams: ${error}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleSimulateGames = async () => {
    // Safety check - only allow in development
    if (!__DEV__) {
      return;
    }

    try {
      setIsSimulating(true);
      setSimulationProgress(null);

      await simulateDemoGames((progress) => {
        setSimulationProgress(progress);
      });

      const totalGames = Object.values(DEMO_GAME_COUNTS).reduce((sum, count) => sum + count, 0);

      Alert.alert("Success!", `Simulated ${totalGames} games across all demo teams!`, [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Game simulation error:", error);
      Alert.alert("Error", `Failed to simulate games: ${error}`);
    } finally {
      setIsSimulating(false);
      setSimulationProgress(null);
    }
  };

  const handleQuickSetup = async () => {
    try {
      setIsCreating(true);

      const teamId = await setupTeam(VIKES_DIV1_MEN_CONFIG);

      Alert.alert(
        "Success!",
        `Created "${VIKES_DIV1_MEN_CONFIG.teamName}" with ${VIKES_DIV1_MEN_CONFIG.players.length} players and ${VIKES_DIV1_MEN_CONFIG.sets.length} sets!`,
        [
          { text: "Stay Here", style: "cancel" },
          {
            text: "View Team",
            onPress: () => router.push(`/(tabs)/${teamId}`),
          },
        ],
      );
    } catch (error) {
      console.error("Team setup error:", error);
      Alert.alert("Error", `Failed to create team: ${error}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCustomSetup = async () => {
    if (!customTeamName.trim()) {
      Alert.alert("Error", "Please enter a team name");
      return;
    }

    // Parse players (format: "Name Number" per line)
    const playerLines = customPlayers.trim().split("\n").filter((line) => line.trim());
    const players: PlayerData[] = [];

    for (const line of playerLines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) {
        Alert.alert("Error", `Invalid player format: "${line}"\nExpected: "Name Number"`);
        return;
      }

      const numberParsed = parseInt(parts[parts.length - 1]);
      if (isNaN(numberParsed)) {
        Alert.alert("Error", `Invalid number in: "${line}"`);
        return;
      }

      const name = parts.slice(0, -1).join(" ");
      players.push({ name, number: String(numberParsed) });
    }

    if (players.length === 0) {
      Alert.alert("Error", "Please add at least one player");
      return;
    }

    // Parse sets (comma or line separated)
    const sets = customSets
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s);

    try {
      setIsCreating(true);

      const config: TeamSetupConfig = {
        teamName: customTeamName,
        players,
        sets,
      };

      const teamId = await setupTeam(config);

      Alert.alert(
        "Success!",
        `Created "${customTeamName}" with ${players.length} player${players.length > 1 ? "s" : ""} and ${sets.length} set${sets.length > 1 ? "s" : ""}!`,
        [
          { text: "Stay Here", style: "cancel" },
          {
            text: "View Team",
            onPress: () => router.push(`/(tabs)/${teamId}`),
          },
        ],
      );

      // Clear form
      setCustomTeamName("");
      setCustomPlayers("");
      setCustomSets("");
    } catch (error) {
      console.error("Team setup error:", error);
      Alert.alert("Error", `Failed to create team: ${error}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏀 Team Setup</Text>
          <Text style={styles.sectionDescription}>
            Quickly create teams with players and sets for testing
          </Text>
        </View>

        {/* Quick Setup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Setup: Vikes Div 1 Men</Text>
          <Text style={styles.cardDescription}>
            Create a pre-configured team with 10 players and 3 sets
          </Text>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Players ({VIKES_DIV1_MEN_CONFIG.players.length}):</Text>
            {VIKES_DIV1_MEN_CONFIG.players.map((player, index) => (
              <Text key={index} style={styles.previewItem}>
                #{player.number} {player.name}
              </Text>
            ))}
          </View>

          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Sets ({VIKES_DIV1_MEN_CONFIG.sets.length}):</Text>
            {VIKES_DIV1_MEN_CONFIG.sets.map((set, index) => (
              <Text key={index} style={styles.previewItem}>
                • {set}
              </Text>
            ))}
          </View>

          <StatLineButton
            title={isCreating ? "Creating..." : "Create Vikes Team"}
            onPress={handleQuickSetup}
            color={theme.colorOrangePeel}
            disabled={isCreating}
          />
        </View>

        {/* Demo Teams for Screenshots */}
        {__DEV__ && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📸 Demo Teams for Screenshots</Text>
            <Text style={styles.cardDescription}>
              Create {DEMO_TEAMS_CONFIG.length} pre-configured teams with{" "}
              {DEMO_TEAMS_CONFIG.reduce((sum, t) => sum + t.players.length, 0)} total players for
              App Store screenshots
            </Text>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Teams:</Text>
              {DEMO_TEAMS_CONFIG.map((team, index) => (
                <Text key={index} style={styles.previewItem}>
                  • {team.teamName} ({team.players.length} players)
                </Text>
              ))}
            </View>

            <StatLineButton
              title={isGeneratingDemo ? "Creating..." : "Generate Demo Teams"}
              onPress={handleDemoTeamsSetup}
              color={theme.colorGreen}
              disabled={isGeneratingDemo || isCreating || isSimulating}
            />
          </View>
        )}

        {/* Game Simulation */}
        {__DEV__ && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🎮 Simulate Demo Games</Text>
            <Text style={styles.cardDescription}>
              Simulate games for demo teams with realistic stats. Creates games in batches to
              prevent app crashes.
            </Text>

            <View style={styles.previewSection}>
              <Text style={styles.previewLabel}>Games per Team:</Text>
              {Object.entries(DEMO_GAME_COUNTS).map(([team, count]) => (
                <Text key={team} style={styles.previewItem}>
                  • {team}: {count} games
                </Text>
              ))}
              <Text style={[styles.previewItem, { fontWeight: "600", marginTop: 8 }]}>
                Total: {Object.values(DEMO_GAME_COUNTS).reduce((sum, c) => sum + c, 0)} games
              </Text>
            </View>

            {isSimulating && simulationProgress && (
              <View style={styles.progressSection}>
                <Text style={styles.progressText}>
                  {simulationProgress.currentTeam}: Game {simulationProgress.currentGame}/
                  {simulationProgress.totalGamesForTeam}
                </Text>
                <Text style={styles.progressSubtext}>
                  Overall: {simulationProgress.completedGames}/{simulationProgress.totalGames} games
                </Text>
              </View>
            )}

            <StatLineButton
              title={isSimulating ? "Simulating..." : "Simulate Demo Games"}
              onPress={handleSimulateGames}
              color={theme.colorBlue}
              disabled={isSimulating || isGeneratingDemo || isCreating}
            />
          </View>
        )}

        {/* Custom Setup */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Custom Team Setup</Text>
          <Text style={styles.cardDescription}>
            Create your own team with custom players and sets
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Team Name</Text>
            <TextInput
              style={styles.input}
              value={customTeamName}
              onChangeText={setCustomTeamName}
              placeholder="Enter team name"
              placeholderTextColor={theme.colorGrey}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Players (one per line)</Text>
            <Text style={styles.helperText}>Format: Name Number</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={customPlayers}
              onChangeText={setCustomPlayers}
              placeholder={"John Smith 23\nJane Doe 42"}
              placeholderTextColor={theme.colorGrey}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Sets (optional)</Text>
            <Text style={styles.helperText}>Comma or line separated</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={customSets}
              onChangeText={setCustomSets}
              placeholder={"Starting 5\nBench\nPress Defense"}
              placeholderTextColor={theme.colorGrey}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <StatLineButton
            title={isCreating ? "Creating..." : "Create Custom Team"}
            onPress={handleCustomSetup}
            color={theme.colorBlue}
            disabled={isCreating}
          />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How It Works</Text>
            <Text style={styles.infoText}>
              Team setup will:
              {"\n"}• Create the team
              {"\n"}• Add all players with their numbers
              {"\n"}• Create all sets (lineups)
              {"\n"}• Set the team as current
              {"\n"}• Navigate you to the team page
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
  card: {
    margin: 16,
    marginTop: 8,
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 16,
    lineHeight: 20,
  },
  previewSection: {
    backgroundColor: theme.colorLightGrey + "40",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 8,
  },
  previewItem: {
    fontSize: 13,
    color: theme.colorOnyx,
    marginBottom: 4,
    paddingLeft: 8,
  },
  progressSection: {
    backgroundColor: theme.colorBlue + "20",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: theme.colorGrey,
  },
  inputSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: theme.colorGrey,
    marginBottom: 8,
    fontStyle: "italic",
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
  multilineInput: {
    minHeight: 80,
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
});
