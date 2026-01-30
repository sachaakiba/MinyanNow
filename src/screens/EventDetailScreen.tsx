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
import { useTranslation } from "react-i18next";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
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
  const { t, i18n } = useTranslation();
  const { eventId } = route.params;
  const { user, hasAllDocuments } = useAuth();

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

  // Pour modifier les heures
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState<Date | null>(null);
  const [tempEndTime, setTempEndTime] = useState<Date | null>(null);

  // Alert modal state
  const { alertState, showAlert, hideAlert } = useAlert();

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
    requestId: string,
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
        t("common.success"),
        t("events.detail.participantAccepted"),
        undefined,
        "success",
      );
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("events.detail.acceptError"),
        undefined,
        "error",
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
        t("common.success"),
        t("events.detail.requestRejected"),
        undefined,
        "info",
      );
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("events.detail.rejectError"),
        undefined,
        "error",
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
        t("common.error"),
        t("events.detail.loadError"),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }],
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!event) return;

    // Check if all documents are uploaded
    if (!hasAllDocuments) {
      showAlert(
        t("documents.missingDocuments"),
        t("documents.missingDocumentsMessage"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("documents.goToDocuments"),
            onPress: () => navigation.goBack(),
          },
        ],
        "warning",
      );
      return;
    }

    setActionLoading(true);
    try {
      await requestsApi.create(event.id);
      showAlert(
        t("common.success"),
        t("events.detail.requestSent"),
        undefined,
        "success",
      );
      loadEvent();
    } catch (error: any) {
      showAlert(t("common.error"), error.message, undefined, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!myRequest) return;

    showAlert(
      t("events.detail.cancelRequest"),
      t("events.detail.cancelRequestMessage"),
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await requestsApi.cancel(myRequest.id);
              showAlert(
                t("common.success"),
                t("events.detail.requestCancelled"),
                undefined,
                "success",
              );
              loadEvent();
            } catch (error: any) {
              showAlert(t("common.error"), error.message, undefined, "error");
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "confirm",
    );
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.accept(requestId);
      loadEvent();
    } catch (error: any) {
      showAlert(t("common.error"), error.message, undefined, "error");
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
      showAlert(t("common.error"), error.message, undefined, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAcceptedParticipant = async (
    requestId: string,
    name: string,
  ) => {
    showAlert(
      t("events.detail.removeParticipant"),
      t("events.detail.removeParticipantMessage", { name }),
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            try {
              await requestsApi.reject(requestId);
              loadEvent();
            } catch (error: any) {
              showAlert(
                t("common.error"),
                error.message || t("events.detail.rejectError"),
                undefined,
                "error",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
      "confirm",
    );
  };

  const handleRemoveInitialParticipant = async (
    index: number,
    name: string,
  ) => {
    if (!event) return;

    showAlert(
      t("events.detail.removeParticipant"),
      t("events.detail.removeParticipantMessage", { name }),
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: async () => {
            try {
              const updatedEvent = await eventsApi.removeInitialParticipant(
                event.id,
                index,
              );
              setEvent(updatedEvent);
            } catch (error: any) {
              showAlert(
                t("common.error"),
                error.message || t("events.detail.rejectError"),
                undefined,
                "error",
              );
            }
          },
        },
      ],
      "confirm",
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
          participantName.trim(),
        );
      } else {
        // Ajouter un nouveau participant
        updatedEvent = await eventsApi.addInitialParticipant(
          event.id,
          participantName.trim(),
        );
      }
      setEvent(updatedEvent);
      setShowParticipantModal(false);
      setParticipantName("");
      setEditingParticipantIndex(null);
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("events.detail.saveParticipantError"),
        undefined,
        "error",
      );
    }
  };

  const handleUpdateStartTime = async (newTime: Date) => {
    if (!event) return;

    try {
      setActionLoading(true);
      const eventDate = new Date(event.date);
      eventDate.setHours(newTime.getHours());
      eventDate.setMinutes(newTime.getMinutes());
      eventDate.setSeconds(0);

      const updatedEvent = await eventsApi.update(event.id, {
        date: eventDate.toISOString(),
      });
      setEvent({ ...event, ...updatedEvent });
      setShowStartTimePicker(false);
      setTempStartTime(null);
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("common.error"),
        undefined,
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEndTime = async (newTime: Date) => {
    if (!event) return;

    try {
      setActionLoading(true);
      const eventDate = new Date(event.date);
      const endDate = new Date(eventDate);
      endDate.setHours(newTime.getHours());
      endDate.setMinutes(newTime.getMinutes());
      endDate.setSeconds(0);

      const updatedEvent = await eventsApi.update(event.id, {
        endDate: endDate.toISOString(),
      });
      setEvent({ ...event, ...updatedEvent });
      setShowEndTimePicker(false);
      setTempEndTime(null);
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("common.error"),
        undefined,
        "error",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const onStartTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowStartTimePicker(false);
      if (date) {
        handleUpdateStartTime(date);
      }
    } else if (date) {
      setTempStartTime(date);
    }
  };

  const onEndTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowEndTimePicker(false);
      if (date) {
        handleUpdateEndTime(date);
      }
    } else if (date) {
      setTempEndTime(date);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;

    showAlert(
      t("events.detail.deleteEvent"),
      t("events.detail.deleteEventMessage"),
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: async () => {
            try {
              await eventsApi.delete(event.id);
              showAlert(
                t("common.success"),
                t("events.detail.eventDeleted"),
                [{ text: t("common.ok"), onPress: () => navigation.goBack() }],
                "success",
              );
            } catch (error: any) {
              showAlert(t("common.error"), error.message, undefined, "error");
            }
          },
        },
      ],
      "confirm",
    );
  };

  const openInWaze = () => {
    if (!event) return;
    const url = `https://waze.com/ul?ll=${event.latitude},${event.longitude}&navigate=yes`;
    Linking.openURL(url).catch(() => {
      showAlert(
        t("common.error"),
        t("events.detail.errorOpenWaze"),
        undefined,
        "error",
      );
    });
  };

  const openInGoogleMaps = () => {
    if (!event) return;
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
            `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`,
          );
        }
      });
    }
  };

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
      month: "long",
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
    (r) => r.status === "ACCEPTED",
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
          {/* Delete button moved to bottom of screen */}
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
            <Text style={styles.progressTitle}>
              {t("events.detail.participants")}
            </Text>
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
              {t("events.detail.spotsLeft", { count: needed })}
            </Text>
          )}

          {isFull && (
            <Text style={styles.fullText}>{t("events.detail.full")}</Text>
          )}
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📅</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>{t("events.detail.date")}</Text>
              <Text style={styles.detailValue}>{formatDate(event.date)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>🕐</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("events.detail.startTime")}
              </Text>
              <View style={styles.timeRowContainer}>
                <Text style={styles.detailValue}>{formatTime(event.date)}</Text>
                {isOrganizer && (
                  <TouchableOpacity
                    style={styles.timeEditBtn}
                    onPress={() => {
                      setTempStartTime(new Date(event.date));
                      setShowStartTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeEditBtnText}>✎</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>⏰</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("events.detail.endTime")}
              </Text>
              <View style={styles.timeRowContainer}>
                <Text style={styles.detailValue}>
                  {event.endDate ? formatTime(event.endDate) : "-"}
                </Text>
                {isOrganizer && (
                  <TouchableOpacity
                    style={styles.timeEditBtn}
                    onPress={() => {
                      setTempEndTime(
                        event.endDate
                          ? new Date(event.endDate)
                          : new Date(event.date),
                      );
                      setShowEndTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeEditBtnText}>✎</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Text style={styles.detailIcon}>📍</Text>
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>
                {t("events.detail.location")}
              </Text>
              {isOrganizer || myRequest?.status === "ACCEPTED" ? (
                <>
                  <Text style={styles.detailValue}>{event.address}</Text>
                  <Text style={styles.detailSubvalue}>{event.city}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.detailValue}>{event.city}</Text>
                  <Text style={styles.addressHidden}>
                    {t("events.detail.addressHidden")}
                  </Text>
                </>
              )}
            </View>
            {(isOrganizer || myRequest?.status === "ACCEPTED") && (
              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={openInWaze}
                >
                  <Image
                    source={wazeLogo}
                    style={styles.navigationButtonIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.navigationButton}
                  onPress={openInGoogleMaps}
                >
                  <Image
                    source={googleMapsLogo}
                    style={styles.navigationButtonIcon}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Description Card */}
        {event.description && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {t("events.detail.description")}
            </Text>
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
              <Text style={styles.organizerLabel}>
                {t("events.detail.organizedBy")}
              </Text>
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
              <Text style={styles.cardTitle}>
                {t("events.detail.participantsList")}
              </Text>
              {isOrganizer && (
                <TouchableOpacity
                  style={styles.addParticipantBtn}
                  onPress={openAddParticipantModal}
                >
                  <Text style={styles.addParticipantBtnText}>
                    {t("events.detail.addParticipant")}
                  </Text>
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
                    <Text style={styles.participantBadgeText}>
                      {t("events.detail.confirmed")}
                    </Text>
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
                          request.user.name || request.user.email,
                        )
                      }
                    >
                      <Text style={styles.removeParticipantBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.participantBadge}>
                    <Text style={styles.participantBadgeText}>
                      {t("events.detail.confirmed")}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {/* Message si aucun participant */}
            {(!event.initialParticipants ||
              event.initialParticipants.length === 0) &&
              acceptedRequests.length === 0 && (
                <Text style={styles.noParticipantsText}>
                  {t("events.detail.noParticipants")}
                </Text>
              )}
          </View>
        )}

        {/* Participants hidden message for non-accepted users */}
        {!isOrganizer && myRequest?.status !== "ACCEPTED" && (
          <View style={styles.participantsHiddenCard}>
            <Text style={styles.participantsHiddenIcon}>👥</Text>
            <Text style={styles.participantsHiddenText}>
              {t("events.detail.hiddenParticipants")}
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
                      ? t("events.detail.youParticipate")
                      : myRequest.status === "PENDING"
                        ? t("events.detail.pendingRequest")
                        : t("events.detail.rejectedRequest")}
                  </Text>
                </View>
                {myRequest.status !== "REJECTED" && (
                  <TouchableOpacity
                    style={styles.cancelLink}
                    onPress={handleCancelRequest}
                    disabled={actionLoading}
                  >
                    <Text style={styles.cancelLinkText}>
                      {t("events.detail.cancelParticipation")}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : isFull ? (
              <View style={styles.fullCard}>
                <Text style={styles.fullCardText}>
                  {t("events.detail.eventFull")}
                </Text>
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
                    <Text style={styles.joinButtonText}>
                      {t("events.detail.join")}
                    </Text>
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
              {t("events.detail.requests")} ({pendingRequests.length})
            </Text>
            <Text style={styles.cardSubtitle}>
              {t("events.detail.verifyId")}
            </Text>
            {pendingRequests.map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestItemClickable}
                onPress={() =>
                  openIdViewer(
                    request.userId,
                    request.user.name || request.user.email,
                    request.id,
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
                      {t("events.detail.tapToVerify")}
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
              {t("events.detail.participants")} ({acceptedRequests.length})
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

        {/* Delete Event Button for organizer */}
        {isOrganizer && (
          <TouchableOpacity
            style={styles.deleteEventButton}
            onPress={handleDeleteEvent}
          >
            <Text style={styles.deleteEventButtonIcon}>🗑️</Text>
            <Text style={styles.deleteEventButtonText}>
              {t("events.detail.deleteEvent")}
            </Text>
          </TouchableOpacity>
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
                ? t("events.detail.editParticipant")
                : t("events.detail.addParticipantTitle")}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("events.create.participantName")}
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
                <Text style={styles.modalCancelBtnText}>
                  {t("common.cancel")}
                </Text>
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
                  {editingParticipantIndex !== null
                    ? t("common.edit")
                    : t("common.add")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showStartTimePicker}
              transparent
              animationType="slide"
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowStartTimePicker(false)}
              >
                <TouchableOpacity
                  style={styles.timePickerModal}
                  activeOpacity={1}
                >
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={styles.timePickerCancel}>
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>
                      {t("events.detail.editStart")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (tempStartTime) {
                          handleUpdateStartTime(tempStartTime);
                        }
                      }}
                    >
                      <Text style={styles.timePickerDone}>
                        {t("common.ok")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={tempStartTime || new Date(event?.date || new Date())}
                    mode="time"
                    display="spinner"
                    onChange={onStartTimeChange}
                    locale="fr-FR"
                    style={styles.iosTimePicker}
                    themeVariant="light"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={tempStartTime || new Date(event?.date || new Date())}
              mode="time"
              display="default"
              onChange={onStartTimeChange}
              is24Hour={true}
            />
          )}
        </>
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <>
          {Platform.OS === "ios" ? (
            <Modal
              visible={showEndTimePicker}
              transparent
              animationType="slide"
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowEndTimePicker(false)}
              >
                <TouchableOpacity
                  style={styles.timePickerModal}
                  activeOpacity={1}
                >
                  <View style={styles.timePickerHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={styles.timePickerCancel}>
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.timePickerTitle}>
                      {t("events.detail.editEnd")}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (tempEndTime) {
                          handleUpdateEndTime(tempEndTime);
                        }
                      }}
                    >
                      <Text style={styles.timePickerDone}>
                        {t("common.ok")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={
                      tempEndTime ||
                      new Date(event?.endDate || event?.date || new Date())
                    }
                    mode="time"
                    display="spinner"
                    onChange={onEndTimeChange}
                    locale="fr-FR"
                    style={styles.iosTimePicker}
                    themeVariant="light"
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker
              value={
                tempEndTime ||
                new Date(event?.endDate || event?.date || new Date())
              }
              mode="time"
              display="default"
              onChange={onEndTimeChange}
              is24Hour={true}
            />
          )}
        </>
      )}

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
  navigationButtons: {
    flexDirection: "row" as const,
    gap: 8,
    marginLeft: "auto",
  },
  navigationButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primaryLight,
    borderRadius: 10,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  navigationButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain" as const,
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
  deleteEventButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#FEE2E2",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    gap: 10,
  },
  deleteEventButtonIcon: {
    fontSize: 18,
  },
  deleteEventButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#DC2626",
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
  timeRowContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  timeEditBtn: {
    width: 32,
    height: 32,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginLeft: 12,
  },
  timeEditBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  timePickerModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    width: "100%",
    position: "absolute" as const,
    bottom: 0,
  },
  timePickerHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  timePickerTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.text.primary,
  },
  timePickerCancel: {
    fontSize: 17,
    color: colors.error,
  },
  timePickerDone: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  iosTimePicker: {
    height: 200,
  },
});
