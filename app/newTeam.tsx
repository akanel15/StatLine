import { StatLineButton } from "@/components/StatLineButton";
import { StatLineImage } from "@/components/StatLineImage";
import { useTeamStore } from "@/store/teamStore";
import { theme } from "@/theme";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";

// Default team logo options
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

export default function NewTeam() {
  const addTeam = useTeamStore(state => state.addTeam);
  const router = useRouter();
  const [teamName, setTeamName] = useState<string>();
  const [imageUri, setImageUri] = useState<string>();
  const [selectedDefaultLogo, setSelectedDefaultLogo] = useState<string>();
  const [showDefaultOptions, setShowDefaultOptions] = useState(false);

  const handleSubmit = () => {
    if (!teamName) {
      return Alert.alert("Validation Error", "Please give the team a name");
    }

    // Use custom image URI or default logo ID as the image identifier
    const finalImageUri = imageUri || selectedDefaultLogo;
    addTeam(teamName, finalImageUri);

    //naviate to team page set up players
    router.back();
  };

  const handleTeamLogoSelection = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setSelectedDefaultLogo(undefined); // Clear default selection when custom image is chosen
    }
    return result;
  };

  const handleDefaultLogoSelection = (logoId: string) => {
    const selectedLogo = DEFAULT_TEAM_LOGOS.find(logo => logo.id === logoId);
    if (selectedLogo) {
      // Store the logo ID for rendering, clear custom URI
      setSelectedDefaultLogo(logoId);
      setImageUri(undefined);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.contentContainer}
    >
      <TouchableOpacity
        style={styles.centered}
        activeOpacity={0.6}
        onPress={handleTeamLogoSelection}
      >
        <View style={styles.imageContainer}>
          <StatLineImage imageUri={imageUri} defaultLogoId={selectedDefaultLogo} />
          <View style={styles.photoOverlay}>
            <Ionicons
              name={imageUri || selectedDefaultLogo ? "camera" : "add-circle"}
              size={14}
              color={theme.colorWhite}
            />
            <Text style={styles.photoText}>
              {imageUri || selectedDefaultLogo ? "Change Logo" : "Add Logo"}
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
              <Image source={logo.source} style={styles.defaultLogoImage} resizeMode="contain" />
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

      <Text style={styles.header}>Team Name</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="words"
        placeholder="Blackburn Vikings"
        onChangeText={newTeamName => setTeamName(newTeamName)}
      ></TextInput>

      <StatLineButton title="Create Team" onPress={handleSubmit}></StatLineButton>
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
  centered: { alignItems: "center", marginBottom: 24 },
  imageContainer: {
    position: "relative",
  },
  photoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
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
    alignSelf: "center",
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  defaultLogosText: {
    color: theme.colorBlue,
    fontSize: 16,
    textDecorationLine: "underline",
  },
  defaultLogosContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  defaultLogoOption: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: theme.colorLightGrey,
    backgroundColor: theme.colorWhite,
    minWidth: 100,
  },
  selectedDefaultLogo: {
    borderColor: theme.colorOrangePeel,
    backgroundColor: theme.colorWhite,
  },
  defaultLogoImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  defaultLogoText: {
    color: theme.colorOnyx,
    fontSize: 12,
    fontWeight: "600",
  },
  selectedDefaultLogoText: {
    color: theme.colorOrangePeel,
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
