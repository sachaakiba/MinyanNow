import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { colors } from "../lib/colors";

export type AlertType = "success" | "error" | "warning" | "info" | "confirm";

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface AlertModalProps {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
  onClose: () => void;
}

const ICONS: Record<AlertType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
  confirm: "?",
};

const ICON_COLORS: Record<AlertType, { bg: string; text: string }> = {
  success: { bg: "#DCFCE7", text: "#16A34A" },
  error: { bg: "#FEE2E2", text: "#DC2626" },
  warning: { bg: "#FEF3C7", text: "#D97706" },
  info: { bg: "#DBEAFE", text: "#2563EB" },
  confirm: { bg: colors.primaryLight, text: colors.primary },
};

export const AlertModal: React.FC<AlertModalProps> = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", style: "default" }],
  onClose,
}) => {
  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onClose();
  };

  const iconColors = ICON_COLORS[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconColors.bg },
                ]}
              >
                <Text style={[styles.icon, { color: iconColors.text }]}>
                  {ICONS[type]}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Buttons */}
              <View
                style={[
                  styles.buttonsContainer,
                  buttons.length > 2 && styles.buttonsContainerVertical,
                ]}
              >
                {buttons.map((button, index) => {
                  const isCancel = button.style === "cancel";
                  const isDestructive = button.style === "destructive";

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.button,
                        buttons.length <= 2 && styles.buttonFlex,
                        isCancel && styles.buttonCancel,
                        isDestructive && styles.buttonDestructive,
                        !isCancel && !isDestructive && styles.buttonPrimary,
                      ]}
                      onPress={() => handleButtonPress(button)}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          isCancel && styles.buttonTextCancel,
                          isDestructive && styles.buttonTextDestructive,
                          !isCancel &&
                            !isDestructive &&
                            styles.buttonTextPrimary,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Helper hook to manage alert state
export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  type?: AlertType;
  buttons?: AlertButton[];
}

export const useAlert = () => {
  const [alertState, setAlertState] = React.useState<AlertState>({
    visible: false,
    title: "",
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    type?: AlertType
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type,
    });
  };

  const hideAlert = () => {
    setAlertState((prev) => ({ ...prev, visible: false }));
  };

  return {
    alertState,
    showAlert,
    hideAlert,
  };
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 28,
    fontWeight: "700",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  buttonsContainerVertical: {
    flexDirection: "column",
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFlex: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: "#F3F4F6",
  },
  buttonDestructive: {
    backgroundColor: "#FEE2E2",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextPrimary: {
    color: "#FFFFFF",
  },
  buttonTextCancel: {
    color: "#6B7280",
  },
  buttonTextDestructive: {
    color: "#DC2626",
  },
});
