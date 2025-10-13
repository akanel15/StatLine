import { StatLineButton } from "@/components/StatLineButton";
import { GamePlayerButton } from "@/components/GamePlayerButton";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";
import { ActionType, getStatsForAction, Stat, StatMapping } from "@/types/stats";
import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useLayoutEffect, useState, useRef } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  AppState,
  Modal,
  TouchableOpacity,
} from "react-native";
import { theme } from "@/theme";
import { PeriodType, PlayByPlayType, Team } from "@/types/game";
import { SetRadioButton } from "@/components/SetRadioButton";
import { useSetStore } from "@/store/setStore";
import StatOverlay from "@/components/gamePage/StatOverlay";
import SetOverlay from "@/components/gamePage/SetOverlay";
import SubstitutionOverlay from "@/components/gamePage/SubstitutionOverlay";
import PlayByPlay from "@/components/gamePage/PlayByPlay";
import BoxScoreOverlay from "@/components/gamePage/BoxScoreOverlay";
import CompletedGamePlayByPlay from "@/components/gamePage/CompletedGamePlayByPlay";
import Ionicons from "@expo/vector-icons/Ionicons";
import MatchUpDisplay from "@/components/MatchUpDisplay";
import { Result } from "@/types/player";
import {
  completeGameAutomatically,
  completeGameManually,
  gameHasPlays,
  GameCompletionActions,
} from "@/logic/gameCompletion";
import { LoadingState } from "@/components/LoadingState";
import Feather from "@expo/vector-icons/Feather";
import ViewShot from "react-native-view-shot";
import { shareBoxScoreImage } from "@/utils/shareBoxScore";
import ShareableBoxScore from "@/components/gamePage/ShareableBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import { StandardBackButton } from "@/components/StandardBackButton";
import { EditGameModal } from "@/components/EditGameModal";
import { handleStatUpdate as handleStatUpdateLogic } from "@/logic/statUpdates";
import type { StatUpdateStoreActions } from "@/logic/statUpdates";

