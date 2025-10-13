import { useLayoutEffect, useState, useEffect, useRef } from "react";
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
  Modal,
} from "react-native";
import { usePlayerStore } from "@/store/playerStore";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { theme } from "@/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { PlayerImage } from "@/components/PlayerImage";
import { Stat } from "@/types/stats";
import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import { router } from "expo-router";
import { StatCard } from "@/components/shared/StatCard";
import { RecentGamesTable } from "@/components/shared/RecentGamesTable";
import { RecordBadge } from "@/components/shared/RecordBadge";
import { ViewAllButton } from "@/components/shared/ViewAllButton";
import { EmptyStateText } from "@/components/shared/EmptyStateText";
import { StatLineImage } from "@/components/StatLineImage";
import { confirmPlayerDeletion } from "@/utils/playerDeletion";
import { LoadingState } from "@/components/LoadingState";
import * as ImagePicker from "expo-image-picker";
import { StandardBackButton } from "@/components/StandardBackButton";
import { formatPercentage } from "@/utils/basketball";
import ViewShot from "react-native-view-shot";
import { ShareableRecentGamesTable } from "@/components/shared/ShareableRecentGamesTable";
import { shareBoxScoreImage } from "@/utils/shareBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import Feather from "@expo/vector-icons/Feather";
import { GameCountSelectorModal } from "@/components/shared/GameCountSelectorModal";

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
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGameCountSelector, setShowGameCountSelector] = useState(false);
  const [selectedGameCount, setSelectedGameCount] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const shareableRef = useRef<ViewShot>(null);

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

  const handleShareRecentGames = () => {
    // Show game count selector first
    setShowGameCountSelector(true);
  };

  const handleGameCountSelected = (count: number) => {
    if (isSharing) return;

    setSelectedGameCount(count);

    // Close selector modal and wait before starting share process
    setTimeout(() => {
      setIsSharing(true);
      setShowShareModal(true);

      // Additional delay to ensure ViewShot modal is rendered
      setTimeout(async () => {
        try {
          if (shareableRef.current) {
            const rawTitle = `${player.name} Recent Games`;
            const fileName = sanitizeFileName(rawTitle);

            await shareBoxScoreImage(shareableRef, `${player.name} Recent Games`, fileName);
          }
        } catch (error) {
          console.error("Error sharing games:", error);
        } finally {
          setIsSharing(false);
          setShowShareModal(false);
        }
      }, 500);
    }, 300);
  };

  const renderRecentGames = () => {
    if (playerGames.length === 0) {
      return (
        <EmptyStateText message="No games played yet. Start a game to start tracking stats!" />
      );
    }

    const gamesPerPage = 5;
    const totalGames = playerGames.length;
    const totalPages = Math.ceil(totalGames / gamesPerPage);
    const startIndex = currentPage * gamesPerPage;
    const endIndex = Math.min(startIndex + gamesPerPage, totalGames);
    const currentGames = playerGames.slice(startIndex, endIndex);

    return (
      <>
        <View style={styles.gamesTableContainer}>
          <RecentGamesTable games={currentGames} context="player" playerId={playerId} />
        </View>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === 0 && styles.paginationButtonDisabled,
              ]}
              onPress={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
            >
              <Feather
                name="chevron-left"
                size={20}
                color={currentPage === 0 ? theme.colorGrey : theme.colorBlue}
              />
              <Text
                style={[
                  styles.paginationButtonText,
                  currentPage === 0 && styles.paginationButtonTextDisabled,
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={styles.paginationInfo}>
              Games {startIndex + 1}-{endIndex} of {totalGames}
            </Text>

            <TouchableOpacity
              style={[
                styles.paginationButton,
                currentPage === totalPages - 1 && styles.paginationButtonDisabled,
              ]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
              disabled={currentPage === totalPages - 1}
            >
              <Text
                style={[
                  styles.paginationButtonText,
                  currentPage === totalPages - 1 && styles.paginationButtonTextDisabled,
                ]}
              >
                Next
              </Text>
              <Feather
                name="chevron-right"
                size={20}
                color={currentPage === totalPages - 1 ? theme.colorGrey : theme.colorBlue}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Share Button */}
        <TouchableOpacity
          style={styles.shareGamesButton}
          onPress={handleShareRecentGames}
          disabled={isSharing}
        >
          <Feather name={isSharing ? "loader" : "share"} size={16} color={theme.colorOrangePeel} />
          <Text style={styles.shareGamesButtonText}>
            {isSharing ? "Sharing..." : "Share Recent Games"}
          </Text>
        </TouchableOpacity>
      </>
    );
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

        {/* Recent Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          <View style={styles.recentGames}>{renderRecentGames()}</View>
          <ViewAllButton text="View All Games" onPress={() => router.navigate("/games")} />
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

      {/* Game Count Selector Modal */}
      <GameCountSelectorModal
        visible={showGameCountSelector}
        onClose={() => setShowGameCountSelector(false)}
        onSelect={handleGameCountSelected}
        totalGames={playerGames.length}
      />

      {/* Hidden Modal for Capturing Game Stats for Share */}
      <Modal
        visible={showShareModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.hiddenModalContainer}>
          <ViewShot
            ref={shareableRef}
            options={{
              format: "png",
              quality: 0.9,
              result: "tmpfile",
            }}
          >
            <ShareableRecentGamesTable
              games={playerGames.slice(0, selectedGameCount)}
              context="player"
              playerId={playerId}
              playerName={player.name}
            />
          </ViewShot>
        </View>
      </Modal>
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
  gamesTableContainer: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    overflow: "hidden",
  },
  shareGamesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  shareGamesButtonText: {
    color: theme.colorOrangePeel,
    fontSize: 14,
    fontWeight: "600",
  },
  paginationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: theme.colorWhite,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  paginationButtonDisabled: {
    opacity: 0.4,
  },
  paginationButtonText: {
    color: theme.colorBlue,
    fontSize: 14,
    fontWeight: "600",
  },
  paginationButtonTextDisabled: {
    color: theme.colorGrey,
  },
  paginationInfo: {
    fontSize: 13,
    fontWeight: "500",
    color: theme.colorGrey,
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
  hiddenModalContainer: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
});
