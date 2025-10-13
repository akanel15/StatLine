import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";

type GameCountSelectorModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (count: number) => void;
  totalGames: number;
};

export function GameCountSelectorModal({
  visible,
  onClose,
  onSelect,
  totalGames,
}: GameCountSelectorModalProps) {
  const options = [1, 3, 5, 10];

  const handleSelect = (count: number) => {
    const actualCount = Math.min(count, totalGames);
    onSelect(actualCount);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Share Recent Games</Text>
                <TouchableOpacity onPress={onClose} hitSlop={20}>
                  <Feather name="x" size={24} color={theme.colorOnyx} />
                </TouchableOpacity>
              </View>

              {/* Subtitle */}
              <Text style={styles.subtitle}>Select how many games to include</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {options.map(count => {
                  const isAvailable = count <= totalGames;
                  return (
                    <TouchableOpacity
                      key={count}
                      style={[styles.option, !isAvailable && styles.optionDisabled]}
                      onPress={() => handleSelect(count)}
                      disabled={!isAvailable}
                    >
                      <Text style={[styles.optionText, !isAvailable && styles.optionTextDisabled]}>
                        Last {count} {count === 1 ? "game" : "games"}
                      </Text>
                      <Feather
                        name="chevron-right"
                        size={20}
                        color={isAvailable ? theme.colorOrangePeel : theme.colorGrey}
                      />
                    </TouchableOpacity>
                  );
                })}

                {/* All games option */}
                {totalGames > 10 && (
                  <TouchableOpacity style={styles.option} onPress={() => handleSelect(totalGames)}>
                    <Text style={styles.optionText}>All {totalGames} games</Text>
                    <Feather name="chevron-right" size={20} color={theme.colorOrangePeel} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Cancel Button */}
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
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
    width: "85%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: theme.colorWhite,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colorOnyx,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colorGrey,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: theme.colorWhite,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colorOrangePeel,
  },
  optionDisabled: {
    borderColor: theme.colorLightGrey,
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  optionTextDisabled: {
    color: theme.colorGrey,
  },
  cancelButton: {
    padding: 16,
    backgroundColor: theme.colorLightGrey,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
});
