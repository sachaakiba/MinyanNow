import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Event, EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from "../lib/api";

interface EventCardProps {
  event: Event;
  onPress: () => void;
  onRequestJoin?: () => void;
  isLoading?: boolean;
  hasRequested?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onRequestJoin,
  isLoading = false,
  hasRequested = false,
}) => {
  const needed = event.maxParticipants - event.currentCount;
  const isFull = needed <= 0;
  const progress = event.currentCount / event.maxParticipants;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const months = [
      "jan",
      "fév",
      "mar",
      "avr",
      "mai",
      "juin",
      "juil",
      "août",
      "sep",
      "oct",
      "nov",
      "déc",
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${
      months[date.getMonth()]
    }`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <View style={styles.card}>
      {/* Header avec type et organisateur */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <View style={styles.iconBadge}>
            <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[event.type]}</Text>
          </View>
          <View>
            <Text style={styles.typeLabel}>
              {EVENT_TYPE_LABELS[event.type]}
            </Text>
            <Text style={styles.organizer}>
              par{" "}
              {event.organizer?.name ||
                event.organizer?.email ||
                "Organisateur"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
          <Text style={styles.detailsButtonText}>Détails</Text>
          <Text style={styles.detailsArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Titre */}
      <Text style={styles.title} numberOfLines={1}>
        {event.title}
      </Text>

      {/* Infos principales */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoValue}>{formatDate(event.date)}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>🕐</Text>
          <Text style={styles.infoValue}>{formatTime(event.date)}</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoIcon}>📍</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {event.city}
          </Text>
        </View>
      </View>

      {/* Progress bar des participants */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Participants</Text>
          <Text style={styles.progressCount}>
            {event.currentCount}/{event.maxParticipants}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${progress * 100}%` },
              isFull ? styles.progressFull : null,
            ]}
          />
        </View>
        {!isFull && (
          <Text style={styles.neededText}>
            {needed} place{needed > 1 ? "s" : ""} restante
            {needed > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Bouton rejoindre */}
      {onRequestJoin && !isFull && !hasRequested && (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={(e) => {
            e.stopPropagation();
            onRequestJoin();
          }}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.joinButtonText}>Rejoindre</Text>
              <Text style={styles.joinButtonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {hasRequested && !isFull && (
        <View style={styles.requestedBadge}>
          <Text style={styles.requestedBadgeText}>⏳ Demande envoyée</Text>
        </View>
      )}

      {isFull && (
        <View style={styles.fullBadge}>
          <Text style={styles.fullBadgeText}>✓ Événement complet</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 14,
  },
  typeContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
  },
  iconBadge: {
    width: 44,
    height: 44,
    backgroundColor: "#F0F0FF",
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  typeIcon: {
    fontSize: 22,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#4F46E5",
  },
  organizer: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  detailsButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  detailsArrow: {
    fontSize: 16,
    color: "#9CA3AF",
    marginLeft: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 14,
  },
  infoContainer: {
    flexDirection: "row" as const,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  infoIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#374151",
  },
  infoDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  progressCount: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#4F46E5",
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  progressFull: {
    backgroundColor: "#10B981",
  },
  neededText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center" as const,
  },
  joinButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  joinButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  joinButtonArrow: {
    color: "#FFFFFF",
    fontSize: 18,
  },
  fullBadge: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  fullBadgeText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  requestedBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  requestedBadgeText: {
    color: "#92400E",
    fontSize: 14,
    fontWeight: "600" as const,
  },
});
