import { StatLineButton } from "@/components/StatLineButton";
import { theme } from "@/theme";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTeamStore } from "@/store/teamStore";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { StatLineToggle } from "@/components/StatLineToggle";
import { PeriodType } from "@/types/game";
import * as ImagePicker from "expo-image-picker";
import { OpponentImage } from "@/components/OpponentImage";

export default function NewGame() {
  const addGame = useGameStore(state => state.addGame);
  const teamId = useTeamStore(state => state.currentTeamId);
  const players = usePlayerStore(state => state.players);
  const playersList = Object.values(players);
  const teamPlayers = playersList.filter(player => player.teamId === teamId);

  const router = useRouter();
  const [opponentName, setOpponentName] = useState<string>();
  const [opponentImageUri, setOpponentImageUri] = useState<string>();
  const [periodSelector, setPeriodSelector] = useState<PeriodType>(PeriodType.Quarters);

  useEffect(() => {
    if (teamPlayers.length === 0) {
      return Alert.alert("Validation Error", "Add players before creating a game", [
        {
          text: "Go",
          onPress: () => {
            router.navigate("/players");
          },
          style: "default",
        },
      ]);
    }
  });

  const handleOpponentImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setOpponentImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    if (!opponentName) {
      return Alert.alert("Validation Error", "Please enter opponent name");
    } else if (teamPlayers.length === 0) {
      return Alert.alert("Validation Error", "Add players before creating a game", [
        {
          text: "Go",
          onPress: () => {
            router.navigate("/players");
          },
          style: "default",
        },
      ]);
    }
    const gameId = addGame(teamId, opponentName, periodSelector, opponentImageUri);
    router.replace(`/games/${gameId}`);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.centered}>
        <OpponentImage
          imageUri={opponentImageUri}
          teamName={opponentName}
          size={100}
          showOverlay={true}
          onPress={handleOpponentImagePicker}
        />
      </View>

      <Text style={styles.header}>Opponent Name</Text>
      <TextInput
        style={styles.input}
        keyboardType="default"
        autoCapitalize="words"
        placeholder="LA Lakers"
        onChangeText={newOpponentName => setOpponentName(newOpponentName)}
      ></TextInput>

      <View style={styles.periodContainer}>
        <StatLineToggle
          title="Quarters"
          selected={periodSelector === PeriodType.Quarters}
          onPress={() => setPeriodSelector(PeriodType.Quarters)}
        ></StatLineToggle>
        <StatLineToggle
          title="Halves"
          selected={periodSelector === PeriodType.Halves}
          onPress={() => setPeriodSelector(PeriodType.Halves)}
        ></StatLineToggle>
      </View>

      <StatLineButton title="Start Game" onPress={handleSubmit}></StatLineButton>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  contentContainer: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  centered: {
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    color: theme.colorOnyx,
    fontSize: 24,
    marginBottom: 8,
  },
  input: {
    color: theme.colorOnyx,
    fontSize: 24,
    marginBottom: 24,
    borderColor: theme.colorLightGrey,
    borderWidth: 2,
    padding: 12,
  },
  periodContainer: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
});
