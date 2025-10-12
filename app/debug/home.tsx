import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
} from "react-native";
import { theme } from "@/theme";
import { router } from "expo-router";

type DebugSection = {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
};

const debugSections: DebugSection[] = [
  {
    id: "teamSetup",
    title: "Team Setup",
    description: "Quickly create teams with players and sets",
    icon: "🏀",
    route: "/debug/teamSetup",
    color: theme.colorGreen,
  },
  {
    id: "snapshots",
    title: "Snapshots & Backups",
    description: "Save, restore, and export store state for testing",
    icon: "📸",
    route: "/debug/snapshots",
    color: theme.colorBlue,
  },
  {
    id: "seedData",
    title: "Seed Data",
    description: "Load pre-built test data scenarios",
    icon: "🌱",
    route: "/debug/seedData",
    color: theme.colorGreen,
  },
  {
    id: "validation",
    title: "Data Validation & Inspector",
    description: "Validate data integrity, inspect stores, and fix issues",
    icon: "🔍",
    route: "/debug/validation",
    color: theme.colorOrangePeel,
  },
  {
    id: "simulation",
    title: "Game Simulator",
    description: "Simulate game events and scenarios",
    icon: "🎲",
    route: "/debug/gameSimulator",
    color: theme.colorPurple,
  }
];

export default function DebugHomeScreen() {
  const renderDebugSection = ({ item }: { item: DebugSection }) => (
    <Pressable
      style={[styles.card, { borderLeftColor: item.color }]}
      onPress={() => router.push(item.route)}
    >
      <View style={styles.cardContent}>
        <Text style={styles.icon}>{item.icon}</Text>
        <View style={styles.textContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔧 Debug & Development</Text>
        <Text style={styles.headerSubtitle}>
          Tools for testing, debugging, and data management
        </Text>
      </View>

      <FlatList
        data={debugSections}
        renderItem={renderDebugSection}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ These tools are for development use only
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colorGrey,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: theme.colorBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  icon: {
    fontSize: 32,
    marginRight: 16,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: theme.colorGrey,
    lineHeight: 20,
  },
  arrow: {
    fontSize: 24,
    color: theme.colorGrey,
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
    backgroundColor: "#f8f9fa",
  },
  footerText: {
    fontSize: 12,
    color: theme.colorGrey,
    textAlign: "center",
    fontStyle: "italic",
  },
});
