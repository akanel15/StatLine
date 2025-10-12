import { useLayoutEffect, useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { usePlayerStore } from "@/store/playerStore";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { theme } from "@/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { PlayerImage } from "@/components/PlayerImage";
import { Stat } from "@/types/stats";
import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import { Result } from "@/types/player";
import { router } from "expo-router";
import { StatCard } from "@/components/shared/StatCard";
import { PlayerGameItem } from "@/components/shared/PlayerGameItem";
import { RecordBadge } from "@/components/shared/RecordBadge";
import { ViewAllButton } from "@/components/shared/ViewAllButton";
import { EmptyStateText } from "@/components/shared/EmptyStateText";
import { StatLineImage } from "@/components/StatLineImage";
import { confirmPlayerDeletion } from "@/utils/playerDeletion";
import { LoadingState } from "@/components/LoadingState";
import * as ImagePicker from "expo-image-picker";
import { StandardBackButton } from "@/components/StandardBackButton";
import { formatPercentage } from "@/utils/basketball";

export default function PlayerPage() {
  const { playerId } = useRoute().params as { playerId: string };
  const navigation = useNavigation();
  const getPlayerSafely = usePlayerStore(state => state.getPlayerSafely);
  const teams = useTeamStore(state => state.teams);
  const games = useGameStore(state => state.games);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedNumber, setEditedNumber] = useState("");
  const [editedImageUri, setEditedImageUri] = useState<string | undefined>();

  const player = getPlayerSafely(playerId);
  const playerName = player?.name || "Player";
  const updatePlayer = usePlayerStore(state => state.updatePlayer);

  const handleDeletePlayer = () => {
    confirmPlayerDeletion(playerId, playerName, () => {
      navigation.goBack();
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedName(player?.name || "");
    setEditedNumber(player?.number?.toString() || "");
    setEditedImageUri(player?.imageUri);
  };

  const handleSave = async () => {
    if (editedName.trim() === "") {
      Alert.alert("Validation Error", "Player name cannot be empty");
      return;
    }

    const numberValue = editedNumber.trim() === "" ? undefined : parseInt(editedNumber, 10);
    if (editedNumber.trim() !== "" && (isNaN(numberValue!) || numberValue! < 0)) {
      Alert.alert("Validation Error", "Player number must be a valid positive number");
      return;
    }

    try {
      await updatePlayer(playerId, {
        name: editedName.trim(),
        number: numberValue,
        imageUri: editedImageUri,
      });
      setIsEditMode(false);
    } catch {
      Alert.alert("Error", "Failed to update player. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedName(player?.name || "");
    setEditedNumber(player?.number?.toString() || "");
    setEditedImageUri(player?.imageUri);
  };

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setEditedImageUri(result.assets[0].uri);
    }
  };

  // Initialize edit values when player changes
  useEffect(() => {
    if (player) {
      setEditedName(player.name);
      setEditedNumber(player.number?.toString() || "");
      setEditedImageUri(player.imageUri);
    }
  }, [player]);

  // Move all hooks before any conditional returns
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Player" : playerName,
      headerLeft: () => <StandardBackButton onPress={() => navigation.goBack()} />,
      headerRight: () => (
        <Pressable hitSlop={20} onPress={isEditMode ? handleSave : handleEdit}>
          <Text style={styles.headerButtonText}>{isEditMode ? "Done" : "Edit"}</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, playerName, editedName, editedNumber, editedImageUri]);

  // Handle invalid player ID
  useEffect(() => {
    if (!player) {
      Alert.alert("Player Not Found", "This player no longer exists or has been deleted.", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
  }, [player, navigation]);

  // Show loading or error state if player doesn't exist
  if (!player) {
    return <LoadingState message="Loading player..." />;
  }

  const team = teams[player?.teamId || ""];
  const gameList = Object.values(games);
  const playerGames = gameList.filter(game => game.boxScore[playerId] !== undefined);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getMainStats = () => {
    const divisor = player.gameNumbers.gamesPlayed || 1;
    return (
      <>
        <StatCard value={(player.stats[Stat.Points] / divisor).toFixed(1)} label="Points" />
        <StatCard value={(player.stats[Stat.Assists] / divisor).toFixed(1)} label="Assists" />
        <StatCard
          value={(
            (player.stats[Stat.DefensiveRebounds] + player.stats[Stat.OffensiveRebounds]) /
            divisor
          ).toFixed(1)}
          label="Rebounds"
        />
        <StatCard value={(player.stats[Stat.Steals] / divisor).toFixed(1)} label="Steals" />
        <StatCard value={(player.stats[Stat.Blocks] / divisor).toFixed(1)} label="Blocks" />
        <StatCard value={(player.stats[Stat.Turnovers] / divisor).toFixed(1)} label="Turnovers" />
      </>
    );
  };

  const getExpandedStats = () => {
    const divisor = player.gameNumbers.gamesPlayed || 1;
    return (
      <>
        <StatCard
          value={(
            (player.stats[Stat.TwoPointMakes] + player.stats[Stat.ThreePointMakes]) /
            divisor
          ).toFixed(1)}
          label="FGM"
        />
        <StatCard
          value={(
            (player.stats[Stat.TwoPointAttempts] + player.stats[Stat.ThreePointAttempts]) /
            divisor
          ).toFixed(1)}
          label="FGA"
        />
        <StatCard
          value={formatPercentage(
            player.stats[Stat.TwoPointMakes] + player.stats[Stat.ThreePointMakes],
            player.stats[Stat.TwoPointAttempts] + player.stats[Stat.ThreePointAttempts],
          )}
          label="FG%"
        />
        <StatCard value={(player.stats[Stat.TwoPointMakes] / divisor).toFixed(1)} label="2PM" />
        <StatCard value={(player.stats[Stat.TwoPointAttempts] / divisor).toFixed(1)} label="2PA" />
        <StatCard
          value={formatPercentage(
            player.stats[Stat.TwoPointMakes],
            player.stats[Stat.TwoPointAttempts],
          )}
          label="2P%"
        />
        <StatCard value={(player.stats[Stat.ThreePointMakes] / divisor).toFixed(1)} label="3PM" />
        <StatCard
          value={(player.stats[Stat.ThreePointAttempts] / divisor).toFixed(1)}
          label="3PA"
        />
        <StatCard
          value={formatPercentage(
            player.stats[Stat.ThreePointMakes],
            player.stats[Stat.ThreePointAttempts],
          )}
          label="3P%"
        />
        <StatCard value={(player.stats[Stat.FreeThrowsMade] / divisor).toFixed(1)} label="FTM" />
        <StatCard
          value={(player.stats[Stat.FreeThrowsAttempted] / divisor).toFixed(1)}
          label="FTA"
        />
        <StatCard
          value={formatPercentage(
            player.stats[Stat.FreeThrowsMade],
            player.stats[Stat.FreeThrowsAttempted],
          )}
          label="FT%"
        />
        <StatCard
          value={(player.stats[Stat.OffensiveRebounds] / divisor).toFixed(1)}
          label="Off Rebs"
        />
        <StatCard
          value={(player.stats[Stat.DefensiveRebounds] / divisor).toFixed(1)}
          label="Def Rebs"
        />
        <StatCard value={(player.stats[Stat.FoulsCommitted] / divisor).toFixed(1)} label="Fouls" />
      </>
    );
  };

  const renderRecentGames = () => {
    if (playerGames.length === 0) {
      return (
        <EmptyStateText message="No games played yet. Start a game to start tracking stats!" />
      );
    }

    return playerGames.slice(0, 3).map(game => {
      const playerGameStats = game.boxScore[playerId];
      const playerPoints = playerGameStats?.[Stat.Points] || 0;
      const playerAssists = playerGameStats?.[Stat.Assists] || 0;
      const playerRebounds =
        (playerGameStats?.[Stat.OffensiveRebounds] || 0) +
        (playerGameStats?.[Stat.DefensiveRebounds] || 0);

      return (
        <PlayerGameItem
          key={game.id}
          opponent={`vs ${game.opposingTeamName}`}
          score={`${game.statTotals[0][Stat.Points]} - ${game.statTotals[1][Stat.Points]}`}
          result={
            game.statTotals[0][Stat.Points] > game.statTotals[1][Stat.Points]
              ? Result.Win
              : game.statTotals[0][Stat.Points] < game.statTotals[1][Stat.Points]
                ? Result.Loss
                : Result.Draw
          }
          playerStats={{
            points: playerPoints,
            assists: playerAssists,
            rebounds: playerRebounds,
          }}
        />
      );
    });
  };

  const handleTeamPress = () => {
    if (team) {
      router.push(`/(tabs)/${team.id}`);
    }
  };

  return (
    <KeyboardAwareScrollView style={styles.container}>
      <View style={[styles.centered, styles.topBanner]}>
        {isEditMode ? (
          <TouchableOpacity onPress={handleImagePicker} style={styles.editImageContainer}>
            <PlayerImage player={{ ...player, imageUri: editedImageUri }} size={100} />
            <Text style={styles.editImageHint}>Tap to change image</Text>
          </TouchableOpacity>
        ) : (
          <PlayerImage player={player} size={100} />
        )}

        {isEditMode ? (
          <View style={styles.editFieldsContainer}>
            <View style={styles.editNameContainer}>
              <TextInput
                style={styles.editNameInput}
                value={editedName}
                onChangeText={setEditedName}
                placeholder="Player name"
                autoCapitalize="words"
                placeholderTextColor={theme.colorGrey}
              />
            </View>
            <View style={styles.editNumberContainer}>
              <TextInput
                style={styles.editNumberInput}
                value={editedNumber}
                onChangeText={setEditedNumber}
                placeholder="Number (optional)"
                keyboardType="numeric"
                placeholderTextColor={theme.colorGrey}
              />
            </View>
          </View>
        ) : (
          <RecordBadge
            wins={player.gameNumbers.wins}
            losses={player.gameNumbers.losses}
            draws={player.gameNumbers.draws}
            label="Record"
          />
        )}
      </View>

      <View style={styles.padding}>
        {/* Player Stats */}
        <View style={styles.section}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Player Stats</Text>
            <TouchableOpacity style={styles.expandBtn} onPress={toggleExpanded}>
              <Text style={styles.expandText}>{isExpanded ? "Less" : "More"}</Text>
              <Text style={styles.expandArrow}>{isExpanded ? "▲" : "▼"}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.statsGrid}>
            {getMainStats()}
            {isExpanded && getExpandedStats()}
          </View>
        </View>

        {/* Team Information */}
        {team && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team</Text>
            <TouchableOpacity style={styles.teamCard} onPress={handleTeamPress}>
              <View style={styles.teamInfo}>
                <View style={styles.teamAvatar}>
                  <StatLineImage size={50} imageUri={team.imageUri} />
                </View>
                <View style={styles.teamDetails}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamRecord}>
                    {team.gameNumbers.wins}-{team.gameNumbers.losses}-{team.gameNumbers.draws}{" "}
                    Record
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          <View style={styles.recentGames}>{renderRecentGames()}</View>
          <ViewAllButton text="View All Games" onPress={() => router.navigate("/games")} />
        </View>

        {/* Delete and Cancel Buttons in Edit Mode */}
        {isEditMode && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePlayer}>
              <FontAwesome5 name="trash-alt" size={16} color={theme.colorWhite} />
              <Text style={styles.deleteButtonText}>Delete Player</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ marginBottom: 100 }} />
      </View>
    </KeyboardAwareScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  centered: {
    alignItems: "center",
    marginBottom: 24,
    padding: 24,
  },
  topBanner: {
    backgroundColor: theme.colorOnyx,
  },
  padding: {
    padding: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colorOnyx,
    marginBottom: 15,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  expandBtn: {
    backgroundColor: theme.colorBlue,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  expandText: {
    color: theme.colorWhite,
    fontSize: 12,
    fontWeight: "600",
  },
  expandArrow: {
    color: theme.colorWhite,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  teamCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  teamInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  teamAvatar: {
    width: 50,
    height: 50,
    backgroundColor: theme.colorOrangePeel,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  teamDetails: {
    flex: 1,
  },
  teamName: {
    fontWeight: "600",
    fontSize: 16,
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  teamRecord: {
    fontSize: 12,
    color: theme.colorGrey,
    fontWeight: "500",
  },
  recentGames: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  headerButtonText: {
    color: theme.colorOrangePeel,
    fontSize: 16,
    fontWeight: "600",
  },
  editImageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  editImageHint: {
    color: theme.colorWhite,
    fontSize: 14,
    marginTop: 8,
    fontWeight: "500",
  },
  editFieldsContainer: {
    width: "80%",
    marginTop: 16,
    gap: 12,
  },
  editNameContainer: {
    width: "100%",
  },
  editNameInput: {
    backgroundColor: theme.colorWhite,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: theme.colorOnyx,
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
  },
  editNumberContainer: {
    width: "100%",
  },
  editNumberInput: {
    backgroundColor: theme.colorWhite,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: theme.colorOnyx,
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
  },
  editActions: {
    marginTop: 30,
    marginBottom: 50,
    gap: 12,
  },
  deleteButton: {
    backgroundColor: theme.colorDestructive,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: theme.colorWhite,
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: theme.colorLightGrey,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: theme.colorOnyx,
    fontSize: 16,
    fontWeight: "600",
  },
});
