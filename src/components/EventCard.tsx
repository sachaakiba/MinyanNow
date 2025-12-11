import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Event, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from "../lib/api";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRequestJoin?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onRequestJoin,
}) => {
  const needed = event.maxParticipants - event.currentCount;
  const isFull = needed <= 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[event.type]}</Text>
          <Text style={styles.typeLabel}>{EVENT_TYPE_LABELS[event.type]}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isFull ? styles.statusFull : styles.statusOpen,
          ]}
        >
          <Text style={styles.statusText}>
            {isFull ? "Complet" : `${needed} manquant${needed > 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {event.title}
      </Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📅</Text>
        <Text style={styles.infoText}>{formatDate(event.date)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>📍</Text>
        <Text style={styles.infoText} numberOfLines={1}>
          {event.address}, {event.city}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.participantsContainer}>
          {Array.from({ length: event.maxParticipants }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.participantDot,
                index < event.currentCount ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
        </View>
        <Text style={styles.participantsText}>
          {event.currentCount}/{event.maxParticipants}
        </Text>
      </View>

      {onRequestJoin && !isFull && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={(e) => {
            e.stopPropagation();
            onRequestJoin();
          }}
        >
          <Text style={styles.joinButtonText}>Demander à rejoindre</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: "#FEF3C7",
  },
  statusFull: {
    backgroundColor: "#D1FAE5",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  participantsContainer: {
    flexDirection: "row",
    gap: 4,
  },
  participantDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotFilled: {
    backgroundColor: "#4F46E5",
  },
  dotEmpty: {
    backgroundColor: "#E5E7EB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  participantsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  joinButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
