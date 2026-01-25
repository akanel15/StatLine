import { memo } from "react";
import { theme } from "@/theme";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { scale, moderateScale, scaleForLargeScreens, getButtonWidth } from "@/utils/responsive";

type RadioButtonProps = {
  title: string;
  selected: boolean;
  onPress: (setId: string) => void;
  setId?: string;
  reset?: boolean;
};

export const SetRadioButton = memo(function SetRadioButton({
  title,
  selected,
  onPress,
  setId = "",
  reset,
}: RadioButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.radioButton,
        {
          backgroundColor: reset ? theme.colorOnyx : selected ? theme.colorBlue : theme.colorWhite,
        },
      ]}
      onPress={() => onPress(setId)}
    >
      <Text
        style={[
          styles.radioButtonText,
          { color: selected || reset ? theme.colorWhite : theme.colorBlack },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  radioButton: {
    paddingVertical: scale(4),
    paddingHorizontal: scale(8),
    borderRadius: scale(6),
    borderWidth: 1,
    borderColor: theme.colorBlue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: getButtonWidth(),
    height: scaleForLargeScreens(50),
  },
  radioButtonText: {
    fontSize: moderateScale(14),
  },
});
