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
import { useTeamStore } from "@/store/teamStore";
import { theme } from "@/theme";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatLineImage } from "@/components/StatLineImage";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Stat } from "@/types/stats";
import { Team } from "@/types/game";
import { StatCard } from "@/components/shared/StatCard";
import { RecentGamesTable } from "@/components/shared/RecentGamesTable";
import { router } from "expo-router";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { TopSetCard } from "@/components/shared/TopSetCard";
import { PlayerAveragesTable } from "@/components/shared/PlayerAveragesTable";
import { useSetStore } from "@/store/setStore";
import { RecordBadge } from "@/components/shared/RecordBadge";
import { TeamDeletionConfirm } from "@/components/deletion/TeamDeletionConfirm";
import { getTeamDeletionInfo } from "@/utils/cascadeDelete";
import { LoadingState } from "@/components/LoadingState";
import * as ImagePicker from "expo-image-picker";
import { formatPercentage } from "@/utils/basketball";
import ViewShot from "react-native-view-shot";
import { ShareableRecentGamesTable } from "@/components/shared/ShareableRecentGamesTable";
import { shareBoxScoreImage } from "@/utils/shareBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import Feather from "@expo/vector-icons/Feather";
import { GameCountSelectorModal } from "@/components/shared/GameCountSelectorModal";
import { Image } from "react-native";

// Default team logo options (same as in newTeam.tsx)
const DEFAULT_TEAM_LOGOS = [
  {
    id: "basketball",
    source: require("@/assets/baskitball.png"),
    name: "Basketball",
  },
  { id: "falcon", source: require("@/assets/falcon.png"), name: "Falcon" },
  {
    id: "crown",
    source: require("@/assets/crown.png"),
    name: "Crown",
  },
];

