import { StatLineButton } from "@/components/StatLineButton";
import { theme } from "@/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useTeamStore } from "@/store/teamStore";
import { useSetStore } from "@/store/setStore";

export default function NewSet() {
  const addSet = useSetStore(state => state.addSet);
  const teamId = useTeamStore(state => state.currentTeamId);
  const router = useRouter();
  const [playName, setPlayName] = useState<string>();

  const handleSubmit = () => {
    if (!playName) {
      return Alert.alert("Validation Error", "Please enter set name");
    }
    addSet(playName, teamId);
    router.replace(`/sets/`);
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.contentContainer}
      extraScrollHeight={120}
      enableAutomaticScroll={true}
      enableOnAndroid={true}
    >
      <Text style={styles.header}>Set Name</Text>
      <TextInput
        style={styles.input}
        keyboardType="default"
        autoCapitalize="words"
        placeholder="Motion"
        onChangeText={newPlayName => setPlayName(newPlayName)}
      ></TextInput>

      <StatLineButton title="Create Set" onPress={handleSubmit}></StatLineButton>
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
});
