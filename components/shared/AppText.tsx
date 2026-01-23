import { Text, TextProps, StyleSheet, TextStyle } from "react-native";
import { theme, typography, TypographyVariant } from "@/theme";

type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: TextStyle["textAlign"];
  children: React.ReactNode;
};

/**
 * AppText - A Text component with Dynamic Type support
 *
 * Features:
 * - Automatic font scaling (allowFontScaling=true)
 * - Limited max scaling to 1.5x to maintain layout integrity
 * - Typography variants from theme.ts
 * - Consistent styling across the app
 *
 * Usage:
 * <AppText variant="headline">Title</AppText>
 * <AppText variant="body" color={theme.colorGrey}>Description</AppText>
 */
export function AppText({
  variant = "body",
  color = theme.colorOnyx,
  align,
  style,
  children,
  ...props
}: AppTextProps) {
  const variantStyle = typography[variant];

  return (
    <Text
      allowFontScaling={true}
      maxFontSizeMultiplier={1.5}
      style={[styles.base, variantStyle, { color }, align && { textAlign: align }, style]}
      {...props}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    // Base styles applied to all text
  },
});
