import { StatLineButton } from "@/components/StatLineButton";
import { GamePlayerButton } from "@/components/GamePlayerButton";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useTeamStore } from "@/store/teamStore";
import { ActionType, Stat, StatMapping } from "@/types/stats";
import { useNavigation, useRoute } from "@react-navigation/core";
import { useEffect, useLayoutEffect, useState, useRef, useCallback, useMemo } from "react";
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
import { HeaderTextButton } from "@/components/HeaderTextButton";
import { theme } from "@/theme";
import { scale, moderateScale } from "@/utils/responsive";
import { SetRadioButton } from "@/components/SetRadioButton";
import { useSetStore } from "@/store/setStore";
import StatOverlay from "@/components/gamePage/StatOverlay";
import SetOverlay from "@/components/gamePage/SetOverlay";
import SubstitutionOverlay from "@/components/gamePage/SubstitutionOverlay";
import UnifiedPlayByPlay from "@/components/gamePage/UnifiedPlayByPlay";
import BoxScoreOverlay from "@/components/gamePage/BoxScoreOverlay";
import CompletedUnifiedPlayByPlay from "@/components/gamePage/CompletedUnifiedPlayByPlay";
import Ionicons from "@expo/vector-icons/Ionicons";
import Feather from "@expo/vector-icons/Feather";
import MatchUpDisplay from "@/components/MatchUpDisplay";
import { Result } from "@/types/player";
import {
  completeGameAutomatically,
  completeGameManually,
  gameHasPlays,
  GameCompletionActions,
} from "@/logic/gameCompletion";
import { LoadingState } from "@/components/LoadingState";
import ViewShot from "react-native-view-shot";
import { shareBoxScoreImage } from "@/utils/shareBoxScore";
import ShareableBoxScore from "@/components/gamePage/ShareableBoxScore";
import { sanitizeFileName } from "@/utils/filename";
import { StandardBackButton } from "@/components/StandardBackButton";
import { EditGameModal } from "@/components/EditGameModal";
import { handleStatUpdate as handleStatUpdateLogic, handleStatReversal } from "@/logic/statUpdates";
import { shouldResetSet } from "@/logic/setResetLogic";
import type { StatUpdateStoreActions } from "@/logic/statUpdates";
import type { PlayByPlayType } from "@/types/game";
import { useHelpStore } from "@/store/helpStore";
import { useReviewStore } from "@/store/reviewStore";
import { triggerReviewIfEligible } from "@/logic/reviewPrompt";
import { ContextualTooltip } from "@/components/shared/ContextualTooltip";

