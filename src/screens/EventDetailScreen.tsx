import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
  Modal,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";

import {
  eventsApi,
  requestsApi,
  Event,
  EventRequest,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
} from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert, IDViewerModal } from "../components";
import { colors } from "../lib/colors";

// Images
const rabinIcon = require("../../assets/rabin.png");
const wazeLogo = require("../../assets/waze-logo.png");
const googleMapsLogo = require("../../assets/google-maps-logo.png");

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

  // Pour ajouter/modifier un participant
  const [showParticipantModal, setShowParticipantModal] = useState(false);
  const [participantName, setParticipantName] = useState("");
  const [editingParticipantIndex, setEditingParticipantIndex] = useState<
    number | null
  >(null);

  // Alert modal state
  const { alertState, showAlert, hideAlert } = useAlert();

  // Navigation modal state
  const [showNavigationModal, setShowNavigationModal] = useState(false);

  // ID Viewer modal state
  const [showIdViewer, setShowIdViewer] = useState(false);
  const [viewingIdUser, setViewingIdUser] = useState<{
    id: string;
    name: string;
    requestId: string;
  } | null>(null);

  const openIdViewer = (
    userId: string,
    userName: string,
    requestId: string
  ) => {
    setViewingIdUser({ id: userId, name: userName, requestId });
    setShowIdViewer(true);
  };

  const handleAcceptFromModal = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.accept(requestId);
      setShowIdViewer(false);
      setViewingIdUser(null);
      loadEvent();
      showAlert(
        "Participant accepté",
        "Le participant a été ajouté à votre événement",
        undefined,
        "success"
      );
    } catch (error: any) {
      showAlert(
        "Erreur",
        error.message || "Impossible d'accepter la demande",
        undefined,
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectFromModal = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.reject(requestId);
      setShowIdViewer(false);
      setViewingIdUser(null);
      loadEvent();
      showAlert(
        "Demande refusée",
        "La demande a été refusée",
        undefined,
        "info"
      );
    } catch (error: any) {
      showAlert(
        "Erreur",
        error.message || "Impossible de refuser la demande",
        undefined,
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

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
      showAlert(
        "Erreur",
        "Impossible de charger l'événement",
        [{ text: "OK", onPress: () => navigation.goBack() }],
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!event) return;

    setActionLoading(true);
    try {
      await requestsApi.create(event.id);
      showAlert("Succès", "Votre demande a été envoyée!", undefined, "success");
      loadEvent();
    } catch (error: any) {
      showAlert("Erreur", error.message, undefined, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;

    showAlert(
      "Annuler",
      "Voulez-vous annuler votre demande?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await requestsApi.cancel(myRequest.id);
              showAlert("Succès", "Demande annulée", undefined, "success");
              loadEvent();
            } catch (error: any) {
              showAlert("Erreur", error.message, undefined, "error");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "confirm"
    );
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.accept(requestId);
      loadEvent();
    } catch (error: any) {
      showAlert("Erreur", error.message, undefined, "error");
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
      showAlert("Erreur", error.message, undefined, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAcceptedParticipant = async (
    requestId: string,
    name: string
  ) => {
    showAlert(
      "Retirer le participant",
      `Voulez-vous retirer ${name} de la liste ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await requestsApi.reject(requestId);
              loadEvent();
            } catch (error: any) {
              showAlert(
                "Erreur",
                error.message || "Impossible de retirer le participant",
                undefined,
                "error"
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "confirm"
    );
  };

  const handleRemoveInitialParticipant = async (
    index: number,
    name: string
  ) => {
    if (!event) return;

    showAlert(
      "Retirer le participant",
      `Voulez-vous retirer ${name} de la liste ?`,
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              const updatedEvent = await eventsApi.removeInitialParticipant(
                event.id,
                index
              );
              setEvent(updatedEvent);
            } catch (error: any) {
              showAlert(
                "Erreur",
                error.message || "Impossible de retirer le participant",
                undefined,
                "error"
              );
            }
          },
        },
      ],
      "confirm"
    );
  };

  const openAddParticipantModal = () => {
    setParticipantName("");
    setEditingParticipantIndex(null);
    setShowParticipantModal(true);
  };

  const openEditParticipantModal = (index: number, name: string) => {
    setParticipantName(name);
    setEditingParticipantIndex(index);
    setShowParticipantModal(true);
  };

  const handleSaveParticipant = async () => {
    if (!event || !participantName.trim()) return;

    try {
      let updatedEvent;
      if (editingParticipantIndex !== null) {
        // Modifier un participant existant
        updatedEvent = await eventsApi.updateInitialParticipant(
          event.id,
          editingParticipantIndex,
          participantName.trim()
        );
      } else {
        // Ajouter un nouveau participant
        updatedEvent = await eventsApi.addInitialParticipant(
          event.id,
          participantName.trim()
        );
      }
      setEvent(updatedEvent);
      setShowParticipantModal(false);
      setParticipantName("");
      setEditingParticipantIndex(null);
    } catch (error: any) {
      showAlert(
        "Erreur",
        error.message || "Impossible de sauvegarder le participant",
        undefined,
        "error"
      );
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;

    showAlert(
      "Supprimer",
      "Voulez-vous vraiment supprimer cet événement?",
      [
        { text: "Non", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              await eventsApi.delete(event.id);
              showAlert(
                "Succès",
                "Événement supprimé",
                [{ text: "OK", onPress: () => navigation.goBack() }],
                "success"
              );
            } catch (error: any) {
              showAlert("Erreur", error.message, undefined, "error");
            }
          },
        },
      ],
      "confirm"
    );
  };

  const openInWaze = () => {
    if (!event) return;
    setShowNavigationModal(false);
    const url = `https://waze.com/ul?ll=${event.latitude},${event.longitude}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      showAlert("Erreur", "Impossible d'ouvrir Waze", undefined, "error");
    });
  };

  const openInGoogleMaps = () => {
    if (!event) return;
    setShowNavigationModal(false);
    const url = Platform.select({
      ios: `comgooglemaps://?daddr=${event.latitude},${event.longitude}&directionsmode=driving`,
      android: `google.navigation:q=${event.latitude},${event.longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback vers la version web
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`
          );
        }
      });
    }
  };

  const openNavigationOptions = () => {
    setShowNavigationModal(true);
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
        <ActivityIndicator size="large" color={colors.primary} />
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
              {isOrganizer || myRequest?.status === "ACCEPTED" ? (
                <>
                  <Text style={styles.detailValue}>{event.address}</Text>
                  <Text style={styles.detailSubvalue}>{event.city}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.detailValue}>{event.city}</Text>
                  <Text style={styles.addressHidden}>
                    🔒 Adresse visible après acceptation
                  </Text>
                </>
              )}
            </View>
            {(isOrganizer || myRequest?.status === "ACCEPTED") && (
              <TouchableOpacity
                style={styles.navigationButton}
                onPress={openNavigationOptions}
              >
                <Text style={styles.navigationButtonText}>🚗</Text>
              </TouchableOpacity>
            )}
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

        {/* Participants List - visible only for organizer or accepted users */}
        {(isOrganizer || myRequest?.status === "ACCEPTED") && (
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Participants</Text>
              {isOrganizer && (
                <TouchableOpacity
                  style={styles.addParticipantBtn}
                  onPress={openAddParticipantModal}
                >
                  <Text style={styles.addParticipantBtnText}>+ Ajouter</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Participants initiaux */}
            {event.initialParticipants?.map((name: string, index: number) => (
              <View key={`initial-${index}`} style={styles.participantRow}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>
                    {name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.participantName}>{name}</Text>
                {isOrganizer ? (
                  <View style={styles.participantActions}>
                    <TouchableOpacity
                      style={styles.editParticipantBtn}
                      onPress={() => openEditParticipantModal(index, name)}
                    >
                      <Text style={styles.editParticipantBtnText}>✎</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeParticipantBtn}
                      onPress={() =>
                        handleRemoveInitialParticipant(index, name)
                      }
                    >
                      <Text style={styles.removeParticipantBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.participantBadge}>
                    <Text style={styles.participantBadgeText}>Confirmé</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Participants acceptés via l'app */}
            {acceptedRequests.map((request) => (
              <View key={request.id} style={styles.participantRow}>
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
                {isOrganizer ? (
                  <View style={styles.participantActions}>
                    <TouchableOpacity
                      style={styles.removeParticipantBtn}
                      onPress={() =>
                        handleRemoveAcceptedParticipant(
                          request.id,
                          request.user.name || request.user.email
                        )
                      }
                    >
                      <Text style={styles.removeParticipantBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.participantBadge}>
                    <Text style={styles.participantBadgeText}>Confirmé</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Message si aucun participant */}
            {(!event.initialParticipants ||
              event.initialParticipants.length === 0) &&
              acceptedRequests.length === 0 && (
                <Text style={styles.noParticipantsText}>
                  Aucun participant pour le moment
                </Text>
              )}
          </View>
        )}

        {/* Participants hidden message for non-accepted users */}
        {!isOrganizer && myRequest?.status !== "ACCEPTED" && (
          <View style={styles.participantsHiddenCard}>
            <Text style={styles.participantsHiddenIcon}>👥</Text>
            <Text style={styles.participantsHiddenText}>
              La liste des participants sera visible après acceptation de votre
              demande
            </Text>
          </View>
        )}

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
            <Text style={styles.cardSubtitle}>
              Vérifiez l'identité avant d'accepter
            </Text>
            {pendingRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestItemClickable}
                onPress={() =>
                  openIdViewer(
                    request.userId,
                    request.user.name || request.user.email,
                    request.id
                  )
                }
              >
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
                  <View style={styles.viewIdHint}>
                    <Text style={styles.viewIdHintIcon}>🪪</Text>
                    <Text style={styles.viewIdHintText}>
                      Appuyez pour vérifier l'identité
                    </Text>
                  </View>
                </View>
                <Text style={styles.requestArrow}>→</Text>
              </TouchableOpacity>
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

      {/* Modal pour ajouter/modifier un participant */}
      <Modal
        visible={showParticipantModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowParticipantModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingParticipantIndex !== null
                ? "Modifier le participant"
                : "Ajouter un participant"}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom du participant"
              value={participantName}
              onChangeText={setParticipantName}
              autoCapitalize="words"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowParticipantModal(false);
                  setParticipantName("");
                  setEditingParticipantIndex(null);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveBtn,
                  !participantName.trim() && styles.modalSaveBtnDisabled,
                ]}
                onPress={handleSaveParticipant}
                disabled={!participantName.trim()}
              >
                <Text style={styles.modalSaveBtnText}>
                  {editingParticipantIndex !== null ? "Modifier" : "Ajouter"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de navigation */}
      <Modal
        visible={showNavigationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNavigationModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowNavigationModal(false)}
        >
          <View style={styles.navigationModalContent}>
            <Image source={rabinIcon} style={styles.navigationModalIcon} />
            <Text style={styles.navigationModalTitle}>Itinéraire</Text>
            <Text style={styles.navigationModalSubtitle}>
              Choisissez votre application de navigation
            </Text>
            <View style={styles.navigationModalButtons}>
              <TouchableOpacity
                style={styles.navigationOption}
                onPress={openInWaze}
              >
                <Image source={wazeLogo} style={styles.navigationOptionLogo} />
                <Text style={styles.navigationOptionText}>Waze</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navigationOption}
                onPress={openInGoogleMaps}
              >
                <Image
                  source={googleMapsLogo}
                  style={styles.navigationOptionLogo}
                />
                <Text style={styles.navigationOptionText}>Google Maps</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.navigationCancelBtn}
              onPress={() => setShowNavigationModal(false)}
            >
              <Text style={styles.navigationCancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />

      {/* ID Viewer Modal */}
      {viewingIdUser && (
        <IDViewerModal
          visible={showIdViewer}
          userId={viewingIdUser.id}
          userName={viewingIdUser.name}
          requestId={viewingIdUser.requestId}
          onClose={() => {
            setShowIdViewer(false);
            setViewingIdUser(null);
          }}
          onAccept={handleAcceptFromModal}
          onReject={handleRejectFromModal}
          actionLoading={actionLoading}
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
  centered: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#F8FAFC",
  },
  headerSection: {
    backgroundColor: colors.primary,
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
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addParticipantBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addParticipantBtnText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  participantActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editParticipantBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  editParticipantBtnText: {
    fontSize: 14,
    color: colors.primary,
  },
  noParticipantsText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
    paddingVertical: 16,
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
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden" as const,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.primary,
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
  addressHidden: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    fontStyle: "italic",
  },
  navigationButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  navigationButtonText: {
    fontSize: 22,
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
    backgroundColor: colors.primary,
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
  participantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  participantAvatar: {
    width: 40,
    height: 40,
    backgroundColor: "#E0E7FF",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participantAvatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  participantName: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  participantBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantBadgeText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "600",
  },
  participantBadgeApp: {
    backgroundColor: colors.primaryLight,
  },
  participantBadgeTextApp: {
    color: colors.primary,
  },
  removeParticipantBtn: {
    width: 32,
    height: 32,
    backgroundColor: "#FEE2E2",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  removeParticipantBtnText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  participantsHiddenCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  participantsHiddenIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  participantsHiddenText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
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
    backgroundColor: colors.primary,
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
    color: colors.primary,
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
  cardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  requestItemClickable: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
  },
  viewIdHint: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginTop: 4,
    gap: 4,
  },
  viewIdHintIcon: {
    fontSize: 12,
  },
  viewIdHintText: {
    fontSize: 12,
    color: colors.primary,
  },
  requestArrow: {
    fontSize: 18,
    color: "#9CA3AF",
    marginLeft: 8,
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
  checkMark: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  bottomSpacing: {
    height: 40,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1E293B",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveBtnDisabled: {
    backgroundColor: "#C7D2FE",
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Navigation Modal styles
  navigationModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  navigationModalIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  navigationModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  navigationModalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  navigationModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  navigationOption: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  navigationOptionLogo: {
    width: 40,
    height: 40,
    marginBottom: 8,
    resizeMode: "contain",
  },
  navigationOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  navigationCancelBtn: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
  },
  navigationCancelBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
});
