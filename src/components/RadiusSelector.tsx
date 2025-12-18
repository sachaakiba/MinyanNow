import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "../lib/colors";

interface RadiusSelectorProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
}

const RADIUS_OPTIONS = [100, 250, 500, 750, 1000, 1500, 2000];

export const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  value,
  onValueChange,
}) => {
  const getLabel = (radius: number): string => {
    if (radius >= 1000) {
      return `${radius / 1000}km`;
    }
    return `${radius}m`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.optionsContainer}>
        {RADIUS_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, value === option && styles.optionSelected]}
            onPress={() => onValueChange(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                value === option && styles.optionTextSelected,
              ]}
            >
              {getLabel(option)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
