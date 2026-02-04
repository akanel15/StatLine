import { useState, memo } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { StatLineButton } from "@/components/StatLineButton";
import { useGameStore } from "@/store/gameStore";
import { theme } from "@/theme";
import { useSetStore } from "@/store/setStore";
import { SetType } from "@/types/set";
import { getSetOrUnknown } from "@/utils/displayHelpers";
import { scale, moderateScale } from "@/utils/responsive";

type SetOverlayProps = {
  gameId: string;
  onClose: () => void;
};

// Wrapped with memo to prevent unnecessary re-renders when parent state changes
const SetOverlay = memo(function SetOverlay({ gameId, onClose }: SetOverlayProps) {
  const game = useGameStore(state => state.games[gameId]);

  const sets = useSetStore(state => state.sets);
  const setList = Object.values(sets);
  const teamSets = setList.filter(set => set.teamId === game.teamId);

  const setActiveSets = useGameStore(state => state.setActiveSets);

  // Handle active sets including potentially deleted ones
  const activeSets = game.activeSets
    .map(setId => getSetOrUnknown(setId))
    .filter(set => set !== null) as SetType[];
  const otherSets = teamSets.filter(sets => !activeSets.includes(sets));

  const [selectedActive, setSelectedActive] = useState<SetType[]>(activeSets);
  const [selectedBench, setSelectedBench] = useState<SetType[]>(otherSets);

  // Toggle active player selection (remove from active)
  const toggleActiveSet = (set: SetType) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedActive(prev => prev.filter(s => s.id !== set.id));
    setSelectedBench(prev => [...prev, set]);
  };

  // Toggle bench player selection (add to active)
  const toggleOtherSet = (set: SetType) => {
    if (selectedActive.length < 5) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setSelectedActive(prev => [...prev, set]);
      setSelectedBench(prev => prev.filter(s => s.id !== set.id));
    }
  };

  const handleConfirm = () => {
    const activeIds = selectedActive.map(player => player.id);
    setActiveSets(gameId, activeIds);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>Sets</Text>
      <View style={styles.container}>
        {/* Active Players */}
        <View style={styles.column}>
          <Text style={styles.subHeading}>Current</Text>
          <FlatList
            data={selectedActive}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.playerBox, styles.activeSets]}
                onPress={() => toggleActiveSet(item)}
              >
                <View style={styles.rowCard}>
                  <Text style={styles.playerText} numberOfLines={2}>
                    {item ? item.name : "Unknown Set"}
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
          <Text style={styles.subHeading}>Other</Text>
          <FlatList
            data={selectedBench}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.playerBox} onPress={() => toggleOtherSet(item)}>
                <View style={styles.rowCard}>
                  <Text style={styles.playerText} numberOfLines={2}>
                    {item ? item.name : "Unknown Set"}
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
            <StatLineButton onPress={handleConfirm} title="Confirm" color={theme.colorBlue} />
          </View>
        </View>
      </View>
    </View>
  );
});

export default SetOverlay;

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
    width: scale(2),
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
  activeSets: {
    borderColor: theme.colorBlue,
    borderWidth: scale(2),
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
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
});
