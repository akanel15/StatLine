import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "@/theme";
import Feather from "@expo/vector-icons/Feather";

type ShareTypeModalProps = {
  visible: boolean;
  onClose: () => void;
  onShareImage: () => void;
  onShareData: () => void;
  onDismiss?: () => void;
};

export function ShareTypeModal({
  visible,
  onClose,
  onShareImage,
  onShareData,
  onDismiss,
}: ShareTypeModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onDismiss}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContainer}>
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Share Game</Text>
                <TouchableOpacity onPress={onClose} hitSlop={20}>
                  <Feather name="x" size={24} color={theme.colorOnyx} />
                </TouchableOpacity>
              </View>

              <Text style={styles.subtitle}>Choose how to share</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                <TouchableOpacity style={styles.option} onPress={onShareImage}>
                  <View style={styles.optionLeft}>
                    <Feather name="image" size={20} color={theme.colorOrangePeel} />
                    <Text style={styles.optionText}>Share as Image</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colorOrangePeel} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.option} onPress={onShareData}>
                  <View style={styles.optionLeft}>
                    <Feather name="share-2" size={20} color={theme.colorOrangePeel} />
                    <View>
                      <Text style={styles.optionText}>Share to StatLine</Text>
                      <Text style={styles.optionDescription}>
                        Send game data to another StatLine user
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.colorOrangePeel} />
                </TouchableOpacity>
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
  optionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  optionDescription: {
    fontSize: 12,
    color: theme.colorGrey,
    marginTop: 2,
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
