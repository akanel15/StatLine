import { ScrollView, StyleSheet, View } from "react-native";
import { theme } from "@/theme";
import { AppText } from "@/components/shared/AppText";

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="caption" color={theme.colorGrey} style={styles.lastUpdated}>
        Last updated: January 2025
      </AppText>

      <AppText variant="body" style={styles.intro}>
        StatLine does not collect any personal data. All information you enter — teams, players,
        games, and statistics — is stored locally on your device and never leaves it.
      </AppText>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Your Data
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          Everything stays on your device. We do not upload, sync, or transmit any data to external
          servers. No account is required, and the app works entirely offline.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Third Parties
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine does not use analytics, advertising, or any third-party tracking services.
        </AppText>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Contact
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          Questions? Reach us through the App Store.
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
  lastUpdated: {
    marginBottom: 24,
  },
  intro: {
    marginBottom: 24,
    color: theme.colorOnyx,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 48,
  },
  sectionTitle: {
    marginBottom: 8,
    color: theme.colorOnyx,
  },
  paragraph: {
    color: theme.colorOnyx,
  },
});
