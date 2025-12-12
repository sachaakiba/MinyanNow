import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../lib/colors";

interface ClusterMarkerProps {
  count: number;
  hasUrgent: boolean;
}

export const ClusterMarker: React.FC<ClusterMarkerProps> = ({
  count,
  hasUrgent,
}) => {
  return (
    <View
      style={[
        styles.badge,
        hasUrgent ? styles.badgeUrgent : styles.badgeNormal,
      ]}
    >
      <Text style={[styles.count, hasUrgent && styles.countUrgent]}>
        {count}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeNormal: {
    backgroundColor: colors.primary,
  },
  badgeUrgent: {
    backgroundColor: "#F59E0B",
  },
  count: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  countUrgent: {
    color: "#FFFFFF",
  },
});
