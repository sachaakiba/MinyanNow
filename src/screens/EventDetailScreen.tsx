import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { Button } from "../components/Button";
import {
  eventsApi,
  requestsApi,
  Event,
  EventRequest,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

type EventDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EventDetail"
>;
type EventDetailScreenRouteProp = RouteProp<RootStackParamList, "EventDetail">;

interface EventDetailScreenProps {
  navigation: EventDetailScreenNavigationProp;
  route: EventDetailScreenRouteProp;
}

export const EventDetailScreen: React.FC<EventDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { eventId } = route.params;
  const { user } = useAuth();

  const [event, setEvent] = useState<
    (Event & { requests: EventRequest[] }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myRequest, setMyRequest] = useState<EventRequest | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await eventsApi.getById(eventId);
      setEvent(data);

      const userRequest = data.requests.find((r) => r.userId === user?.id);
      setMyRequest(userRequest || null);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger l'événement");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!event) return;

    setActionLoading(true);
    try {
      await requestsApi.create(event.id);
      Alert.alert("Succès", "Votre demande a été envoyée!");
      loadEvent();
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;

    Alert.alert("Annuler", "Voulez-vous annuler votre demande?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        style: "destructive",
        onPress: async () => {
          setActionLoading(true);
          try {
            await requestsApi.cancel(myRequest.id);
            Alert.alert("Succès", "Demande annulée");
            loadEvent();
          } catch (error: any) {
            Alert.alert("Erreur", error.message);
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.accept(requestId);
      loadEvent();
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.reject(requestId);
      loadEvent();
    } catch (error: any) {
      Alert.alert("Erreur", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;

    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cet événement?", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui",
        style: "destructive",
        onPress: async () => {
          try {
            await eventsApi.delete(event.id);
            Alert.alert("Succès", "Événement supprimé");
            navigation.goBack();
          } catch (error: any) {
            Alert.alert("Erreur", error.message);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const months = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!event) return null;

  const isOrganizer = event.organizerId === user?.id;
  const needed = event.maxParticipants - event.currentCount;
  const isFull = needed <= 0;
  const progress = event.currentCount / event.maxParticipants;
  const pendingRequests = event.requests.filter((r) => r.status === "PENDING");
  const acceptedRequests = event.requests.filter(
    (r) => r.status === "ACCEPTED"
  );

  return (
    <View style={styles.container}>
      {/* Header with gradient effect */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          {isOrganizer && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteEvent}
            >
              <Text style={styles.deleteBtnText}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Event Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.eventIcon}>{EVENT_TYPE_ICONS[event.type]}</Text>
        </View>

        <Text style={styles.eventType}>{EVENT_TYPE_LABELS[event.type]}</Text>
        <Text style={styles.eventTitle}>{event.title}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View style={styles.card}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Participants</Text>
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

          {isFull && <Text style={styles.fullText}>✓ Complet</Text>}
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📅</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>🕐</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Heure</Text>
              <Text style={styles.detailValue}>{formatTime(event.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📍</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Lieu</Text>
              <Text style={styles.detailValue}>{event.address}</Text>
              <Text style={styles.detailSubvalue}>{event.city}</Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        {event.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Organizer Card */}
        <View style={styles.card}>
          <View style={styles.organizerRow}>
            <View style={styles.organizerAvatar}>
              <Text style={styles.organizerAvatarText}>
                {(event.organizer.name || event.organizer.email)
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organisé par</Text>
              <Text style={styles.organizerName}>
                {event.organizer.name || event.organizer.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Section for non-organizers */}
        {!isOrganizer && (
          <View style={styles.actionSection}>
            {myRequest ? (
              <>
                <View
                  style={[
                    styles.statusCard,
                    myRequest.status === "ACCEPTED"
                      ? styles.statusAccepted
                      : myRequest.status === "PENDING"
                      ? styles.statusPending
                      : styles.statusRejected,
                  ]}
                >
                  <Text style={styles.statusIcon}>
                    {myRequest.status === "ACCEPTED"
                      ? "✓"
                      : myRequest.status === "PENDING"
                      ? "⏳"
                      : "✕"}
                  </Text>
                  <Text style={styles.statusText}>
                    {myRequest.status === "ACCEPTED"
                      ? "Vous participez"
                      : myRequest.status === "PENDING"
                      ? "Demande en attente"
                      : "Demande refusée"}
                  </Text>
                </View>
                {myRequest.status !== "REJECTED" && (
                  <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={handleCancelRequest}
                    disabled={actionLoading}
                  >
                    <Text style={styles.cancelLinkText}>
                      Annuler ma participation
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : isFull ? (
              <View style={styles.fullCard}>
                <Text style={styles.fullCardText}>Événement complet</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleRequestJoin}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.joinButtonText}>Rejoindre</Text>
                    <Text style={styles.joinButtonArrow}>→</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Requests Management for organizer */}
        {isOrganizer && pendingRequests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Demandes ({pendingRequests.length})
            </Text>
            {pendingRequests.map((request) => (
              <View key={request.id} style={styles.requestItem}>
                <View style={styles.requestAvatar}>
                  <Text style={styles.requestAvatarText}>
                    {(request.user.name || request.user.email)
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>
                    {request.user.name || request.user.email}
                  </Text>
                </View>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptRequest(request.id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.acceptBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectRequest(request.id)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Accepted participants for organizer */}
        {isOrganizer && acceptedRequests.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Participants ({acceptedRequests.length})
            </Text>
            {acceptedRequests.map((request) => (
              <View key={request.id} style={styles.participantItem}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {(request.user.name || request.user.email)
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.participantName}>
                  {request.user.name || request.user.email}
                </Text>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centered: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    backgroundColor: "#4F46E5",
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600" as const,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  iconContainer: {
    width: 72,
    height: 72,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    alignSelf: "center" as const,
    marginBottom: 16,
  },
  eventIcon: {
    fontSize: 36,
  },
  eventType: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center" as const,
    fontWeight: "500" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center" as const,
  },
  content: {
    flex: 1,
    marginTop: -16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E293B",
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E293B",
  },
  progressCount: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#4F46E5",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4F46E5",
    borderRadius: 4,
  },
  progressFull: {
    backgroundColor: "#10B981",
  },
  neededText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center" as const,
  },
  fullText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600" as const,
    marginTop: 10,
    textAlign: "center" as const,
  },
  detailItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
  },
  detailIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 14,
  },
  detailIcon: {
    fontSize: 20,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600" as const,
  },
  detailSubvalue: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  descriptionText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 24,
  },
  organizerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    backgroundColor: "#4F46E5",
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 14,
  },
  organizerAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  organizerName: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600" as const,
  },
  actionSection: {
    marginBottom: 16,
  },
  statusCard: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  statusAccepted: {
    backgroundColor: "#DCFCE7",
  },
  statusPending: {
    backgroundColor: "#FEF9C3",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusIcon: {
    fontSize: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#1E293B",
  },
  cancelLink: {
    alignItems: "center" as const,
    marginTop: 12,
  },
  cancelLinkText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "500" as const,
  },
  fullCard: {
    backgroundColor: "#F1F5F9",
    padding: 18,
    borderRadius: 16,
    alignItems: "center" as const,
  },
  fullCardText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#64748B",
  },
  joinButton: {
    backgroundColor: "#4F46E5",
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 18,
    borderRadius: 16,
    gap: 10,
  },
  joinButtonText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  joinButtonArrow: {
    fontSize: 18,
    color: "#FFFFFF",
  },
  requestItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  requestAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  requestAvatarText: {
    color: "#4F46E5",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#1E293B",
  },
  requestActions: {
    flexDirection: "row" as const,
    gap: 8,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#10B981",
    borderRadius: 18,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  acceptBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  rejectBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#EF4444",
    borderRadius: 18,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  rejectBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  participantItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  participantAvatar: {
    width: 36,
    height: 36,
    backgroundColor: "#DCFCE7",
    borderRadius: 18,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  participantAvatarText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  participantName: {
    flex: 1,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500" as const,
  },
  checkMark: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  bottomSpacing: {
    height: 40,
  },
});
