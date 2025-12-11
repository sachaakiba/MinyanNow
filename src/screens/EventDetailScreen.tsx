import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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

      // Check if user has a request
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
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
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
  const pendingRequests = event.requests.filter((r) => r.status === "PENDING");
  const acceptedRequests = event.requests.filter(
    (r) => r.status === "ACCEPTED"
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        {isOrganizer && (
          <TouchableOpacity onPress={handleDeleteEvent}>
            <Text style={styles.deleteButton}>Supprimer</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Type Badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[event.type]}</Text>
          <Text style={styles.typeLabel}>{EVENT_TYPE_LABELS[event.type]}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        {event.description && (
          <Text style={styles.description}>{event.description}</Text>
        )}

        {/* Participants visualization */}
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsGrid}>
            {Array.from({ length: event.maxParticipants }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.participantCircle,
                  index < event.currentCount
                    ? styles.circleFilled
                    : styles.circleEmpty,
                ]}
              >
                {index < event.currentCount && (
                  <Text style={styles.circleText}>✓</Text>
                )}
              </View>
            ))}
          </View>
          <Text style={styles.participantsCount}>
            {event.currentCount}/{event.maxParticipants}
            {!isFull && ` • ${needed} manquant${needed > 1 ? "s" : ""}`}
          </Text>
        </View>

        {/* Event Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📅</Text>
            <Text style={styles.detailText}>{formatDate(event.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>📍</Text>
            <Text style={styles.detailText}>
              {event.address}, {event.city}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>👤</Text>
            <Text style={styles.detailText}>
              Organisé par {event.organizer.name || event.organizer.email}
            </Text>
          </View>
        </View>

        {/* Action Button for non-organizers */}
        {!isOrganizer && (
          <View style={styles.actionSection}>
            {myRequest ? (
              <View>
                <View
                  style={[
                    styles.statusBadge,
                    myRequest.status === "ACCEPTED"
                      ? styles.statusAccepted
                      : myRequest.status === "PENDING"
                      ? styles.statusPending
                      : styles.statusRejected,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {myRequest.status === "ACCEPTED"
                      ? "✓ Vous participez"
                      : myRequest.status === "PENDING"
                      ? "⏳ Demande en attente"
                      : "✕ Demande refusée"}
                  </Text>
                </View>
                {myRequest.status !== "REJECTED" && (
                  <Button
                    title="Annuler ma participation"
                    onPress={handleCancelRequest}
                    variant="outline"
                    loading={actionLoading}
                    style={styles.cancelButton}
                  />
                )}
              </View>
            ) : isFull ? (
              <View style={styles.fullBadge}>
                <Text style={styles.fullText}>Événement complet</Text>
              </View>
            ) : (
              <Button
                title="Demander à rejoindre"
                onPress={handleRequestJoin}
                loading={actionLoading}
              />
            )}
          </View>
        )}

        {/* Requests Management for organizer */}
        {isOrganizer && (
          <View style={styles.requestsSection}>
            <Text style={styles.sectionTitle}>
              Demandes en attente ({pendingRequests.length})
            </Text>
            {pendingRequests.length === 0 ? (
              <Text style={styles.emptyText}>Aucune demande en attente</Text>
            ) : (
              pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestName}>
                      {request.user.name || request.user.email}
                    </Text>
                    {request.message && (
                      <Text style={styles.requestMessage}>
                        {request.message}
                      </Text>
                    )}
                  </View>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.acceptButton}
                      onPress={() => handleAcceptRequest(request.id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.acceptButtonText}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleRejectRequest(request.id)}
                      disabled={actionLoading}
                    >
                      <Text style={styles.rejectButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

            <Text style={[styles.sectionTitle, styles.marginTop]}>
              Participants acceptés ({acceptedRequests.length})
            </Text>
            {acceptedRequests.length === 0 ? (
              <Text style={styles.emptyText}>
                Aucun participant pour le moment
              </Text>
            ) : (
              acceptedRequests.map((request) => (
                <View key={request.id} style={styles.participantCard}>
                  <Text style={styles.participantName}>
                    ✓ {request.user.name || request.user.email}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  deleteButton: {
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  participantsSection: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  participantsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  participantCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  circleFilled: {
    backgroundColor: "#4F46E5",
  },
  circleEmpty: {
    backgroundColor: "#E5E7EB",
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
  },
  circleText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  participantsCount: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  detailText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  actionSection: {
    marginBottom: 24,
  },
  statusBadge: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  statusAccepted: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusRejected: {
    backgroundColor: "#FEE2E2",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  cancelButton: {
    marginTop: 8,
  },
  fullBadge: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fullText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  requestsSection: {
    marginBottom: 40,
  },
  marginTop: {
    marginTop: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  requestMessage: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  participantCard: {
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 16,
    color: "#065F46",
    fontWeight: "500",
  },
});
