import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  eventsApi,
  requestsApi,
  Event,
  EventRequest,
  EVENT_TYPE_ICONS,
} from "../lib/api";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Profile"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myRequests, setMyRequests] = useState<EventRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"events" | "requests">("events");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [events, requests] = await Promise.all([
        eventsApi.getMyEvents(),
        requestsApi.getMyRequests(),
      ]);
      setMyEvents(events);
      setMyRequests(requests);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "#10B981";
      case "PENDING":
        return "#F59E0B";
      case "REJECTED":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "Acceptée";
      case "PENDING":
        return "En attente";
      case "REJECTED":
        return "Refusée";
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ||
                user?.email?.charAt(0)?.toUpperCase() ||
                "?"}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || "Utilisateur"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "events" && styles.tabActive]}
            onPress={() => setActiveTab("events")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "events" && styles.tabTextActive,
              ]}
            >
              Mes événements ({myEvents.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "requests" && styles.tabActive]}
            onPress={() => setActiveTab("requests")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "requests" && styles.tabTextActive,
              ]}
            >
              Mes demandes ({myRequests.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#4F46E5"
            style={styles.loader}
          />
        ) : activeTab === "events" ? (
          <View style={styles.listSection}>
            {myEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={styles.emptyText}>
                  Vous n'avez créé aucun événement
                </Text>
                <Button
                  title="Créer un événement"
                  onPress={() => navigation.navigate("CreateEvent")}
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              myEvents.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  style={styles.eventCard}
                  onPress={() =>
                    navigation.navigate("EventDetail", { eventId: event.id })
                  }
                >
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventIcon}>
                      {EVENT_TYPE_ICONS[event.type]}
                    </Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </Text>
                      <Text style={styles.eventDate}>
                        {formatDate(event.date)}
                      </Text>
                    </View>
                    <View style={styles.eventBadge}>
                      <Text style={styles.eventBadgeText}>
                        {event._count?.requests || 0} demandes
                      </Text>
                    </View>
                  </View>
                  <View style={styles.eventFooter}>
                    <Text style={styles.eventParticipants}>
                      {event.currentCount}/{event.maxParticipants} participants
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : (
          <View style={styles.listSection}>
            {myRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🙋</Text>
                <Text style={styles.emptyText}>
                  Vous n'avez fait aucune demande
                </Text>
              </View>
            ) : (
              myRequests.map((request) => (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() =>
                    navigation.navigate("EventDetail", {
                      eventId: request.eventId,
                    })
                  }
                >
                  <View style={styles.requestHeader}>
                    <Text style={styles.eventIcon}>
                      {request.event
                        ? EVENT_TYPE_ICONS[request.event.type]
                        : "📅"}
                    </Text>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle} numberOfLines={1}>
                        {request.event?.title || "Événement"}
                      </Text>
                      <Text style={styles.eventDate}>
                        {request.event
                          ? formatDate(request.event.date)
                          : "Date inconnue"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(request.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(request.status) },
                        ]}
                      >
                        {getStatusLabel(request.status)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Button
            title="Se déconnecter"
            onPress={handleSignOut}
            variant="outline"
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  userSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#F9FAFB",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#4F46E5",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabTextActive: {
    color: "#4F46E5",
  },
  loader: {
    marginTop: 40,
  },
  listSection: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
  },
  eventCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  eventDate: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  eventBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  eventBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400E",
  },
  eventFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  eventParticipants: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "500",
  },
  requestCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  signOutSection: {
    padding: 16,
    paddingBottom: 40,
  },
});
