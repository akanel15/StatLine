import { useState, useEffect, memo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import * as Haptics from "expo-haptics";
import { StatLineButton } from "@/components/StatLineButton";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { theme } from "@/theme";
import { PlayerType } from "@/types/player";
import { PlayerImage } from "../PlayerImage";
import { useHelpStore } from "@/store/helpStore";
import { ContextualTooltip } from "@/components/shared/ContextualTooltip";
import { scale, moderateScale } from "@/utils/responsive";
import { parseClockInput } from "@/logic/minutesCalculation";

type SubstitutionOverlayProps = {
  gameId: string;
  currentPeriod: number;
  onClose: () => void;
};

// Wrapped with memo to prevent unnecessary re-renders when parent state changes
const SubstitutionOverlay = memo(function SubstitutionOverlay({
  gameId,
  currentPeriod,
  onClose,
}: SubstitutionOverlayProps) {
  const game = useGameStore(state => state.games[gameId]);
  const addPlayerToGamePlayed = useGameStore(state => state.addPlayersToGamePlayedList);

  const players = usePlayerStore(state => state.players);
  const playersList = Object.values(players);
  const teamPlayers = playersList.filter(player => player.teamId === game.teamId);

  const setActivePlayers = useGameStore(state => state.setActivePlayers);
  const recordSubstitutionTime = useGameStore(state => state.recordSubstitutionTime);

  // Minutes tracking state
  const minutesTracking = game.minutesTracking;
  const isMinutesEnabled = minutesTracking?.enabled ?? false;
  const periodLengthSeconds = minutesTracking?.periodLength ?? 600;

  const getInitialClockMinutes = () => {
    if (!isMinutesEnabled) return "0";
    const initSeconds =
      minutesTracking?.lastSubPeriod === currentPeriod && minutesTracking?.lastSubTime !== undefined
        ? minutesTracking.lastSubTime
        : periodLengthSeconds;
    return Math.floor(initSeconds / 60).toString();
  };
  const getInitialClockSeconds = () => {
    if (!isMinutesEnabled) return "00";
    const initSeconds =
      minutesTracking?.lastSubPeriod === currentPeriod && minutesTracking?.lastSubTime !== undefined
        ? minutesTracking.lastSubTime
        : periodLengthSeconds;
    return (initSeconds % 60).toString().padStart(2, "0");
  };

  const [clockMinutes, setClockMinutes] = useState(getInitialClockMinutes);
  const [clockSeconds, setClockSeconds] = useState(getInitialClockSeconds);
  const clockTouched = useRef(false);
  const secondsInputRef = useRef<TextInput>(null);

  const activePlayers = game.activePlayers
    .map(playerId => players[playerId])
    .filter(player => player !== undefined); // Filter out undefined players

  // Default to first 5 players (or all if less than 5) as active if none selected
  const defaultActivePlayers = activePlayers.length === 0 ? teamPlayers.slice(0, 5) : activePlayers;

  const defaultBenchPlayers = teamPlayers.filter(player => !defaultActivePlayers.includes(player));

  const [selectedActive, setSelectedActive] = useState<PlayerType[]>(defaultActivePlayers);
  const [selectedBench, setSelectedBench] = useState<PlayerType[]>(defaultBenchPlayers);

  // Help hints
  const hasHydrated = useHelpStore(state => state._hasHydrated);
  const hasSeenSubstitutionHint = useHelpStore(state => state.hasSeenSubstitutionHint);
  const markHintAsSeen = useHelpStore(state => state.markHintAsSeen);
  const [showSubstitutionHint, setShowSubstitutionHint] = useState(false);

  // Show substitution hint on first overlay open - wait for hydration
  useEffect(() => {
    // Only check after store has hydrated from AsyncStorage
    if (hasHydrated && !hasSeenSubstitutionHint) {
      setShowSubstitutionHint(true);
      // Mark as seen immediately when shown (not on dismiss)
      markHintAsSeen("substitution");
    }
  }, [hasHydrated, hasSeenSubstitutionHint, markHintAsSeen]);

  const handleDismissSubstitutionHint = () => {
    setShowSubstitutionHint(false);
  };

  // Toggle active player selection (remove from active)
  const toggleActivePlayer = (player: PlayerType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedActive(prev => prev.filter(p => p.id !== player.id));
    setSelectedBench(prev => [...prev, player]);
  };

  // Toggle bench player selection (add to active)
  const toggleBenchPlayer = (player: PlayerType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedActive(prev => [...prev, player]);
    setSelectedBench(prev => prev.filter(p => p.id !== player.id));
  };

  // Determine if we should show the "unchanged clock" warning
  const showClockWarning = (() => {
    if (!isMinutesEnabled || !minutesTracking) return false;
    // No warning on first confirm in this period
    if (minutesTracking.lastSubPeriod !== currentPeriod) return false;
    if (minutesTracking.lastSubTime === undefined) return false;
    // Only warn if user hasn't touched the clock
    if (clockTouched.current) return false;
    return true;
  })();

  const handleConfirm = () => {
    if (selectedActive.length === 0 || selectedActive.length > 5) {
      Alert.alert("Validation Error", "Please select a valid number of players (1-5).");
      return;
    }

    const activeIds = selectedActive.map(player => player.id);

    // Record stint data if minutes tracking is enabled
    if (isMinutesEnabled) {
      const clockTime = parseClockInput(clockMinutes, clockSeconds, periodLengthSeconds);
      if (clockTime === null) {
        Alert.alert("Invalid Time", "Please enter a valid game clock time.");
        return;
      }

      const previousActiveIds = game.activePlayers;
      const subbedOut = previousActiveIds.filter(id => !activeIds.includes(id));
      const subbedIn = activeIds.filter(id => !previousActiveIds.includes(id));

      recordSubstitutionTime(gameId, currentPeriod, clockTime, subbedOut, subbedIn);
    }

    addPlayerToGamePlayed(gameId, activeIds);
    setActivePlayers(gameId, activeIds);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>Substitutions</Text>

      {/* Game Clock Input */}
      {isMinutesEnabled && (
        <View style={styles.clockContainer}>
          <Text style={styles.clockLabel}>Game Clock</Text>
          <View style={styles.clockInputRow}>
            <TextInput
              style={styles.clockInput}
              keyboardType="number-pad"
              maxLength={2}
              value={clockMinutes}
              onChangeText={text => {
                clockTouched.current = true;
                setClockMinutes(text);
              }}
              onSubmitEditing={() => secondsInputRef.current?.focus()}
              selectTextOnFocus
              testID="clock-minutes-input"
            />
            <Text style={styles.clockColon}>:</Text>
            <TextInput
              ref={secondsInputRef}
              style={styles.clockInput}
              keyboardType="number-pad"
              maxLength={2}
              value={clockSeconds}
              onChangeText={text => {
                clockTouched.current = true;
                setClockSeconds(text);
              }}
              selectTextOnFocus
              testID="clock-seconds-input"
            />
          </View>
          {showClockWarning && (
            <Text style={styles.clockWarning}>Clock unchanged since last sub</Text>
          )}
        </View>
      )}

      {/* Absolute Positioned Tooltip */}
      {showSubstitutionHint && (
        <View style={styles.absoluteTooltipContainer} pointerEvents="box-none">
          <ContextualTooltip
            message="Select 1-5 active players. You can substitute anytime during the game."
            onDismiss={handleDismissSubstitutionHint}
            autoDismiss={true}
            autoDismissDelay={10000}
          />
        </View>
      )}

      <View style={styles.container}>
        {/* Active Players */}
        <View style={styles.column}>
          <Text style={styles.subHeading}>Active Players</Text>
          <FlatList
            data={selectedActive.sort((a, b) => {
              const numA = parseInt(a.number) || 0;
              const numB = parseInt(b.number) || 0;
              return numA - numB;
            })}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.playerBox, styles.activePlayer]}
                onPress={() => toggleActivePlayer(item)}
              >
                <View style={styles.rowCard}>
                  <PlayerImage player={item} size={50}></PlayerImage>
                  <Text style={styles.playerText} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Grey Divider */}
        <View style={styles.divider} />

        {/* Bench Players */}
        <View style={styles.column}>
          <Text style={styles.subHeading}>Bench</Text>
          <FlatList
            data={selectedBench.sort((a, b) => {
              const numA = parseInt(a.number) || 0;
              const numB = parseInt(b.number) || 0;
              return numA - numB;
            })}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.playerBox} onPress={() => toggleBenchPlayer(item)}>
                <View style={styles.rowCard}>
                  <PlayerImage player={item} size={50}></PlayerImage>
                  <Text style={styles.playerText} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
      <View style={styles.section}>
        <View style={styles.rowContainer}>
          <View style={styles.split}>
            <StatLineButton onPress={onClose} title="Cancel" color={theme.colorOnyx} />
          </View>
          <View style={styles.split}>
            <StatLineButton onPress={handleConfirm} title="Confirm" color={theme.colorOrangePeel} />
          </View>
        </View>
      </View>
    </View>
  );
});

