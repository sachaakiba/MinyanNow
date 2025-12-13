import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { colors } from "../lib/colors";

interface DatePickerModalProps {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  title?: string;
  mode?: "date" | "time";
  minimumDate?: Date;
  maximumDate?: Date;
}

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  value,
  onChange,
  onClose,
  title,
  mode = "date",
  minimumDate,
  maximumDate,
}) => {
  const { t, i18n } = useTranslation();
  const displayTitle = title || t("datePicker.select");
  const locale =
    i18n.language === "he"
      ? "he-IL"
      : i18n.language === "en"
      ? "en-US"
      : "fr-FR";
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      onClose();
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  if (!visible) return null;

  // iOS
  if (Platform.OS === "ios") {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalCancel}>{t("datePicker.cancel")}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{displayTitle}</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.modalDone}>{t("datePicker.ok")}</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode={mode}
              display={mode === "date" ? "inline" : "spinner"}
              onChange={(event, date) => {
                if (date) onChange(date);
              }}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              locale={locale}
              style={
                mode === "date" ? styles.iosDatePicker : styles.iosTimePicker
              }
              themeVariant="light"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // Android
  return (
    <DateTimePicker
      value={value}
      mode={mode}
      display="default"
      onChange={handleChange}
      minimumDate={minimumDate}
      maximumDate={maximumDate}
    />
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },
  modalCancel: {
    fontSize: 16,
    color: "#6B7280",
  },
  modalDone: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "600",
  },
  iosDatePicker: {
    height: 350,
    marginHorizontal: 10,
  },
  iosTimePicker: {
    height: 200,
  },
});
