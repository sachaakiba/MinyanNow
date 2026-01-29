import React from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import { CountryCode, PHONE_COUNTRIES } from "../types/auth";
import { colors } from "../lib/colors";

interface PhoneInputProps {
  country: CountryCode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  country,
  value,
  onChange,
  error,
  label,
}) => {
  const config = PHONE_COUNTRIES[country];

  const formatPhone = (input: string): string => {
    const digits = input.replace(/\D/g, "");

    if (country === "FR") {
      // Format: 06 12 34 56 78
      return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    } else if (country === "US") {
      // Format: (555) 123-4567
      if (digits.length <= 3) return digits;
      if (digits.length <= 6)
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }

    return digits;
  };

  const handleChange = (text: string) => {
    // Only allow digits and specific formatting characters
    const cleaned = text.replace(/[^\d\s()-]/g, "");
    onChange(cleaned);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputContainerError : null,
        ]}
      >
        <View style={styles.countryInfo}>
          <Text style={styles.flag}>{config.flag}</Text>
          <Text style={styles.code}>{config.code}</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder={config.format}
          placeholderTextColor={colors.text.tertiary}
          value={formatPhone(value)}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          maxLength={14} // FR: 10 digits + 4 spaces = 14, US: (555) 123-4567 = 14
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  countryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
});