export default SubstitutionOverlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colorWhite,
    padding: scale(10),
    justifyContent: "space-between",
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    flexDirection: "row",
    flex: 1,
    marginVertical: scale(20),
  },
  column: {
    flex: 1,
    alignItems: "center",
    overflow: "hidden",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: scale(50),
    paddingHorizontal: scale(10),
    flex: 1,
  },
  playerText: {
    fontSize: moderateScale(16),
    flexShrink: 1,
    flexWrap: "wrap",
    marginLeft: scale(8),
    textAlign: "left",
  },
  subHeading: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    marginBottom: scale(4),
  },
  divider: {
    width: 2,
    backgroundColor: theme.colorLightGrey,
  },
  playerBox: {
    padding: scale(8),
    marginVertical: scale(4),
    borderRadius: scale(8),
    backgroundColor: theme.colorLightGrey,
    alignItems: "center",
    justifyContent: "center",
    minHeight: scale(50),
    width: "90%",
    maxWidth: scale(170),
  },
  activePlayer: {
    borderColor: theme.colorOrangePeel,
    borderWidth: 2,
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
  section: {
    marginBottom: scale(10),
  },
  clockContainer: {
    alignItems: "center",
    marginTop: scale(8),
  },
  clockLabel: {
    fontSize: moderateScale(14),
    color: theme.colorGrey,
    marginBottom: scale(4),
  },
  clockInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  clockInput: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: theme.colorOnyx,
    borderColor: theme.colorLightGrey,
    borderWidth: 2,
    borderRadius: scale(6),
    width: scale(50),
    textAlign: "center",
    padding: scale(6),
  },
  clockColon: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginHorizontal: scale(4),
  },
  clockWarning: {
    fontSize: moderateScale(12),
    color: theme.colorOrangePeel,
    marginTop: scale(4),
  },
  absoluteTooltipContainer: {
    position: "absolute",
    top: scale(-30),
    left: scale(10),
    right: scale(10),
    zIndex: 1000,
  },
});