export default function GamePage() {
  const { gameId } = useRoute().params as { gameId: string }; // Access playerId from route params

  const players = usePlayerStore(state => state.players);
  const teamId = useTeamStore(state => state.currentTeamId);
  const getTeamSafely = useTeamStore(state => state.getTeamSafely);
  const getGameSafely = useGameStore(state => state.getGameSafely);

  const sets = useSetStore(state => state.sets);
  const setList = Object.values(sets);
  const teamSets = setList.filter(set => set.teamId === teamId);
  const setIdList = teamSets.map(set => set.id);

  const navigation = useNavigation();

  const setActiveSets = useGameStore(state => state.setActiveSets);
  const removePlayFromPeriod = useGameStore(state => state.removePlayFromPeriod);

  const [selectedPlay, setSelectedPlay] = useState<string>("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(false);
  const [showSets, setShowSets] = useState(false);
  const [showBoxScore, setShowBoxScore] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [freeThrowToggle, setFreeThrowToggle] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareableRef = useRef<ViewShot>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetsSection, setShowSetsSection] = useState(teamSets.length > 0);
  const [activeTab, setActiveTab] = useState<"boxscore" | "playbyplay">("boxscore");

  //game stats
  const updateBoxScore = useGameStore(state => state.updateBoxScore);
  const updateTotals = useGameStore(state => state.updateTotals);
  const updatePeriods = useGameStore(state => state.updatePeriods);
  const updateGameSetStats = useGameStore(state => state.updateSetStats);
  const updateGameSetCounts = useGameStore(state => state.incrementSetRunCount);

  //team stats
  const updateTeamStats = useTeamStore(state => state.updateStats);

  //player stats
  const updatePlayerStats = usePlayerStore(state => state.updateStats);

  //set stats
  const updateSetStats = useSetStore(state => state.updateStats);
  const updateSetRunCount = useSetStore(state => state.incrementRunCount);

  const game = getGameSafely(gameId);

  // Move handleShare outside the useLayoutEffect so it's accessible
  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    setShowShareModal(true);

    // Small delay to ensure modal is rendered
    setTimeout(async () => {
      try {
        if (shareableRef.current) {
          // Get team names for filename
          const ourTeam = getTeamSafely(teamId);
          const ourTeamName = ourTeam?.name || "Our-Team";
          const opponentName = game?.opposingTeamName || "Opponent";

          // Create descriptive title and filename
          const rawTitle = `${ourTeamName} vs ${opponentName}`;
          const fileName = sanitizeFileName(rawTitle);

          const gameName = `vs ${opponentName}`;
          await shareBoxScoreImage(shareableRef, gameName, fileName);
        }
      } finally {
        setIsSharing(false);
        setShowShareModal(false);
      }
    }, 500);
  };

  // Handle invalid game ID
  useEffect(() => {
    if (!game) {
      Alert.alert("Game Not Found", "This game no longer exists or has been deleted.", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }
  }, [game, navigation]);

  // Move all hooks before any conditional returns
  useEffect(() => {
    if (game) {
      const activeSets = game.activeSets.map(setId => sets[setId]);
      if (activeSets.length === 0 && setIdList.length > 0) {
        setActiveSets(gameId, setIdList.slice(0, 5));
      }
    }
  }, [game, sets, setIdList, gameId, setActiveSets]);

  // Auto-show substitutions when there are no active players
  useEffect(() => {
    if (game && game.activePlayers.length === 0) {
      setShowSubstitutions(true);
    }
  }, [game]);

  useEffect(() => {
    if (!game) return;

    const createGameCompletionActions = (): GameCompletionActions => ({
      markGameAsFinished: () => useGameStore.getState().markGameAsFinished(gameId),
      updateTeamGameNumbers: (teamId: string, result: Result) =>
        useTeamStore.getState().updateGamesPlayed(teamId, result),
      updatePlayerGameNumbers: (playerId: string, result: Result) =>
        usePlayerStore.getState().updateGamesPlayed(playerId, result),
      getCurrentGame: () => useGameStore.getState().games[gameId],
    });

    const handleAppStateChange = (nextAppState: string) => {
      if ((nextAppState === "background" || nextAppState === "inactive") && !game.isFinished) {
        const actions = createGameCompletionActions();
        completeGameAutomatically(game, gameId, teamId, actions, "AppState");
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, teamId, game?.gamePlayedList, game?.isFinished, game?.statTotals]);

  // Handle navigation away from game (back button, swipe, tab switch)
  useEffect(() => {
    if (!game) return;

    const createGameCompletionActions = (): GameCompletionActions => ({
      markGameAsFinished: () => useGameStore.getState().markGameAsFinished(gameId),
      updateTeamGameNumbers: (teamId: string, result: Result) =>
        useTeamStore.getState().updateGamesPlayed(teamId, result),
      updatePlayerGameNumbers: (playerId: string, result: Result) =>
        usePlayerStore.getState().updateGamesPlayed(playerId, result),
      getCurrentGame: () => useGameStore.getState().games[gameId],
    });

    const unsubscribe = navigation.addListener("beforeRemove", () => {
      if (!game.isFinished) {
        const actions = createGameCompletionActions();
        completeGameAutomatically(game, gameId, teamId, actions, "Navigation");
      }
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, gameId, teamId, game?.isFinished, game?.gamePlayedList, game?.statTotals]);

  useLayoutEffect(() => {
    if (!game) return;

    const completeGame = () => {
      if (!gameHasPlays(game)) {
        Alert.alert(
          "No Plays Recorded",
          "This game has no plays recorded. Are you sure you want to mark it as complete?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Complete Anyway",
              style: "destructive",
              onPress: () => {
                const createGameCompletionActions = (): GameCompletionActions => ({
                  markGameAsFinished: () => useGameStore.getState().markGameAsFinished(gameId),
                  updateTeamGameNumbers: (teamId: string, result: Result) =>
                    useTeamStore.getState().updateGamesPlayed(teamId, result),
                  updatePlayerGameNumbers: (playerId: string, result: Result) =>
                    usePlayerStore.getState().updateGamesPlayed(playerId, result),
                  getCurrentGame: () => useGameStore.getState().games[gameId],
                });
                const actions = createGameCompletionActions();
                completeGameManually(game, gameId, teamId, actions);
              },
            },
          ],
        );
        return;
      }

      const createGameCompletionActions = (): GameCompletionActions => ({
        markGameAsFinished: () => useGameStore.getState().markGameAsFinished(gameId),
        updateTeamGameNumbers: (teamId: string, result: Result) =>
          useTeamStore.getState().updateGamesPlayed(teamId, result),
        updatePlayerGameNumbers: (playerId: string, result: Result) =>
          usePlayerStore.getState().updateGamesPlayed(playerId, result),
        getCurrentGame: () => useGameStore.getState().games[gameId],
      });
      const actions = createGameCompletionActions();
      completeGameManually(game, gameId, teamId, actions);
    };

    if (game.isFinished) {
      navigation.setOptions({
        title: `vs ${game.opposingTeamName}`,
        headerLeft: () => <StandardBackButton onPress={() => navigation.goBack()} />,
        headerRight: () => (
          <Pressable hitSlop={20} onPress={() => setShowEditModal(true)}>
            <Text style={styles.headerButtonText}>Edit</Text>
          </Pressable>
        ),
      });
    } else {
      navigation.setOptions({
        headerLeft: () => <StandardBackButton onPress={() => navigation.goBack()} />,
        headerRight: () =>
          showSubstitutions ? null : (
            <Pressable hitSlop={20} onPress={completeGame}>
              <Text style={styles.headerButtonText}>Done</Text>
            </Pressable>
          ),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    game?.isFinished,
    gameId,
    teamId,
    game?.gamePlayedList,
    game?.statTotals,
    navigation,
    isSharing,
    showSubstitutions,
  ]);

  // Show loading or error state if game doesn't exist
  if (!game) {
    return <LoadingState message="Loading game..." />;
  }

  const activePlayers = game.activePlayers
    .map(playerId => players[playerId])
    .filter(player => player !== undefined); // Filter out undefined players
  const activeSets = game.activeSets.map(setId => sets[setId]);

  //STAT FUNCTIONS
  type StatUpdateType = {
    stats: Stat[];
    gameId: string;
    teamId: string;
    playerId: string;
    setId: string;
  };

  // Create store actions for the stat update logic
  const storeActions: StatUpdateStoreActions = {
    updateBoxScore,
    updateTotals,
    updatePeriods,
    updateGameSetStats,
    incrementSetRunCount: updateGameSetCounts,
    updateTeamStats,
    updatePlayerStats,
    updateSetStats,
    incrementGlobalSetRunCount: updateSetRunCount,
  };

  function handleStatUpdate({ stats, gameId, teamId, playerId, setId }: StatUpdateType) {
    // Use the extracted stat update logic
    handleStatUpdateLogic(storeActions, {
      stats,
      gameId,
      teamId,
      playerId,
      setId,
      selectedPeriod,
      activePlayers: game?.activePlayers || [],
    });
  }

  // Helper function for plus/minus updates (used in reversePlayStats)
  const updatePlusMinus = (team: Team, amount: number) => {
    const adjustedAmount = team === Team.Opponent ? -amount : amount;

    // Update team plus/minus
    updateTeamStats(teamId, Stat.PlusMinus, adjustedAmount, Team.Us);
    updateTotals(gameId, Stat.PlusMinus, adjustedAmount, Team.Us);

    updateTeamStats(teamId, Stat.PlusMinus, -adjustedAmount, Team.Opponent);
    updateTotals(gameId, Stat.PlusMinus, -adjustedAmount, Team.Opponent);

    // Update plus/minus for all active players
    game?.activePlayers.forEach(playerId => {
      updateBoxScore(gameId, playerId, Stat.PlusMinus, adjustedAmount);
      updatePlayerStats(playerId, Stat.PlusMinus, adjustedAmount);
    });
  };
  const reversePlayStats = (playToRemove: PlayByPlayType) => {
    const team = playToRemove.playerId === "Opponent" ? Team.Opponent : Team.Us;
    const statsToReverse = getStatsForAction(playToRemove.action);

    // Reverse each stat that was added
    statsToReverse.forEach(stat => {
      // Reverse all the updates (subtract instead of add)
      updateBoxScore(gameId, playToRemove.playerId, stat, -1);
      updateTotals(gameId, stat, -1, team);
      updatePlayerStats(playToRemove.playerId, stat, -1);
      updateTeamStats(teamId, stat, -1, team);

      // Handle points reversal for scoring plays
      switch (stat) {
        case Stat.FreeThrowsMade:
          updateTotals(gameId, Stat.Points, -1, team);
          updateBoxScore(gameId, playToRemove.playerId, Stat.Points, -1);
          updatePlayerStats(playToRemove.playerId, Stat.Points, -1);
          updateTeamStats(teamId, Stat.Points, -1, team);
          updatePlusMinus(team, -1);
          break;
        case Stat.TwoPointMakes:
          updateTotals(gameId, Stat.Points, -2, team);
          updateBoxScore(gameId, playToRemove.playerId, Stat.Points, -2);
          updatePlayerStats(playToRemove.playerId, Stat.Points, -2);
          updateTeamStats(teamId, Stat.Points, -2, team);
          updatePlusMinus(team, -2);
          break;
        case Stat.ThreePointMakes:
          updateTotals(gameId, Stat.Points, -3, team);
          updateBoxScore(gameId, playToRemove.playerId, Stat.Points, -3);
          updatePlayerStats(playToRemove.playerId, Stat.Points, -3);
          updateTeamStats(teamId, Stat.Points, -3, team);
          updatePlusMinus(team, -3);
          break;
      }
    });
  };

  const removePlay = (playIndex: number, period: number) => {
    // Check if period and playByPlay exist before accessing
    if (!game.periods?.[period]?.playByPlay) {
      console.log("No playByPlay data for this period");
      return;
    }

    const playToRemove = game.periods[period].playByPlay[playIndex];
    if (!playToRemove) {
      console.log("No play to remove");
      return;
    }

    Alert.alert(
      "Delete Play",
      `Remove ${playToRemove.action} by ${playToRemove.playerId === "Opponent" ? "Opponent" : players[playToRemove.playerId]?.name}?`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Reverse the stats
            reversePlayStats(playToRemove);
            // Remove from playByPlay array
            removePlayFromPeriod(gameId, period, playIndex);
            console.log("Successfully deleted play:", playToRemove);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const handlePlayerPress = (playerId: string) => {
    setSelectedPlayer(playerId);
    setShowOverlay(true);
  };

  const handleStatPress = (category: ActionType, action: string) => {
    console.log("Action Type:", category, "Action Key:", action);

    const stats = StatMapping[category]?.[action];

    if (!stats) {
      console.error("Invalid action:", action);
      return;
    }

    handleStatUpdate({
      stats,
      gameId,
      teamId,
      playerId: selectedPlayer,
      setId: selectedPlay,
    });
    handleCloseOverlay();

    if (stats.includes(Stat.FreeThrowsMade) || stats.includes(Stat.FreeThrowsAttempted)) {
      setFreeThrowToggle(true);
    }

    const newActionPostFreeThrow =
      freeThrowToggle === true &&
      (!stats.includes(Stat.FreeThrowsMade) || !stats.includes(Stat.FreeThrowsAttempted));

    //if play has concluded reset the selected play
    if (
      selectedPlayer !== "Opponent" &&
      (stats.includes(Stat.TwoPointMakes) ||
        stats.includes(Stat.TwoPointAttempts) ||
        stats.includes(Stat.ThreePointMakes) ||
        stats.includes(Stat.ThreePointAttempts) ||
        stats.includes(Stat.Turnovers) ||
        newActionPostFreeThrow)
    ) {
      updateSetRunCount(selectedPlay);
      updateGameSetCounts(gameId, selectedPlay);
      setSelectedPlay("");
      setFreeThrowToggle(false);
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  if (game.isFinished) {
    return (
      <View style={styles.container}>
        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "boxscore" && styles.activeTab]}
            onPress={() => setActiveTab("boxscore")}
          >
            <Text style={[styles.tabText, activeTab === "boxscore" && styles.activeTabText]}>
              Box Score
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "playbyplay" && styles.activeTab]}
            onPress={() => setActiveTab("playbyplay")}
          >
            <Text style={[styles.tabText, activeTab === "playbyplay" && styles.activeTabText]}>
              Play-by-Play
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {activeTab === "boxscore" ? (
            <View style={styles.boxScoreContainer}>
              <BoxScoreOverlay gameId={gameId} onClose={() => {}} hideCloseButton={true} />
            </View>
          ) : (
            <CompletedGamePlayByPlay gameId={gameId} />
          )}
        </View>

        {/* Bottom Action Buttons */}
        <View style={styles.bottomActionsContainer}>
          <Pressable
            style={styles.actionButton}
            onPress={isSharing ? () => {} : handleShare}
            disabled={isSharing}
          >
            <Feather
              name={isSharing ? "loader" : "upload"}
              size={20}
              color={theme.colorOrangePeel}
            />
            <Text style={styles.actionButtonText}>{isSharing ? "Sharing..." : "Share Game"}</Text>
          </Pressable>
        </View>

        {/* Edit Game Modal */}
        <EditGameModal
          gameId={gameId}
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onDelete={() => navigation.goBack()}
        />

        {/* Hidden Modal for Capturing Full Box Score for Share */}
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
              <ShareableBoxScore game={game} players={players} />
            </ViewShot>
          </View>
        </Modal>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <View style={styles.teamsContainer}>
        <MatchUpDisplay game={game} />
      </View>
      {showOverlay ? (
        <StatOverlay onClose={handleCloseOverlay} onStatPress={handleStatPress} />
      ) : showSets ? (
        <SetOverlay gameId={gameId} onClose={() => setShowSets(false)} />
      ) : showSubstitutions || activePlayers.length === 0 ? (
        <SubstitutionOverlay
          gameId={gameId}
          onClose={() => {
            setShowSubstitutions(false);
            // Force a re-render to check if activePlayers.length > 0 after substitution
          }}
        />
      ) : showBoxScore ? (
        <BoxScoreOverlay gameId={gameId} onClose={() => setShowBoxScore(false)} />
      ) : (
        <View>
          <View style={styles.periodContainer}>
            <Pressable
              hitSlop={20}
              onPress={() => setSelectedPeriod(selectedPeriod - 1)}
              disabled={selectedPeriod === 0}
            >
              <Ionicons
                name="arrow-undo-circle"
                size={30}
                color={selectedPeriod === 0 ? theme.colorLightGrey : theme.colorOrangePeel}
              />
            </Pressable>
            {selectedPeriod + 1 <= game.periodType ? (
              // regulation
              game.periodType === PeriodType.Quarters ? (
                <Text style={styles.heading}>Q{selectedPeriod + 1}</Text>
              ) : (
                <Text style={styles.heading}>Half {selectedPeriod + 1}</Text>
              )
            ) : (
              <Text style={styles.heading}>OT{selectedPeriod + 1 - game.periodType}</Text>
            )}

            <Pressable hitSlop={20} onPress={() => setSelectedPeriod(selectedPeriod + 1)}>
              <Ionicons name="arrow-redo-circle" size={30} color={theme.colorOrangePeel} />
            </Pressable>
          </View>
          <View style={styles.playByPlayContainer}>
            <PlayByPlay gameId={gameId} period={selectedPeriod} onDeletePlay={removePlay} />
          </View>
          <View style={styles.bottomSection}>
            <View style={styles.section}>
              <View style={styles.headingRow}>
                <Text style={styles.heading}>Sets</Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => setShowSetsSection(prev => !prev)}
                  accessibilityRole="button"
                  accessibilityLabel={showSetsSection ? "Collapse sets" : "Expand sets"}
                >
                  <Ionicons
                    name={showSetsSection ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={theme.colorOrangePeel}
                  />
                </Pressable>
              </View>
              {showSetsSection && (
                <View style={styles.rowContainer}>
                  {activeSets.map(set => (
                    <SetRadioButton
                      key={set.id}
                      title={set.name}
                      selected={selectedPlay === set.id}
                      onPress={() => setSelectedPlay(set.id)}
                    />
                  ))}
                  <SetRadioButton
                    title="Reset"
                    selected={false}
                    onPress={() => setSelectedPlay("")}
                    reset={true}
                  />
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.heading}>Players</Text>
              <View style={styles.rowContainer}>
                {activePlayers.map(player => (
                  <GamePlayerButton
                    key={player.id}
                    player={player}
                    onPress={() => handlePlayerPress(player.id)}
                    size={showSetsSection ? "normal" : "large"}
                  />
                ))}
                <GamePlayerButton
                  onPress={() => handlePlayerPress("Opponent")}
                  opponentName={game.opposingTeamName}
                  size={showSetsSection ? "normal" : "large"}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.rowContainer}>
                <View style={styles.split}>
                  <StatLineButton onPress={() => setShowSubstitutions(true)} title="Sub Players" />
                </View>
                <View style={styles.split}>
                  <StatLineButton
                    onPress={() => setShowSets(true)}
                    title="Change Sets"
                    color={theme.colorBlue}
                  />
                </View>
                <View style={styles.split}>
                  <StatLineButton
                    onPress={() => setShowBoxScore(true)}
                    title="Box Score"
                    color={theme.colorOnyx}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
    backgroundColor: theme.colorWhite,
  },
  teamsContainer: {
    padding: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  playByPlayContainer: {
    flex: 1,
    marginTop: 4,
    marginBottom: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 140,
  },
  bottomSection: {
    justifyContent: "flex-end",
  },
  section: {
    marginBottom: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 2,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  split: {
    flex: 1,
    maxWidth: "50%",
  },
  periodContainer: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30, // Adds spacing between the icons and text
  },
  headerButtonText: {
    color: theme.colorOrangePeel,
    fontSize: 16,
    fontWeight: "600",
  },
  hiddenModalContainer: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  boxScoreContainer: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: theme.colorOrangePeel,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorGrey,
  },
  activeTabText: {
    color: theme.colorWhite,
  },
  contentContainer: {
    flex: 1,
  },
  bottomActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colorWhite,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
    gap: 8,
  },
  actionButtonText: {
    color: theme.colorOrangePeel,
    fontSize: 16,
    fontWeight: "600",
  },
});
