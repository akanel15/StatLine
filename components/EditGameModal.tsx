import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { theme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useGameStore } from "@/store/gameStore";
import { useTeamStore } from "@/store/teamStore";
import { usePlayerStore } from "@/store/playerStore";
import { Result } from "@/types/player";
import { Stat } from "@/types/stats";
import { Team } from "@/types/game";
import { confirmGameDeletion } from "@/utils/playerDeletion";
import { OpponentImage } from "@/components/OpponentImage";
import { scale, moderateScale } from "@/utils/responsive";

interface EditGameModalProps {
  gameId: string;
  visible: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export function EditGameModal({ gameId, visible, onClose, onDelete }: EditGameModalProps) {
  const [editedOpposingTeamName, setEditedOpposingTeamName] = useState("");
  const [editedImageUri, setEditedImageUri] = useState<string | undefined>();

  const getGameSafely = useGameStore(state => state.getGameSafely);
  const updateGame = useGameStore(state => state.updateGame);
  const markGameAsActive = useGameStore(state => state.markGameAsActive);

  const teamId = useTeamStore(state => state.currentTeamId);
  const revertTeamGameNumbers = useTeamStore(state => state.revertGameNumbers);

  const revertPlayerGameNumbers = usePlayerStore(state => state.revertGameNumbers);

  const game = getGameSafely(gameId);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible && game) {
      setEditedOpposingTeamName(game.opposingTeamName);
      setEditedImageUri(game.opposingTeamImageUri);
    }
  }, [visible, game]);

  const handleHapticFeedback = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleOpponentImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) {
      setEditedImageUri(result.assets[0].uri);
    }
  };

  const calculateGameResult = (): Result => {
    if (!game) return Result.Draw;
    const ourPoints = game.statTotals[Team.Us][Stat.Points] || 0;
    const opponentPoints = game.statTotals[Team.Opponent][Stat.Points] || 0;

    if (ourPoints > opponentPoints) return Result.Win;
    if (ourPoints < opponentPoints) return Result.Loss;
    return Result.Draw;
  };

  const handleContinueGame = () => {
    handleHapticFeedback();
    if (!game) return;

    const result = calculateGameResult();

    // Revert team and player game counts
    revertTeamGameNumbers(teamId, result);
    game.gamePlayedList.forEach(playerId => {
      revertPlayerGameNumbers(playerId, result);
    });

    // Mark game as active
    markGameAsActive(gameId);
    onClose();
  };

  const handleSaveChanges = () => {
    handleHapticFeedback();
    if (!game) return;

    if (editedOpposingTeamName.trim() === "") {
      Alert.alert("Validation Error", "Opposing team name cannot be empty");
      return;
    }

    updateGame(gameId, {
      opposingTeamName: editedOpposingTeamName.trim(),
      opposingTeamImageUri: editedImageUri,
    });
    onClose();
  };

  const handleCancel = () => {
    handleHapticFeedback();
    setEditedOpposingTeamName(game?.opposingTeamName || "");
    setEditedImageUri(game?.opposingTeamImageUri);
    onClose();
  };

  const handleDeleteGame = () => {
    handleHapticFeedback();
    if (!game) return;

    const gameName = `vs ${game.opposingTeamName}`;
    confirmGameDeletion(gameId, gameName, () => {
      onClose();
      onDelete?.();
    });
  };

  if (!game) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleCancel}>
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <KeyboardAwareScrollView
              style={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header with Close Button */}
              <View style={styles.header}>
                <Text style={styles.title}>Edit Game</Text>
                <TouchableOpacity onPress={handleCancel} hitSlop={20}>
                  <Feather name="x" size={24} color={theme.colorOnyx} />
                </TouchableOpacity>
              </View>

              {/* Opponent Image Editor */}
              <View style={styles.centered}>
                <OpponentImage
                  imageUri={editedImageUri}
                  teamName={editedOpposingTeamName}
                  size={100}
                  showOverlay={true}
                  onPress={handleOpponentImagePicker}
                />
              </View>

              {/* Opponent Name Input */}
              <Text style={styles.inputLabel}>Opponent Name</Text>
              <TextInput
                style={styles.textInput}
                value={editedOpposingTeamName}
                onChangeText={setEditedOpposingTeamName}
                placeholder="LA Lakers"
                autoCapitalize="words"
              />

              {/* Action Buttons */}
              <View style={styles.actionsSection}>
                {/* Save Changes */}
                <TouchableOpacity style={styles.optionButton} onPress={handleSaveChanges}>
                  <View style={styles.optionContent}>
                    <Feather name="save" size={20} color={theme.colorOrangePeel} />
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText}>Save Changes</Text>
                      <Text style={styles.optionSubtext}>Update game info and stay completed</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colorOrangePeel} />
                </TouchableOpacity>

                {/* Continue Game */}
                <TouchableOpacity style={styles.optionButton} onPress={handleContinueGame}>
                  <View style={styles.optionContent}>
                    <Feather name="play" size={20} color={theme.colorOrangePeel} />
                    <View style={styles.optionTextContainer}>
                      <Text style={styles.optionText}>Continue Game</Text>
                      <Text style={styles.optionSubtext}>Resume adding stats and plays</Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colorOrangePeel} />
                </TouchableOpacity>

                {/* Delete Game */}
                <TouchableOpacity
                  style={[styles.optionButton, styles.deleteButton]}
                  onPress={handleDeleteGame}
                >
                  <View style={styles.optionContent}>
                    <Feather name="trash-2" size={20} color={theme.colorDestructive} />
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionText, styles.deleteText]}>Delete Game</Text>
                      <Text style={[styles.optionSubtext, styles.deleteSubtext]}>
                        Permanently remove this game
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colorDestructive} />
                </TouchableOpacity>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </KeyboardAwareScrollView>
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
    borderRadius: scale(16),
    maxHeight: "100%",
  },
  scrollContent: {
    padding: scale(20),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(24),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  centered: {
    alignItems: "center",
    marginBottom: scale(24),
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: scale(8),
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
    borderRadius: scale(8),
    padding: scale(12),
    fontSize: moderateScale(16),
    backgroundColor: theme.colorWhite,
    color: theme.colorOnyx,
    marginBottom: scale(24),
  },
  actionsSection: {
    gap: scale(12),
    marginBottom: scale(20),
  },
  optionButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: scale(16),
    backgroundColor: theme.colorWhite,
    borderRadius: scale(12),
    borderWidth: 1.5,
    borderColor: theme.colorOrangePeel,
  },
  deleteButton: {
    borderColor: theme.colorDestructive,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: scale(2),
  },
  deleteText: {
    color: theme.colorDestructive,
  },
  optionSubtext: {
    fontSize: moderateScale(13),
    color: theme.colorGrey,
  },
  deleteSubtext: {
    color: theme.colorDestructive,
    opacity: 0.8,
  },
  cancelButton: {
    padding: scale(16),
    backgroundColor: theme.colorLightGrey,
    borderRadius: scale(12),
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
