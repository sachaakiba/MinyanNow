import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import {
  requestsApi,
  EventRequest,
  EVENT_TYPE_ICONS,
  EVENT_TYPE_LABELS,
} from "../lib/api";

type MyParticipationsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "MyParticipations"
>;

interface MyParticipationsScreenProps {
  navigation: MyParticipationsScreenNavigationProp;
}

type TabType = "confirmed" | "pending";

export const MyParticipationsScreen: React.FC<MyParticipationsScreenProps> = ({
  navigation,
}) => {
  const [requests, setRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("confirmed");

  const loadRequests = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const data = await requestsApi.getMyRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests(false);
  };

  const confirmedRequests = requests.filter((r) => r.status === "ACCEPTED");
  const pendingRequests = requests.filter((r) => r.status === "PENDING");

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

  const renderEventItem = ({ item }: { item: EventRequest }) => {
    const event = item.event;
    if (!event) return null;

    const isConfirmed = item.status === "ACCEPTED";

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() =>
          navigation.navigate("EventDetail", { eventId: event.id })
        }
        activeOpacity={0.7}
      >
        <View style={styles.eventCardHeader}>
          <View
            style={[
              styles.iconBadge,
              isConfirmed ? styles.iconBadgeConfirmed : styles.iconBadgePending,
            ]}
          >
            <Text style={styles.eventIcon}>{EVENT_TYPE_ICONS[event.type]}</Text>
          </View>
          <View style={styles.eventInfo}>
            <Text style={styles.eventType}>
              {EVENT_TYPE_LABELS[event.type]}
            </Text>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title}
            </Text>
          </View>
          {isConfirmed ? (
            <View style={styles.confirmedBadge}>
              <Text style={styles.confirmedBadgeText}>✓</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>⏳</Text>
            </View>
          )}
        </View>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>🕐</Text>
            <Text style={styles.detailText}>{formatTime(event.date)}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText} numberOfLines={1}>
              {event.city}
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${
                      (event.currentCount / event.maxParticipants) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {event.currentCount}/{event.maxParticipants}
            </Text>
          </View>
          <Text style={styles.viewDetails}>Voir détails →</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: TabType) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{type === "confirmed" ? "📭" : "🔍"}</Text>
      <Text style={styles.emptyTitle}>
        {type === "confirmed"
          ? "Aucune participation confirmée"
          : "Aucune demande en attente"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === "confirmed"
          ? "Explorez la carte pour trouver des événements à rejoindre"
          : "Vos demandes en attente de validation apparaîtront ici"}
      </Text>
      {type === "confirmed" && (
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.exploreButtonText}>Explorer la carte</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const currentData =
    activeTab === "confirmed" ? confirmedRequests : pendingRequests;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes participations</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "confirmed" ? styles.tabActive : null,
          ]}
          onPress={() => setActiveTab("confirmed")}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                activeTab === "confirmed" ? styles.tabTextActive : null,
              ]}
            >
              Confirmées
            </Text>
            {confirmedRequests.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "confirmed" ? styles.tabBadgeActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "confirmed"
                      ? styles.tabBadgeTextActive
                      : null,
                  ]}
                >
                  {confirmedRequests.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "pending" ? styles.tabActive : null,
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <View style={styles.tabContent}>
            <Text
              style={[
                styles.tabText,
                activeTab === "pending" ? styles.tabTextActive : null,
              ]}
            >
              En attente
            </Text>
            {pendingRequests.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  activeTab === "pending" ? styles.tabBadgeActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    activeTab === "pending" ? styles.tabBadgeTextActive : null,
                  ]}
                >
                  {pendingRequests.length}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={() => renderEmptyState(activeTab)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  backButtonText: {
    fontSize: 20,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
  },
  headerPlaceholder: {
    width: 40,
  },
  tabsContainer: {
    flexDirection: "row" as const,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center" as const,
  },
  tabActive: {
    backgroundColor: "#4F46E5",
  },
  tabContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#6B7280",
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  iconBadgeConfirmed: {
    backgroundColor: "#DCFCE7",
  },
  iconBadgePending: {
    backgroundColor: "#FEF9C3",
  },
  eventIcon: {
    fontSize: 22,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#6B7280",
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: "#111827",
  },
  confirmedBadge: {
    width: 32,
    height: 32,
    backgroundColor: "#10B981",
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  confirmedBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  pendingBadge: {
    width: 32,
    height: 32,
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  pendingBadgeText: {
    fontSize: 16,
  },
  eventDetails: {
    flexDirection: "row" as const,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  detailRow: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#374151",
  },
  detailDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#E5E7EB",
  },
  eventFooter: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  progressContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    marginRight: 16,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginRight: 10,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#4F46E5",
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#9CA3AF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#374151",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center" as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