export default function GamePage() {
  const { gameId } = useRoute().params as { gameId: string }; // Access playerId from route params

  const players = usePlayerStore(state => state.players);
  const teamId = useTeamStore(state => state.currentTeamId);
  const getTeamSafely = useTeamStore(state => state.getTeamSafely);
  const getGameSafely = useGameStore(state => state.getGameSafely);
  const game = useGameStore(state => state.games[gameId]);

  const sets = useSetStore(state => state.sets);

  // Memoize derived set calculations to prevent unnecessary re-renders
  const teamSets = useMemo(
    () => Object.values(sets).filter(set => set.teamId === teamId),
    [sets, teamId],
  );
  const setIdList = useMemo(() => teamSets.map(set => set.id), [teamSets]);

  const navigation = useNavigation();

  const setActiveSets = useGameStore(state => state.setActiveSets);

  const [selectedPlay, setSelectedPlay] = useState<string>("");
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(false);
  const [showSets, setShowSets] = useState(false);
  const [showBoxScore, setShowBoxScore] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");

  const [isSharing, setIsSharing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const shareableRef = useRef<ViewShot>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetsSection, setShowSetsSection] = useState(teamSets.length > 0);
  const [activeTab, setActiveTab] = useState<"boxscore" | "playbyplay">("boxscore");
  const [expandPlayByPlay, setExpandPlayByPlay] = useState(false);

  // Current period for UI display (which period is visible in play-by-play)
  // Note: Stats are always recorded to the latest period, not this viewing period
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    if (game && !game.isFinished && game.periods && game.periods.length > 0) {
      return game.periods.length - 1;
    }
    return 0;
  });

  // Help hints
  const hasHydrated = useHelpStore(state => state._hasHydrated);
  const hasSeenGameFlowHint = useHelpStore(state => state.hasSeenGameFlowHint);
  const hasSeenSetResetHint = useHelpStore(state => state.hasSeenSetResetHint);
  const markHintAsSeen = useHelpStore(state => state.markHintAsSeen);
  const [showGameFlowHint, setShowGameFlowHint] = useState(false);
  const [showSetResetHint, setShowSetResetHint] = useState(false);

  //game stats - individual methods (legacy fallback)
  const updateBoxScore = useGameStore(state => state.updateBoxScore);
  const updateTotals = useGameStore(state => state.updateTotals);
  const updatePeriods = useGameStore(state => state.updatePeriods);
  const updateGameSetStats = useGameStore(state => state.updateSetStats);
  const updateGameSetCounts = useGameStore(state => state.incrementSetRunCount);
  // Batched game update (performance optimization)
  const batchGameUpdate = useGameStore(state => state.batchStatUpdate);

  //team stats
  const updateTeamStats = useTeamStore(state => state.updateStats);
  // Batched team update (performance optimization)
  const batchTeamUpdate = useTeamStore(state => state.batchUpdateStats);

  //player stats
  const updatePlayerStats = usePlayerStore(state => state.updateStats);
  // Batched player update (performance optimization)
  const batchPlayerUpdate = usePlayerStore(state => state.batchUpdateStats);

  //set stats
  const updateSetStats = useSetStore(state => state.updateStats);
  const updateSetRunCount = useSetStore(state => state.incrementRunCount);
  // Batched set update (performance optimization)
  const batchSetUpdate = useSetStore(state => state.batchUpdateStats);

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

  // Show game flow hint on first game visit (only for active games) - wait for hydration
  useEffect(() => {
    // Only show game flow hint if:
    // 1. Store has hydrated from AsyncStorage
    // 2. Game exists and is not finished
    // 3. User hasn't seen the hint
    // 4. Substitution overlay is NOT showing (priority to substitution hint)
    if (hasHydrated && game && !game.isFinished && !hasSeenGameFlowHint && !showSubstitutions) {
      setShowGameFlowHint(true);
      // Mark as seen immediately when shown (not on dismiss)
      markHintAsSeen("gameFlow");
    }
  }, [hasHydrated, game, hasSeenGameFlowHint, markHintAsSeen, showSubstitutions]);

  // Reset overlay states when game finishes to ensure clean render
  useLayoutEffect(() => {
    if (game?.isFinished) {
      setShowOverlay(false);
      setShowSets(false);
      setShowBoxScore(false);
      setShowSubstitutions(false);
      setShowEditModal(false);
    }
  }, [game?.isFinished]);

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
      // Show confirmation dialog before completing the game
      Alert.alert(
        "Complete Game",
        "Are you sure you want to complete this game? This action will mark the game as finished.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Complete",
            style: "default",
            onPress: () => {
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
                          markGameAsFinished: () =>
                            useGameStore.getState().markGameAsFinished(gameId),
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

              // Request App Store review at milestones (fire-and-forget)
              const finishedCount = Object.values(useGameStore.getState().games).filter(
                g => g.isFinished,
              ).length;
              const { reviewPromptsShown, incrementPromptsShown } = useReviewStore.getState();
              triggerReviewIfEligible(finishedCount, reviewPromptsShown, incrementPromptsShown);
            },
          },
        ],
      );
    };

    if (game.isFinished) {
      navigation.setOptions({
        title: `vs ${game.opposingTeamName}`,
        headerLeft: () => <StandardBackButton onPress={() => navigation.goBack()} />,
        headerRight: () => <HeaderTextButton label="Edit" onPress={() => setShowEditModal(true)} />,
      });
    } else {
      navigation.setOptions({
        headerLeft: () => null,
        headerBackVisible: false,
        gestureEnabled: false,
        headerRight: () =>
          showSubstitutions ? null : <HeaderTextButton label="Done" onPress={completeGame} />,
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

  // Memoized handlers - must be before conditional returns
  const handlePlayerPress = useCallback((playerId: string) => {
    setSelectedPlayer(playerId);
    setShowOverlay(true);
  }, []);

  // Handler for long-press on player buttons to trigger team stat recording
  const handleTeamStatPress = useCallback(() => {
    setSelectedPlayer("Team");
    setShowOverlay(true);
  }, []);

  const handleSetSelection = useCallback(
    (setId: string) => {
      setSelectedPlay(setId);
      // Show set reset hint on first set selection - check hydration
      if (hasHydrated && !hasSeenSetResetHint && setId !== "") {
        setShowSetResetHint(true);
        // Mark as seen immediately when shown (not on dismiss)
        markHintAsSeen("setReset");
      }
    },
    [hasHydrated, hasSeenSetResetHint, markHintAsSeen],
  );

  const handleResetSet = useCallback(() => {
    setSelectedPlay("");
  }, []);

  const handleDismissGameFlowHint = useCallback(() => {
    setShowGameFlowHint(false);
  }, []);

  const handleDismissSetResetHint = useCallback(() => {
    setShowSetResetHint(false);
  }, []);

  const handleShowSubstitutions = useCallback(() => {
    setShowSubstitutions(true);
  }, []);

  const handleShowSets = useCallback(() => {
    setShowSets(true);
  }, []);

  const handleShowBoxScore = useCallback(() => {
    setShowBoxScore(true);
  }, []);

  const handleToggleSetsSection = useCallback(() => {
    setShowSetsSection(prev => !prev);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowOverlay(false);
  }, []);

  // Callback for when a play is about to be deleted - reverse stats before removal
  const handlePlayDelete = useCallback(
    (play: PlayByPlayType, _periodIndex: number) => {
      // Create store actions for the stat reversal logic
      const storeActionsForReversal: StatUpdateStoreActions = {
        updateBoxScore,
        updateTotals,
        updatePeriods,
        updateGameSetStats,
        incrementSetRunCount: updateGameSetCounts,
        updateTeamStats,
        updatePlayerStats,
        updateSetStats,
        incrementGlobalSetRunCount: updateSetRunCount,
        batchGameUpdate,
        batchPlayerUpdate,
        batchTeamUpdate,
        batchSetUpdate,
      };

      handleStatReversal(storeActionsForReversal, {
        play,
        gameId,
        teamId,
        currentActivePlayers: game?.activePlayers || [],
        currentSetId: selectedPlay,
      });
    },
    [
      gameId,
      teamId,
      game?.activePlayers,
      selectedPlay,
      updateBoxScore,
      updateTotals,
      updatePeriods,
      updateGameSetStats,
      updateGameSetCounts,
      updateTeamStats,
      updatePlayerStats,
      updateSetStats,
      updateSetRunCount,
      batchGameUpdate,
      batchPlayerUpdate,
      batchTeamUpdate,
      batchSetUpdate,
    ],
  );

  // Memoize player and set lookups to prevent unnecessary array creation on every render
  // These must be before the conditional return to satisfy React hooks rules
  const activePlayers = useMemo(
    () =>
      (game?.activePlayers ?? [])
        .map(playerId => players[playerId])
        .filter(player => player !== undefined),
    [game?.activePlayers, players],
  );
  const activeSets = useMemo(
    () => (game?.activeSets ?? []).map(setId => sets[setId]).filter(Boolean),
    [game?.activeSets, sets],
  );

  // Show loading or error state if game doesn't exist
  if (!game) {
    return <LoadingState message="Loading game..." />;
  }

  //STAT FUNCTIONS
  type StatUpdateType = {
    stats: Stat[];
    gameId: string;
    teamId: string;
    playerId: string;
    setId: string;
  };

  // Create store actions for the stat update logic
  // Includes both individual methods (legacy) and batched methods (optimized)
  const storeActions: StatUpdateStoreActions = {
    // Individual methods (legacy fallback)
    updateBoxScore,
    updateTotals,
    updatePeriods,
    updateGameSetStats,
    incrementSetRunCount: updateGameSetCounts,
    updateTeamStats,
    updatePlayerStats,
    updateSetStats,
    incrementGlobalSetRunCount: updateSetRunCount,
    // Batched methods (performance optimization - 4 store updates instead of 15+)
    batchGameUpdate,
    batchPlayerUpdate,
    batchTeamUpdate,
    batchSetUpdate,
  };

  function handleStatUpdate({ stats, gameId, teamId, playerId, setId }: StatUpdateType) {
    const currentGame = getGameSafely(gameId);
    // Always record stats to the current (last) period, not the viewed period
    const selectedPeriod = currentGame?.periods ? Math.max(0, currentGame.periods.length - 1) : 0;

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

  const handleStatPress = (category: ActionType, action: string) => {
    const stats = StatMapping[category]?.[action];

    if (!stats) {
      console.error("Invalid action:", action);
      return;
    }

    const isOpponent = selectedPlayer === "Opponent";

    // Record the stat
    handleStatUpdate({
      stats,
      gameId,
      teamId,
      playerId: selectedPlayer,
      setId: selectedPlay,
    });
    handleCloseOverlay();

    // Reset set if opponent gained possession (possession-based set tracking)
    if (shouldResetSet(stats, isOpponent) && selectedPlay) {
      updateSetRunCount(selectedPlay);
      updateGameSetCounts(gameId, selectedPlay);
      setSelectedPlay("");
    }
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
        <View style={styles.contentContainer} key={`content-${gameId}-${game.isFinished}`}>
          {activeTab === "boxscore" ? (
            <BoxScoreOverlay gameId={gameId} onClose={() => {}} hideCloseButton={true} />
          ) : (
            <CompletedUnifiedPlayByPlay gameId={gameId} />
          )}
        </View>

        {/* Bottom Action Buttons - Only show when Box Score tab is active */}
        {activeTab === "boxscore" && (
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
              <Text style={styles.actionButtonText}>
                {isSharing ? "Sharing..." : "Share Box Score"}
              </Text>
            </Pressable>
          </View>
        )}

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

      {/* Absolute Positioned Tooltips Over Play-by-Play - Only show when NOT in overlay mode */}
      {!showOverlay && !showSets && !showSubstitutions && !showBoxScore && showGameFlowHint && (
        <View style={styles.absoluteTooltipContainer} pointerEvents="box-none">
          <ContextualTooltip
            message="Tap a player, then select their action. Optional: Tap a set first to track which plays you run."
            onDismiss={handleDismissGameFlowHint}
            autoDismiss={true}
            autoDismissDelay={10000}
          />
        </View>
      )}

      {!showOverlay && !showSets && !showSubstitutions && !showBoxScore && showSetResetHint && (
        <View style={styles.absoluteTooltipContainer} pointerEvents="box-none">
          <ContextualTooltip
            message="Sets stay active for the entire possession. They reset on turnovers or when the opponent gains the ball."
            onDismiss={handleDismissSetResetHint}
            autoDismiss={true}
            autoDismissDelay={10000}
          />
        </View>
      )}

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
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.playByPlayContainer,
              expandPlayByPlay && styles.playByPlayContainerExpanded,
            ]}
          >
            <UnifiedPlayByPlay
              gameId={gameId}
              isExpanded={expandPlayByPlay}
              onToggleExpand={() => setExpandPlayByPlay(!expandPlayByPlay)}
              currentPeriod={currentPeriod}
              onPeriodChange={setCurrentPeriod}
              onBeforeDelete={handlePlayDelete}
            />
          </View>
          <View style={[styles.bottomSection, expandPlayByPlay && styles.bottomSectionMinimized]}>
            <View style={styles.section}>
              <View style={styles.headingRowWithToggle}>
                <View style={styles.centeredHeadingWrapper}>
                  <Text style={styles.heading}>Sets</Text>
                  <Pressable
                    hitSlop={10}
                    onPress={handleToggleSetsSection}
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
              </View>
              {showSetsSection && (
                <View style={styles.rowContainer}>
                  {activeSets.map(set => (
                    <SetRadioButton
                      key={set.id}
                      title={set.name}
                      selected={selectedPlay === set.id}
                      onPress={handleSetSelection}
                      setId={set.id}
                    />
                  ))}
                  <SetRadioButton
                    title="Reset"
                    selected={false}
                    onPress={handleResetSet}
                    setId=""
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
                    onPress={handlePlayerPress}
                    onLongPress={handleTeamStatPress}
                    size={showSetsSection ? "normal" : "large"}
                    allowMultilineText={!showSetsSection}
                  />
                ))}
                <GamePlayerButton
                  onPress={handlePlayerPress}
                  opponentName={game.opposingTeamName}
                  size={showSetsSection ? "normal" : "large"}
                  allowMultilineText={!showSetsSection}
                />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.rowContainer}>
                <View style={styles.split}>
                  <StatLineButton onPress={handleShowSubstitutions} title="Sub Players" />
                </View>
                <View style={styles.split}>
                  <StatLineButton
                    onPress={handleShowSets}
                    title="Change Sets"
                    color={theme.colorBlue}
                  />
                </View>
                <View style={styles.split}>
                  <StatLineButton
                    onPress={handleShowBoxScore}
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
    paddingHorizontal: scale(10),
    backgroundColor: theme.colorWhite,
  },
  teamsContainer: {
    padding: scale(4),
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scale(10),
  },
  playByPlayContainer: {
    flex: 2,
    marginTop: scale(4),
    marginBottom: scale(6),
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  playByPlayContainerExpanded: {
    flex: 8,
    marginBottom: 0,
  },
  bottomSection: {
    justifyContent: "flex-end",
  },
  bottomSectionMinimized: {
    display: "none",
  },
  section: {
    marginBottom: scale(4),
  },
  heading: {
    fontSize: moderateScale(14),
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: scale(2),
  },
  headingRowWithToggle: {
    alignItems: "center",
    justifyContent: "center",
  },
  centeredHeadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(4),
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: scale(6),
    marginBottom: scale(6),
    flexWrap: "wrap",
  },
  split: {
    flex: 1,
    maxWidth: "50%",
  },
  hiddenModalContainer: {
    position: "absolute",
    left: -9999,
    top: -9999,
    opacity: 0,
  },
  tabSwitcher: {
    flexDirection: "row",
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(8),
    marginHorizontal: scale(20),
    marginTop: scale(12),
    marginBottom: scale(8),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
  },
  tab: {
    flex: 1,
    paddingVertical: scale(10),
    paddingHorizontal: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: theme.colorOrangePeel,
  },
  tabText: {
    fontSize: moderateScale(14),
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
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    backgroundColor: theme.colorWhite,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    gap: scale(12),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colorWhite,
    borderWidth: 1,
    borderColor: theme.colorOrangePeel,
    borderRadius: scale(8),
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    flex: 1,
    gap: scale(8),
  },
  actionButtonText: {
    color: theme.colorOrangePeel,
    fontSize: moderateScale(16),
    fontWeight: "600",
  },
  absoluteTooltipContainer: {
    position: "absolute",
    top: scale(160),
    left: scale(14),
    right: scale(14),
    zIndex: 900,
  },
});
