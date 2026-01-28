import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { theme } from "@/theme";
import { AppText } from "@/components/shared/AppText";
import { router } from "expo-router";
import AntDesign from "@expo/vector-icons/AntDesign";

interface SettingsLinkProps {
  icon: keyof typeof AntDesign.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function SettingsLink({ icon, iconColor, title, subtitle, onPress }: SettingsLinkProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkRowPressed]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconColor }]}>
        <AntDesign name={icon} size={20} color={theme.colorWhite} />
      </View>
      <View style={styles.linkTextContainer}>
        <AppText variant="body" style={styles.linkTitle}>
          {title}
        </AppText>
        <AppText variant="caption" color={theme.colorGrey}>
          {subtitle}
        </AppText>
      </View>
      <AntDesign name="right" size={16} color={theme.colorGrey} />
    </Pressable>
  );
}

export default function Settings() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="caption" color={theme.colorGrey} style={styles.sectionHeader}>
        HELP & INFORMATION
      </AppText>

      <View style={styles.linksContainer}>
        <SettingsLink
          icon="question-circle"
          iconColor={theme.colorOrangePeel}
          title="FAQs"
          subtitle="Learn how to use StatLine"
          onPress={() => router.navigate("/faq")}
        />
        <View style={styles.separator} />
        <SettingsLink
          icon="lock"
          iconColor={theme.colorGrey}
          title="Privacy Policy"
          subtitle="How your data is handled"
          onPress={() => router.navigate("/privacy")}
        />
      </View>

      {__DEV__ && (
        <>
          <AppText variant="caption" color={theme.colorGrey} style={styles.sectionHeader}>
            DEVELOPER
          </AppText>
          <View style={styles.linksContainer}>
            <SettingsLink
              icon="tool"
              iconColor={theme.colorOnyx}
              title="Debug Tools"
              subtitle="Development and testing utilities"
              onPress={() => router.navigate("/debug/home")}
            />
          </View>
        </>
      )}

      <View style={styles.versionContainer}>
        <AppText variant="caption" color={theme.colorGrey}>
          StatLine v1.0.0
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  content: {
    padding: 24,
  },
  sectionHeader: {
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  linksContainer: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: 12,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colorWhite,
  },
  linkRowPressed: {
    backgroundColor: theme.colorLightGrey,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkTitle: {
    color: theme.colorOnyx,
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colorLightGrey,
    marginLeft: 64,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 48,
  },
});
