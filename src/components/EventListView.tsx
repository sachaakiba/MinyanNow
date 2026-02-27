import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Event, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from "../lib/api";
import { colors } from "../lib/colors";

interface EventListViewProps {
  events: Event[];
  loading: boolean;
  onEventPress: (event: Event) => void;
  onRefresh: () => void;
}

export const EventListView: React.FC<EventListViewProps> = ({
  events,
  loading,
  onEventPress,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale =
      i18n.language === "he"
        ? "he-IL"
        : i18n.language === "en"
        ? "en-US"
        : "fr-FR";
    return date.toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const locale =
      i18n.language === "he"
        ? "he-IL"
        : i18n.language === "en"
        ? "en-US"
        : "fr-FR";
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const needed = item.maxParticipants - item.currentCount;
    const isFull = needed <= 0;
    const progress = item.currentCount / item.maxParticipants;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onEventPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBadge}>
            <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[item.type]}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.typeLabel}>
              {EVENT_TYPE_LABELS[item.type]}
            </Text>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoText}>{formatTime(item.date)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText} numberOfLines={1}>
              {item.city}
            </Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(progress * 100, 100)}%` },
                isFull && styles.progressFull,
              ]}
            />
          </View>
          <Text style={[styles.progressText, isFull && styles.progressTextFull]}>
            {item.currentCount}/{item.maxParticipants}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("map.loading")}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      renderItem={renderEvent}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshing={loading}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>{t("map.listEmpty")}</Text>
          <Text style={styles.emptySubtitle}>{t("map.listEmptySubtitle")}</Text>
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  typeIcon: {
    fontSize: 22,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text.primary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: colors.text.tertiary,
    fontWeight: "300",
  },
  infoRow: {
    flexDirection: "row",
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 4,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  infoIcon: {
    fontSize: 13,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border.light,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressFull: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    minWidth: 40,
    textAlign: "right",
  },
  progressTextFull: {
    color: colors.success,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
