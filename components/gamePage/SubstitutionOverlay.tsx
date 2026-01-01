import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { StatLineButton } from "@/components/StatLineButton";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { theme } from "@/theme";
import { PlayerType } from "@/types/player";
import { PlayerImage } from "../PlayerImage";
import { useHelpStore } from "@/store/helpStore";
import { ContextualTooltip } from "@/components/shared/ContextualTooltip";

type SubstitutionOverlayProps = {
  gameId: string;
  onClose: () => void;
};

export default function SubstitutionOverlay({ gameId, onClose }: SubstitutionOverlayProps) {
  const game = useGameStore(state => state.games[gameId]);
  const addPlayerToGamePlayed = useGameStore(state => state.addPlayersToGamePlayedList);

  const players = usePlayerStore(state => state.players);
  const playersList = Object.values(players);
  const teamPlayers = playersList.filter(player => player.teamId === game.teamId);

  const setActivePlayers = useGameStore(state => state.setActivePlayers);

  const activePlayers = game.activePlayers
    .map(playerId => players[playerId])
    .filter(player => player !== undefined); // Filter out undefined players

  // Default to first 5 players (or all if less than 5) as active if none selected
  const defaultActivePlayers = activePlayers.length === 0 ? teamPlayers.slice(0, 5) : activePlayers;

  const defaultBenchPlayers = teamPlayers.filter(player => !defaultActivePlayers.includes(player));

  const [selectedActive, setSelectedActive] = useState<PlayerType[]>(defaultActivePlayers);
  const [selectedBench, setSelectedBench] = useState<PlayerType[]>(defaultBenchPlayers);

  // Help hints
  const hasSeenSubstitutionHint = useHelpStore(state => state.hasSeenSubstitutionHint);
  const markHintAsSeen = useHelpStore(state => state.markHintAsSeen);
  const [showSubstitutionHint, setShowSubstitutionHint] = useState(false);

  // Show substitution hint on first overlay open
  useEffect(() => {
    if (!hasSeenSubstitutionHint) {
      setShowSubstitutionHint(true);
      // Mark as seen immediately when shown (not on dismiss)
      markHintAsSeen("substitution");
    }
  }, [hasSeenSubstitutionHint, markHintAsSeen]);

  const handleDismissSubstitutionHint = () => {
    setShowSubstitutionHint(false);
  };

  // Toggle active player selection (remove from active)
  const toggleActivePlayer = (player: PlayerType) => {
    setSelectedActive(prev => prev.filter(p => p.id !== player.id));
    setSelectedBench(prev => [...prev, player]);
  };

  // Toggle bench player selection (add to active)
  const toggleBenchPlayer = (player: PlayerType) => {
    setSelectedActive(prev => [...prev, player]);
    setSelectedBench(prev => prev.filter(p => p.id !== player.id));
  };

  const handleConfirm = () => {
    if (selectedActive.length === 0 || selectedActive.length > 5) {
      Alert.alert("Validation Error", "Please select a valid number of players (1-5).");
      return;
    }
    const activeIds = selectedActive.map(player => player.id);
    addPlayerToGamePlayed(gameId, activeIds);
    setActivePlayers(gameId, activeIds);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>Substitutions</Text>

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
                  <Text style={styles.playerText}>{item.name}</Text>
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
                  <Text style={styles.playerText}>{item.name}</Text>
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
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colorWhite,
    padding: 10,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    flexDirection: "row",
    flex: 1,
    marginVertical: 20,
  },
  column: {
    flex: 1,
    alignItems: "center",
  },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    paddingHorizontal: 10,
    width: 160,
  },
  playerText: {
    fontSize: 16,
    flexShrink: 1,
    flexWrap: "wrap",
    marginLeft: 8,
    textAlign: "left",
  },
  subHeading: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  divider: {
    width: 2,
    backgroundColor: theme.colorLightGrey,
  },
  playerBox: {
    padding: 8,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: theme.colorLightGrey,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    minWidth: 160,
    maxWidth: 160,
  },
  activePlayer: {
    borderColor: theme.colorOrangePeel,
    borderWidth: 2,
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
  section: {
    marginBottom: 10,
  },
  absoluteTooltipContainer: {
    position: "absolute",
    top: -30,
    left: 10,
    right: 10,
    zIndex: 1000,
  },
});