export default function TeamPage() {
  const { teamId } = useRoute().params as { teamId: string }; // Access teamId from route params
  const navigation = useNavigation();
  const getTeamSafely = useTeamStore(state => state.getTeamSafely);

  //game info
  const games = useGameStore(state => state.games);
  const gameList = Object.values(games);
  const teamGames = gameList.filter(game => game.teamId === teamId);

  // player info
  const players = usePlayerStore(state => state.players);
  const playersList = Object.values(players);
  const teamPlayers = playersList.filter(player => player.teamId === teamId);

  // sets info
  const sets = useSetStore(state => state.sets);
  const setsList = Object.values(sets);
  const teamSets = setsList.filter(set => set.teamId === teamId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [currentMode, setCurrentMode] = useState(Team.Us);
  const [showDeletionConfirm, setShowDeletionConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedImageUri, setEditedImageUri] = useState<string | undefined>();
  const [selectedDefaultLogo, setSelectedDefaultLogo] = useState<string | undefined>();
  const [showDefaultOptions, setShowDefaultOptions] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGameCountSelector, setShowGameCountSelector] = useState(false);
  const [selectedGameCount, setSelectedGameCount] = useState(3);
  const [currentPage, setCurrentPage] = useState(0);
  const shareableRef = useRef<ViewShot>(null);

  const team = getTeamSafely(teamId);
  const teamName = team?.name || "Team";
  const updateTeam = useTeamStore(state => state.updateTeam);

  const handleDeleteTeam = () => {
    setShowDeletionConfirm(true);
  };

  const handleDeletionConfirm = () => {
    setShowDeletionConfirm(false);
    navigation.goBack();
  };

  const handleDeletionCancel = () => {
    setShowDeletionConfirm(false);
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setEditedName(team?.name || "");

    // Check if current image is a default logo ID
    const defaultLogoIds = ["basketball", "falcon", "crown"];
    if (team?.imageUri && defaultLogoIds.includes(team.imageUri)) {
      setSelectedDefaultLogo(team.imageUri);
      setEditedImageUri(undefined);
    } else {
      setEditedImageUri(team?.imageUri);
      setSelectedDefaultLogo(undefined);
    }
  };

  const handleSave = async () => {
    if (editedName.trim() === "") {
      Alert.alert("Validation Error", "Team name cannot be empty");
      return;
    }

    try {
      // Use custom image URI or default logo ID
      const finalImageUri = editedImageUri || selectedDefaultLogo;

      await updateTeam(teamId, {
        name: editedName.trim(),
        imageUri: finalImageUri,
      });
      setIsEditMode(false);
      setShowDefaultOptions(false);
    } catch {
      Alert.alert("Error", "Failed to update team. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedName(team?.name || "");
    setEditedImageUri(team?.imageUri);
    setSelectedDefaultLogo(undefined);
    setShowDefaultOptions(false);
  };

  const handleDefaultLogoSelection = (logoId: string) => {
    setSelectedDefaultLogo(logoId);
    setEditedImageUri(undefined); // Clear custom image when selecting default
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
      setSelectedDefaultLogo(undefined); // Clear default logo when custom image is chosen
    }
  };

  // Initialize edit values when team changes - but only when not in edit mode
  // to avoid overwriting user's changes
  useEffect(() => {
    if (team && !isEditMode) {
      setEditedName(team.name);
      setEditedImageUri(team.imageUri);
    }
  }, [team, isEditMode]);

  // Move all hooks before any conditional returns
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditMode ? "Edit Team" : teamName,
      headerRight: () => (
        <Pressable hitSlop={20} onPress={isEditMode ? handleSave : handleEdit}>
          <Text style={styles.headerButtonText}>{isEditMode ? "Done" : "Edit"}</Text>
        </Pressable>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, teamName, editedName, editedImageUri, selectedDefaultLogo]);

  // Handle invalid team ID
  useEffect(() => {
    if (!team) {
      Alert.alert("Team Not Found", "This team no longer exists or has been deleted.", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
  }, [team, navigation]);

  // Show loading or error state if team doesn't exist
  if (!team) {
    return <LoadingState message="Loading team..." />;
  }

  const toggleStatsType = (type: Team) => {
    setCurrentMode(type);
  };
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getMainStats = (teamType: Team) => {
    const divisor = team.gameNumbers.gamesPlayed || 1; // Avoid division by zero
    return (
      <>
        <StatCard value={(team.stats[teamType][Stat.Points] / divisor).toFixed(1)} label="Points" />
        <StatCard
          value={(team.stats[teamType][Stat.Assists] / divisor).toFixed(1)}
          label="Assists"
        />
        <StatCard
          value={(
            (team.stats[teamType][Stat.DefensiveRebounds] +
              team.stats[teamType][Stat.OffensiveRebounds]) /
            divisor
          ).toFixed(1)}
          label="Rebounds"
        />
        <StatCard value={(team.stats[teamType][Stat.Steals] / divisor).toFixed(1)} label="Steals" />
        <StatCard value={(team.stats[teamType][Stat.Blocks] / divisor).toFixed(1)} label="Blocks" />
        <StatCard
          value={(team.stats[teamType][Stat.Turnovers] / divisor).toFixed(1)}
          label="Turnovers"
        />
      </>
    );
  };

  const getExpandedStats = (teamType: Team) => {
    const divisor = team.gameNumbers.gamesPlayed || 1; // Avoid division by zero
    return (
      <>
        <StatCard
          value={(
            (team.stats[teamType][Stat.TwoPointMakes] +
              team.stats[teamType][Stat.ThreePointMakes]) /
            divisor
          ).toFixed(1)}
          label="FGM"
        />
        <StatCard
          value={(
            (team.stats[teamType][Stat.TwoPointAttempts] +
              team.stats[teamType][Stat.ThreePointAttempts]) /
            divisor
          ).toFixed(1)}
          label="FGA"
        />
        <StatCard
          value={formatPercentage(
            team.stats[teamType][Stat.TwoPointMakes] + team.stats[teamType][Stat.ThreePointMakes],
            team.stats[teamType][Stat.TwoPointAttempts] +
              team.stats[teamType][Stat.ThreePointAttempts],
          )}
          label="FG%"
        />
        <StatCard
          value={(team.stats[teamType][Stat.TwoPointMakes] / divisor).toFixed(1)}
          label="2PM"
        />
        <StatCard
          value={(team.stats[teamType][Stat.TwoPointAttempts] / divisor).toFixed(1)}
          label="2PA"
        />
        <StatCard
          value={formatPercentage(
            team.stats[teamType][Stat.TwoPointMakes],
            team.stats[teamType][Stat.TwoPointAttempts],
          )}
          label="2P%"
        />
        <StatCard
          value={(team.stats[teamType][Stat.ThreePointMakes] / divisor).toFixed(1)}
          label="3PM"
        />
        <StatCard
          value={(team.stats[teamType][Stat.ThreePointAttempts] / divisor).toFixed(1)}
          label="3PA"
        />
        <StatCard
          value={formatPercentage(
            team.stats[teamType][Stat.ThreePointMakes],
            team.stats[teamType][Stat.ThreePointAttempts],
          )}
          label="3P%"
        />
        <StatCard
          value={(team.stats[teamType][Stat.FreeThrowsMade] / divisor).toFixed(1)}
          label="FTM"
        />
        <StatCard
          value={(team.stats[teamType][Stat.FreeThrowsAttempted] / divisor).toFixed(1)}
          label="FTA"
        />
        <StatCard
          value={formatPercentage(
            team.stats[teamType][Stat.FreeThrowsMade],
            team.stats[teamType][Stat.FreeThrowsAttempted],
          )}
          label="FT%"
        />
        <StatCard
          value={(team.stats[teamType][Stat.OffensiveRebounds] / divisor).toFixed(1)}
          label="Off Rebs"
        />
        <StatCard
          value={(team.stats[teamType][Stat.DefensiveRebounds] / divisor).toFixed(1)}
          label="Def Rebs"
        />
        <StatCard
          value={(team.stats[teamType][Stat.FoulsCommitted] / divisor).toFixed(1)}
          label="Fouls"
        />
      </>
    );
  };

  // Helper functions for sets
  const calculatePerRunStat = (statValue: number, runCount: number): number => {
    return runCount > 0 ? statValue / runCount : 0;
  };

  const formatPerRun = (value: number): string => {
    return value.toFixed(1);
  };

  // Get top performing sets for the top performers section
  const getTopPerformingSets = () => {
    return teamSets
      .map(set => ({
        set,
        pointsPerRun: calculatePerRunStat(set.stats[Stat.Points], set.runCount),
        assistsPerRun: calculatePerRunStat(set.stats[Stat.Assists], set.runCount),
      }))
      .sort((a, b) => b.pointsPerRun - a.pointsPerRun)
      .slice(0, 3)
      .map(({ set, pointsPerRun, assistsPerRun }) => ({
        set,
        primaryStat: {
          label: "pts/run",
          value: formatPerRun(pointsPerRun),
        },
        secondaryStat: {
          label: "ast/run",
          value: formatPerRun(assistsPerRun),
        },
      }));
  };

  const renderMainStats = (): React.ReactNode => {
    if (currentMode === Team.Us) {
      return getMainStats(Team.Us);
    } else {
      return getMainStats(Team.Opponent);
    }
  };
  const renderExpandedStats = (): React.ReactNode => {
    if (currentMode === Team.Us) {
      return getExpandedStats(Team.Us);
    } else {
      return getExpandedStats(Team.Opponent);
    }
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
            const rawTitle = `${team.name} Recent Games`;
            const fileName = sanitizeFileName(rawTitle);

            await shareBoxScoreImage(shareableRef, `${team.name} Recent Games`, fileName);
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
    if (teamGames.length === 0) {
      return (
        <Text style={styles.noGamesText}>
          No games played yet.{"\n"}Start a game to track stats!
        </Text>
      );
    }

    const gamesPerPage = 5;
    const totalGames = teamGames.length;
    const totalPages = Math.ceil(totalGames / gamesPerPage);
    const startIndex = currentPage * gamesPerPage;
    const endIndex = Math.min(startIndex + gamesPerPage, totalGames);
    const currentGames = teamGames.slice(startIndex, endIndex);

    return (
      <>
        <View style={styles.gamesTableContainer}>
          <RecentGamesTable games={currentGames} context="team" />
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

  return (
    <KeyboardAwareScrollView style={styles.container}>
      <View style={[styles.centered, styles.topBanner]}>
        {isEditMode ? (
          <>
            <TouchableOpacity onPress={handleImagePicker} style={styles.editImageContainer}>
              <View style={styles.imageContainer}>
                <StatLineImage
                  size={150}
                  imageUri={editedImageUri}
                  defaultLogoId={selectedDefaultLogo}
                  circular={true}
                />
                <View style={styles.photoOverlay}>
                  <Ionicons
                    name={editedImageUri || selectedDefaultLogo ? "camera" : "add-circle"}
                    size={14}
                    color={theme.colorWhite}
                  />
                  <Text style={styles.photoText}>
                    {editedImageUri || selectedDefaultLogo ? "Change Logo" : "Add Logo"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.defaultLogosButton}
              onPress={() => setShowDefaultOptions(!showDefaultOptions)}
            >
              <Text style={styles.defaultLogosText}>
                {showDefaultOptions ? "Hide Default Logos" : "Choose from Default Logos"}
              </Text>
            </TouchableOpacity>

            {showDefaultOptions && (
              <View style={styles.defaultLogosContainer}>
                {DEFAULT_TEAM_LOGOS.map(logo => (
                  <TouchableOpacity
                    key={logo.id}
                    style={[
                      styles.defaultLogoOption,
                      selectedDefaultLogo === logo.id && styles.selectedDefaultLogo,
                    ]}
                    onPress={() => handleDefaultLogoSelection(logo.id)}
                  >
                    <Image
                      source={logo.source}
                      style={styles.defaultLogoImage}
                      resizeMode="contain"
                    />
                    <Text
                      style={[
                        styles.defaultLogoText,
                        selectedDefaultLogo === logo.id && styles.selectedDefaultLogoText,
                      ]}
                    >
                      {logo.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          <StatLineImage size={150} imageUri={team?.imageUri} circular={true}></StatLineImage>
        )}

        {isEditMode ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.editNameInput}
              value={editedName}
              onChangeText={setEditedName}
              placeholder="Team name"
              autoCapitalize="words"
              placeholderTextColor={theme.colorGrey}
            />
          </View>
        ) : (
          <RecordBadge
            wins={team.gameNumbers.wins}
            losses={team.gameNumbers.losses}
            draws={team.gameNumbers.draws}
          />
        )}
      </View>

      <View style={styles.padding}>
        {/* Team Stats */}
        <View style={styles.section}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Team Stats</Text>
            <View style={styles.headerControls}>
              <View style={styles.statsToggle}>
                <TouchableOpacity
                  style={[styles.toggleOption, currentMode === Team.Us && styles.activeToggle]}
                  onPress={() => toggleStatsType(Team.Us)}
                >
                  <Text
                    style={[styles.toggleText, currentMode === Team.Us && styles.activeToggleText]}
                  >
                    For
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleOption,
                    currentMode === Team.Opponent && styles.activeToggle,
                  ]}
                  onPress={() => toggleStatsType(Team.Opponent)}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      currentMode === Team.Opponent && styles.activeToggleText,
                    ]}
                  >
                    Against
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.expandBtn} onPress={toggleExpanded}>
                <Text style={styles.expandText}>{isExpanded ? "Less" : "More"}</Text>
                <Text style={styles.expandArrow}>{isExpanded ? "▲" : "▼"}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.statsGrid}>
            {renderMainStats()}
            {isExpanded && renderExpandedStats()}
          </View>
        </View>
        {/* Recent Games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Games</Text>
          <View style={styles.recentGames}>{renderRecentGames()}</View>
        </View>
        {/* Player Averages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Averages</Text>
          <PlayerAveragesTable players={teamPlayers} stickyColumnHeader="Player" />
        </View>

        {/* Top Performing Sets */}
        {teamSets.length > 0 && (
          <View style={[styles.section, { marginBottom: 100 }]}>
            <Text style={styles.sectionTitle}>Top Performing Sets</Text>
            <View style={styles.topSets}>
              {getTopPerformingSets().map(({ set, primaryStat, secondaryStat }) => (
                <TopSetCard
                  key={set.id}
                  set={set}
                  primaryStat={primaryStat}
                  secondaryStat={secondaryStat}
                  onPress={() => {
                    router.navigate("/sets");
                    setTimeout(() => {
                      router.navigate(`/sets/${set.id}`);
                    }, 0);
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Delete and Cancel Buttons in Edit Mode */}
        {isEditMode && (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteTeam}>
              <FontAwesome5 name="trash-alt" size={16} color={theme.colorWhite} />
              <Text style={styles.deleteButtonText}>Delete Team</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TeamDeletionConfirm
        visible={showDeletionConfirm}
        teamId={teamId}
        teamName={teamName}
        deletionInfo={getTeamDeletionInfo(teamId)}
        onCancel={handleDeletionCancel}
        onConfirm={handleDeletionConfirm}
      />

      {/* Game Count Selector Modal */}
      <GameCountSelectorModal
        visible={showGameCountSelector}
        onClose={() => setShowGameCountSelector(false)}
        onSelect={handleGameCountSelected}
        totalGames={teamGames.length}
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
              games={teamGames.slice(0, selectedGameCount)}
              context="team"
              teamName={team.name}
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
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statsToggle: {
    flexDirection: "row",
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    overflow: "hidden",
  },
  toggleOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeToggle: {
    backgroundColor: theme.colorOrangePeel,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorGrey,
  },
  activeToggleText: {
    color: theme.colorWhite,
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
  noGamesText: {
    textAlign: "center",
    color: theme.colorGrey,
    fontSize: 16,
    fontStyle: "italic",
    padding: 20,
  },
  topSets: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    shadowColor: theme.colorOnyx,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  imageContainer: {
    position: "relative",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomLeftRadius: 75,
    borderBottomRightRadius: 75,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  photoText: {
    color: theme.colorWhite,
    fontSize: 10,
    fontWeight: "600",
  },
  defaultLogosButton: {
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  defaultLogosText: {
    color: theme.colorWhite,
    fontSize: 14,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  defaultLogosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  defaultLogoOption: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
    minWidth: 80,
  },
  selectedDefaultLogo: {
    borderColor: theme.colorOrangePeel,
    backgroundColor: theme.colorWhite,
  },
  defaultLogoImage: {
    width: 50,
    height: 50,
    marginBottom: 4,
  },
  defaultLogoText: {
    color: theme.colorOnyx,
    fontSize: 11,
    fontWeight: "600",
  },
  selectedDefaultLogoText: {
    color: theme.colorOrangePeel,
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
