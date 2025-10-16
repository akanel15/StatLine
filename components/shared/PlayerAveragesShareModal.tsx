import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";
import { PlayerType } from "@/types/player";
import { useState, useEffect } from "react";
import { Stat } from "@/types/stats";

type PlayerAveragesShareModalProps = {
  visible: boolean;
  onClose: () => void;
  onShare: (selectedPlayerIds: string[]) => void;
  players: PlayerType[];
};

export function PlayerAveragesShareModal({
  visible,
  onClose,
  onShare,
  players,
}: PlayerAveragesShareModalProps) {
  // Filter to only players with games played
  const eligiblePlayers = players.filter(p => p.gameNumbers.gamesPlayed > 0);

  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(eligiblePlayers.map(p => p.id)),
  );

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedPlayerIds(new Set(eligiblePlayers.map(p => p.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(playerId)) {
        newSet.delete(playerId);
      } else {
        newSet.add(playerId);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (selectedPlayerIds.size === eligiblePlayers.length) {
      // Deselect all
      setSelectedPlayerIds(new Set());
    } else {
      // Select all
      setSelectedPlayerIds(new Set(eligiblePlayers.map(p => p.id)));
    }
  };

  const handleShare = () => {
    if (selectedPlayerIds.size === 0) return;
    onShare(Array.from(selectedPlayerIds));
    onClose();
  };

  const allSelected = selectedPlayerIds.size === eligiblePlayers.length;
  const noneSelected = selectedPlayerIds.size === 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Share Player Averages</Text>
                <TouchableOpacity onPress={onClose} hitSlop={20}>
                  <Feather name="x" size={24} color={theme.colorOnyx} />
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.subtitle}>
                Select players to include ({selectedPlayerIds.size} selected)
              </Text>

              {/* Select/Deselect All Button */}
              <TouchableOpacity style={styles.toggleAllButton} onPress={toggleAll}>
                <Text style={styles.toggleAllText}>
                  {allSelected ? "Deselect All" : "Select All"}
                </Text>
              </TouchableOpacity>

              {/* Player List */}
              <ScrollView style={styles.playerList} showsVerticalScrollIndicator={true}>
                {eligiblePlayers.map(player => {
                  const isSelected = selectedPlayerIds.has(player.id);
                  const displayName = player.number
                    ? `#${player.number} ${player.name}`
                    : player.name;
                  const ppg = (player.stats[Stat.Points] / player.gameNumbers.gamesPlayed).toFixed(
                    1,
                  );
                  const rpg = (
                    (player.stats[Stat.DefensiveRebounds] + player.stats[Stat.OffensiveRebounds]) /
                    player.gameNumbers.gamesPlayed
                  ).toFixed(1);
                  const apg = (player.stats[Stat.Assists] / player.gameNumbers.gamesPlayed).toFixed(
                    1,
                  );

                  return (
                    <TouchableOpacity
                      key={player.id}
                      style={[styles.playerRow, isSelected && styles.playerRowSelected]}
                      onPress={() => togglePlayer(player.id)}
                    >
                      <View style={styles.playerRowContent}>
                        {/* Checkbox */}
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && (
                            <Feather name="check" size={16} color={theme.colorWhite} />
                          )}
                        </View>

                        {/* Player Info */}
                        <View style={styles.playerInfo}>
                          <Text style={styles.playerName}>{displayName}</Text>
                          <Text style={styles.playerStats}>
                            {ppg} PPG · {rpg} RPG · {apg} APG
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.shareButton, noneSelected && styles.shareButtonDisabled]}
                  onPress={handleShare}
                  disabled={noneSelected}
                >
                  <Feather
                    name="share"
                    size={16}
                    color={noneSelected ? theme.colorGrey : theme.colorWhite}
                  />
                  <Text
                    style={[styles.shareButtonText, noneSelected && styles.shareButtonTextDisabled]}
                  >
                    Share Player Averages
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalContent: {
    backgroundColor: theme.colorWhite,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 12,
  },
  toggleAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  toggleAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  playerList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  playerRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colorWhite,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.colorLightGrey,
    marginBottom: 8,
  },
  playerRowSelected: {
    borderColor: theme.colorOrangePeel,
    backgroundColor: "#FFF5E6",
  },
  playerRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colorGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: theme.colorOrangePeel,
    borderColor: theme.colorOrangePeel,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  playerStats: {
    fontSize: 12,
    color: theme.colorGrey,
    fontWeight: "500",
  },
  actions: {
    gap: 10,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    backgroundColor: theme.colorOrangePeel,
    borderRadius: 12,
  },
  shareButtonDisabled: {
    backgroundColor: theme.colorLightGrey,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorWhite,
  },
  shareButtonTextDisabled: {
    color: theme.colorGrey,
  },
  cancelButton: {
    padding: 16,
    backgroundColor: theme.colorLightGrey,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
