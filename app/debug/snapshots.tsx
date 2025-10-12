import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Pressable,
} from "react-native";
import { theme } from "@/theme";
import { StatLineButton } from "@/components/StatLineButton";
import {
  listSnapshots,
  quickSave,
  deleteSnapshot,
  exportSnapshot,
  loadSnapshot,
  saveSnapshot,
  captureSnapshot,
  getStoreSummary,
  type SavedSnapshotInfo,
} from "@/utils/debug/snapshotManager";

export default function SnapshotsScreen() {
  const [snapshots, setSnapshots] = useState<SavedSnapshotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveInputName, setSaveInputName] = useState("");
  const [saveInputDescription, setSaveInputDescription] = useState("");
  const [storeSummary, setStoreSummary] = useState(getStoreSummary());

  const loadSnapshotsList = useCallback(async () => {
    try {
      setLoading(true);
      const snapshotList = await listSnapshots();
      setSnapshots(snapshotList);
      setStoreSummary(getStoreSummary());
    } catch (error) {
      console.error("Error loading snapshots:", error);
      Alert.alert("Error", "Failed to load snapshots list");
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSnapshotsList();
    setRefreshing(false);
  }, [loadSnapshotsList]);

  useEffect(() => {
    loadSnapshotsList();
  }, [loadSnapshotsList]);

  const handleQuickSave = async () => {
    try {
      setLoading(true);
      const snapshot = await quickSave();
      await loadSnapshotsList();
      Alert.alert("Success", `Quick save completed: ${snapshot.name}`);
    } catch (error) {
      console.error("Error with quick save:", error);
      Alert.alert("Error", `Failed to quick save: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWithName = async () => {
    if (!saveInputName.trim()) {
      Alert.alert("Error", "Please enter a name for the snapshot");
      return;
    }

    try {
      setLoading(true);
      const snapshot = await captureSnapshot();
      await saveSnapshot(
        saveInputName.trim(),
        snapshot,
        saveInputDescription.trim() || undefined,
      );
      await loadSnapshotsList();

      // Reset dialog
      setShowSaveDialog(false);
      setSaveInputName("");
      setSaveInputDescription("");

      Alert.alert("Success", `Snapshot saved: ${saveInputName}`);
    } catch (error) {
      console.error("Error saving snapshot:", error);
      Alert.alert("Error", `Failed to save snapshot: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSnapshot = (snapshot: SavedSnapshotInfo) => {
    Alert.alert(
      "Load Snapshot",
      `Are you sure you want to load "${snapshot.name}"? This will replace all current data and cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Load",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await loadSnapshot(snapshot);
              setStoreSummary(getStoreSummary());
              Alert.alert("Success", `Loaded snapshot: ${snapshot.name}`);
            } catch (error) {
              console.error("Error loading snapshot:", error);
              Alert.alert("Error", `Failed to load snapshot: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteSnapshot = (snapshot: SavedSnapshotInfo) => {
    Alert.alert(
      "Delete Snapshot",
      `Are you sure you want to delete "${snapshot.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteSnapshot(snapshot);
              await loadSnapshotsList();
              Alert.alert("Success", `Deleted snapshot: ${snapshot.name}`);
            } catch (error) {
              console.error("Error deleting snapshot:", error);
              Alert.alert("Error", `Failed to delete snapshot: ${error}`);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleExportSnapshot = async (snapshot: SavedSnapshotInfo) => {
    try {
      setLoading(true);
      await exportSnapshot(snapshot);
    } catch (error) {
      console.error("Error exporting snapshot:", error);
      Alert.alert("Error", `Failed to export snapshot: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const renderSaveDialog = () => (
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.dialogTitle}>Save Current State</Text>

        <TextInput
          style={styles.input}
          placeholder="Snapshot name (required)"
          value={saveInputName}
          onChangeText={setSaveInputName}
          maxLength={50}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optional)"
          value={saveInputDescription}
          onChangeText={setSaveInputDescription}
          multiline
          numberOfLines={3}
          maxLength={200}
        />

        <View style={styles.dialogButtons}>
          <StatLineButton
            title="Cancel"
            color={theme.colorGrey}
            onPress={() => {
              setShowSaveDialog(false);
              setSaveInputName("");
              setSaveInputDescription("");
            }}
            style={styles.dialogButton}
          />
          <StatLineButton
            title="Save"
            onPress={handleSaveWithName}
            style={styles.dialogButton}
          />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current State Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Current State</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Teams:</Text>
              <Text style={styles.summaryValue}>{storeSummary.teams}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Players:</Text>
              <Text style={styles.summaryValue}>{storeSummary.players}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Games:</Text>
              <Text style={styles.summaryValue}>
                {storeSummary.games} ({storeSummary.finishedGames} finished)
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sets:</Text>
              <Text style={styles.summaryValue}>{storeSummary.sets}</Text>
            </View>
          </View>
        </View>

        {/* Save Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Save Current State</Text>
          <View style={styles.buttonRow}>
            <StatLineButton
              title="Quick Save"
              onPress={handleQuickSave}
              color={theme.colorBlue}
              style={styles.actionButton}
              disabled={loading}
            />
            <StatLineButton
              title="Save As..."
              onPress={() => setShowSaveDialog(true)}
              color={theme.colorGreen}
              style={styles.actionButton}
              disabled={loading}
            />
          </View>
        </View>

        {/* Saved Snapshots */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📸 Saved Snapshots ({snapshots.length})
          </Text>
          {snapshots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No snapshots saved yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first snapshot to get started
              </Text>
            </View>
          ) : (
            snapshots.map((snapshot) => (
              <View key={snapshot.id} style={styles.snapshotCard}>
                <View style={styles.snapshotHeader}>
                  <Text style={styles.snapshotName}>{snapshot.name}</Text>
                  <Text style={styles.snapshotSize}>
                    {formatFileSize(snapshot.fileSize)}
                  </Text>
                </View>
                <Text style={styles.snapshotDate}>
                  {formatDate(snapshot.timestamp)}
                </Text>
                {snapshot.description && (
                  <Text style={styles.snapshotDescription}>
                    {snapshot.description}
                  </Text>
                )}

                <View style={styles.snapshotActions}>
                  <Pressable
                    style={[styles.actionIcon, styles.loadAction]}
                    onPress={() => handleLoadSnapshot(snapshot)}
                  >
                    <Text style={styles.actionIconText}>📥</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionIcon, styles.exportAction]}
                    onPress={() => handleExportSnapshot(snapshot)}
                  >
                    <Text style={styles.actionIconText}>📤</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionIcon, styles.deleteAction]}
                    onPress={() => handleDeleteSnapshot(snapshot)}
                  >
                    <Text style={styles.actionIconText}>🗑️</Text>
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {showSaveDialog && renderSaveDialog()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colorOnyx,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colorBlue,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  snapshotCard: {
    backgroundColor: theme.colorWhite,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    shadowColor: theme.colorBlack,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  snapshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  snapshotName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    flex: 1,
  },
  snapshotSize: {
    fontSize: 12,
    color: theme.colorGrey,
  },
  snapshotDate: {
    fontSize: 12,
    color: theme.colorGrey,
    marginBottom: 4,
  },
  snapshotDescription: {
    fontSize: 14,
    color: theme.colorOnyx,
    fontStyle: "italic",
    marginBottom: 8,
  },
  snapshotActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  loadAction: {
    backgroundColor: theme.colorBlue + "20",
  },
  exportAction: {
    backgroundColor: theme.colorTeal + "20",
  },
  deleteAction: {
    backgroundColor: theme.colorRedCrayola + "20",
  },
  actionIconText: {
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colorGrey,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colorGrey,
    fontStyle: "italic",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    padding: 20,
    margin: 20,
    width: "90%",
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colorOnyx,
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  dialogButton: {
    flex: 1,
  },
});
