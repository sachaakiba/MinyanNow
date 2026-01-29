import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { colors } from "../lib/colors";
import { CountryCode, PHONE_COUNTRIES } from "../types/auth";

interface CountrySelectorProps {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selected = PHONE_COUNTRIES[value];
  const options = Object.entries(PHONE_COUNTRIES) as [
    CountryCode,
    (typeof PHONE_COUNTRIES)[CountryCode],
  ][];

  const handleSelect = (code: CountryCode) => {
    onChange(code);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{selected.flag}</Text>
        <Text style={styles.name}>{selected.name}</Text>
        <Text style={styles.code}>{selected.code}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {options.map(([code, country]) => (
              <TouchableOpacity
                key={code}
                style={[styles.option, code === value && styles.optionSelected]}
                onPress={() => handleSelect(code)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionFlag}>{country.flag}</Text>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionName}>{country.name}</Text>
                  <Text style={styles.optionCode}>{country.code}</Text>
                </View>
                {code === value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    gap: 8,
  },
  flag: {
    fontSize: 24,
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  code: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  arrow: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: 320,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
  },
  optionFlag: {
    fontSize: 28,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: "500",
  },
  optionCode: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "bold",
  },
});
