import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatLineButton } from "./StatLineButton";
import { StatLineImage } from "./StatLineImage";
import { theme } from "@/theme";
import * as ImagePicker from "expo-image-picker";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

type EditField = {
  key: string;
  label: string;
  type: "text" | "number" | "image";
  value: string | number | undefined;
  placeholder?: string;
  keyboardType?: "default" | "numeric";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

type EditModalProps = {
  visible: boolean;
  title: string;
  fields: EditField[];
  onSave: (updates: Record<string, any>) => Promise<void> | void;
  onCancel: () => void;
};

export function EditModal({ visible, title, fields, onSave, onCancel }: EditModalProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  // Initialize values when modal opens
  useEffect(() => {
    if (visible) {
      const initialValues: Record<string, any> = {};
      fields.forEach(field => {
        initialValues[field.key] = field.value;
      });
      setValues(initialValues);
    }
  }, [visible, fields]);

  const handleImagePicker = async (fieldKey: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setValues(prev => ({
        ...prev,
        [fieldKey]: result.assets[0].uri,
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Create updates object with only changed values
      const updates: Record<string, any> = {};
      fields.forEach(field => {
        if (values[field.key] !== field.value) {
          updates[field.key] = values[field.key];
        }
      });

      if (Object.keys(updates).length === 0) {
        onCancel();
        return;
      }

      await onSave(updates);
      onCancel();
    } catch (error) {
      Alert.alert("Error", "Failed to save changes. Please try again.");
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setValues({});
    onCancel();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <FontAwesome5 name="times" size={20} color={theme.colorGrey} />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {fields.map(field => (
            <View key={field.key} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>{field.label}</Text>

              {field.type === "image" ? (
                <TouchableOpacity
                  style={styles.imageContainer}
                  activeOpacity={0.6}
                  onPress={() => handleImagePicker(field.key)}
                >
                  <StatLineImage imageUri={values[field.key]} />
                  <Text style={styles.imageHint}>Tap to change image</Text>
                </TouchableOpacity>
              ) : (
                <TextInput
                  style={styles.input}
                  value={values[field.key]?.toString() || ""}
                  onChangeText={text => {
                    setValues(prev => ({
                      ...prev,
                      [field.key]: field.type === "number" ? parseInt(text) || 0 : text,
                    }));
                  }}
                  placeholder={field.placeholder}
                  keyboardType={field.keyboardType || "default"}
                  autoCapitalize={field.autoCapitalize || "sentences"}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.buttonContainer}>
            <StatLineButton
              title="Cancel"
              onPress={handleCancel}
              color={theme.colorGrey}
              disabled={loading}
            />
          </View>
          <View style={styles.buttonContainer}>
            <StatLineButton
              title={loading ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colorWhite,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colorLightGrey,
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colorOnyx,
  },
  placeholder: {
    width: 36, // Same width as cancel button for centering
  },
  content: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colorOnyx,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colorLightGrey,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colorOnyx,
  },
  imageContainer: {
    alignItems: "center",
  },
  imageHint: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colorGrey,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colorLightGrey,
  },
  buttonContainer: {
    flex: 1,
  },
});
