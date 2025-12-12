import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Event, EVENT_TYPE_ICONS } from "../lib/api";
import { colors } from "../lib/colors";

interface EventMarkerProps {
  event: Event;
  onPress: () => void;
}

export const EventMarker: React.FC<EventMarkerProps> = ({ event, onPress }) => {
  const needed = event.maxParticipants - event.currentCount;
  const isFull = needed <= 0;
  const isUrgent = needed <= 3 && needed > 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={styles.container}>
        <View
          style={[
            styles.bubble,
            isFull
              ? styles.bubbleFull
              : isUrgent
              ? styles.bubbleUrgent
              : styles.bubbleNormal,
          ]}
        >
          <Text style={styles.icon}>{EVENT_TYPE_ICONS[event.type]}</Text>
          <View style={styles.countContainer}>
            <Text style={[styles.count, isFull && styles.countFull]}>
              {isFull ? "✓" : needed}
            </Text>
          </View>
        </View>
        <View style={styles.arrow} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bubbleNormal: {
    backgroundColor: colors.primary,
  },
  bubbleUrgent: {
    backgroundColor: "#F59E0B",
  },
  bubbleFull: {
    backgroundColor: "#10B981",
  },
  icon: {
    fontSize: 16,
    marginRight: 6,
  },
  countContainer: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  count: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  countFull: {
    color: "#10B981",
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
    marginTop: -1,
  },
});
