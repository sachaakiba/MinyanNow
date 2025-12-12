import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../lib/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}) => {
  const variantButtonStyle =
    variant === "primary"
      ? styles.primaryButton
      : variant === "secondary"
      ? styles.secondaryButton
      : styles.outlineButton;

  const variantTextStyle =
    variant === "primary"
      ? styles.primaryText
      : variant === "secondary"
      ? styles.secondaryText
      : styles.outlineText;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variantButtonStyle,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.text.inverse : colors.primary}
        />
      ) : (
        <Text style={[styles.buttonText, variantTextStyle, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.primaryLight,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    color: colors.text.inverse,
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineText: {
    color: colors.primary,
  },
});
