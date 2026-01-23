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
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "@/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSetStore } from "@/store/setStore";
import { useTeamStore } from "@/store/teamStore";
import { useGameStore } from "@/store/gameStore";
import { StatLineImage } from "@/components/StatLineImage";
import { SetStatsTable } from "@/components/shared/SetStatsTable";
import { IconAvatar } from "@/components/shared/IconAvatar";
import { router } from "expo-router";
import { confirmSetDeletion } from "@/utils/playerDeletion";
import { LoadingState } from "@/components/LoadingState";
import { StandardBackButton } from "@/components/StandardBackButton";
import { RecentGamesTable } from "@/components/shared/RecentGamesTable";
import ViewShot from "react-native-view-shot";
import { ShareableSetRecentGamesTable } from "@/components/shared/ShareableSetRecentGamesTable";
import { shareBoxScoreImage } from "@/utils/shareBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import { GameCountSelectorModal } from "@/components/shared/GameCountSelectorModal";

export default function SetPage() {
  const { setId } = useRoute().params as { setId: string };
  const navigation = useNavigation();
  const getSetSafely = useSetStore(state => state.getSetSafely);
  const teams = useTeamStore(state => state.teams);
  const games = useGameStore(state => state.games);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGameCountSelector, setShowGameCountSelector] = useState(false);
  const [selectedGameCount, setSelectedGameCount] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const shareableRef = useRef<ViewShot>(null);

  const set = getSetSafely(setId);
  const setName = set?.name || "Set";
  const updateSet = useSetStore(state => state.updateSet);

  const handleDeleteSet = () => {
    confirmSetDeletion(setId, setName, () => {
      navigation.goBack();
    });
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedName(set?.name || "");
  };

  const handleSave = async () => {
    if (editedName.trim() === "") {
      Alert.alert("Validation Error", "Set name cannot be empty");
      return;
    }

    try {
      await updateSet(setId, {
        name: editedName.trim(),
      });
      setIsEditMode(false);
    } catch {
      Alert.alert("Error", "Failed to update set. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedName(set?.name || "");
  };

  // Initialize edit values when set changes
  useEffect(() => {
    if (set) {
      setEditedName(set.name);
    }
  }, [set]);

  // Move all hooks before any conditional returns
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Set" : setName,
      headerLeft: () => <StandardBackButton onPress={() => navigation.goBack()} />,
      headerRight: () => (
        <Pressable hitSlop={20} onPress={isEditMode ? handleSave : handleEdit}>
          <Text style={styles.headerButtonText}>{isEditMode ? "Done" : "Edit"}</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, setName, editedName]);

  // Handle invalid set ID
  useEffect(() => {
    if (!set) {
      Alert.alert("Set Not Found", "This set no longer exists or has been deleted.", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
  }, [set, navigation]);

  // Show loading or error state if set doesn't exist
  if (!set) {
    return <LoadingState message="Loading set..." />;
  }

  const team = teams[set?.teamId || ""];
  const gameList = Object.values(games);
  const setGames = gameList.filter(game => game.activeSets.includes(setId) && game.sets[setId]);

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
            const rawTitle = `${set.name} Recent Games`;
            const fileName = sanitizeFileName(rawTitle);

            await shareBoxScoreImage(shareableRef, `${set.name} Recent Games`, fileName);
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
    if (setGames.length === 0) {
      return (
        <View style={{ padding: 20, alignItems: "center" }}>
          <Text style={{ color: theme.colorGrey, fontSize: 14 }}>
            No games played yet. Start a game with this set to start tracking stats!
          </Text>
        </View>
      );
    }

    const gamesPerPage = 5;
    const totalGames = setGames.length;
    const totalPages = Math.ceil(totalGames / gamesPerPage);
    const startIndex = currentPage * gamesPerPage;
    const endIndex = Math.min(startIndex + gamesPerPage, totalGames);
    const currentGames = setGames.slice(startIndex, endIndex);

    return (
      <>
        <View style={styles.gamesTableContainer}>
          <RecentGamesTable games={currentGames} context="set" setId={setId} />
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
        <IconAvatar size={60} icon="📋" />

        {isEditMode ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.editNameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Set name"
              autoCapitalize="words"
              placeholderTextColor={theme.colorGrey}
            />
          </View>
        ) : (
          <View style={styles.runsBadge}>
            <Text style={styles.runsText}>
              {set.runCount} {set.runCount === 1 ? "Run" : "Runs"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.padding}>
        {/* Set Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Performance</Text>
          <SetStatsTable set={set} />
        </View>

        {/* Recent Games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Games</Text>
            {setGames.length > 0 && (
              <View style={{ paddingRight: 12 }}>
                <TouchableOpacity
                  onPress={handleShareRecentGames}
                  disabled={isSharing}
                  hitSlop={20}
                >
                  <Feather
                    name={isSharing ? "loader" : "share"}
                    size={20}
                    color={theme.colorOrangePeel}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.recentGames}>{renderRecentGames()}</View>
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
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSet}>
              <FontAwesome5 name="trash-alt" size={16} color={theme.colorWhite} />
              <Text style={styles.deleteButtonText}>Delete Set</Text>
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
        totalGames={setGames.length}
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
            <ShareableSetRecentGamesTable
              games={setGames.slice(0, selectedGameCount)}
              setId={setId}
              setName={set.name}
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
  runsBadge: {
    backgroundColor: theme.colorGrey,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  runsText: {
    color: theme.colorWhite,
    fontSize: 14,
    fontWeight: "600",
  },
  padding: {
    padding: 12,
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
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
  headerButtonText: {
    color: theme.colorOrangePeel,
    fontSize: 16,
    fontWeight: "600",
  },
  editNameContainer: {
    width: "80%",
    marginTop: 16,
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
