import { ScrollView, StyleSheet, View } from "react-native";
import { theme } from "@/theme";
import { AppText } from "@/components/shared/AppText";

export default function PrivacyPolicy() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="headline" style={styles.title}>
        Privacy Policy
      </AppText>

      <AppText variant="caption" color={theme.colorGrey} style={styles.lastUpdated}>
        Last updated: January 2025
      </AppText>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Overview
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine is a basketball statistics tracking app designed to help you track games,
          players, and team performance. Your privacy is important to us, and we want you to
          understand how we handle your data.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Data Collection
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine collects and stores the following information locally on your device:
        </AppText>
        <View style={styles.bulletList}>
          <AppText variant="body" style={styles.bulletItem}>
            • Team names and logos
          </AppText>
          <AppText variant="body" style={styles.bulletItem}>
            • Player names and jersey numbers
          </AppText>
          <AppText variant="body" style={styles.bulletItem}>
            • Game statistics and play-by-play data
          </AppText>
          <AppText variant="body" style={styles.bulletItem}>
            • Set/lineup configurations
          </AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Data Storage
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          All data is stored locally on your device using secure storage mechanisms. We do not
          upload, sync, or transmit your data to any external servers. Your data remains entirely on
          your device.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Third-Party Services
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine does not use any third-party analytics, advertising, or tracking services. We do
          not share your data with any third parties.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Images
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          When you add custom team logos or images, they are saved locally to your device's file
          system. These images are not uploaded or shared externally.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Data Deletion
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          You can delete any team, player, game, or set data at any time through the app. Deleting
          data removes it permanently from your device. Uninstalling the app will remove all stored
          data.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          No Account Required
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine does not require you to create an account or provide any personal information to
          use the app. The app works entirely offline.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Children's Privacy
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          StatLine does not knowingly collect personal information from children. The app is
          suitable for all ages and does not contain any age-restricted content.
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Changes to This Policy
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          We may update this privacy policy from time to time. Any changes will be reflected in the
          app with an updated "Last updated" date.
        </AppText>
      </View>

      <View style={[styles.section, styles.lastSection]}>
        <AppText variant="title2" style={styles.sectionTitle}>
          Contact
        </AppText>
        <AppText variant="body" style={styles.paragraph}>
          If you have any questions about this privacy policy, please contact us through the App
          Store listing or our support channels.
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
  title: {
    marginBottom: 8,
    color: theme.colorOnyx,
  },
  lastUpdated: {
    marginBottom: 24,
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
  bulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  bulletItem: {
    marginBottom: 4,
    color: theme.colorOnyx,
  },
});
