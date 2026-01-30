import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { IDViewerModal, AlertModal, useAlert } from "../components";
import {
  eventsApi,
  requestsApi,
  Event,
  EventRequest,
  EVENT_TYPE_ICONS,
  EVENT_TYPE_LABELS,
} from "../lib/api";
import { colors } from "../lib/colors";

type TabType = "events" | "pending" | "participations";

export const MyEventsScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [myRequests, setMyRequests] = useState<EventRequest[]>([]);
  const [pendingRequestsForMyEvents, setPendingRequestsForMyEvents] = useState<
    { event: Event; requests: EventRequest[] }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [actionLoading, setActionLoading] = useState(false);

  // ID Viewer modal state
  const [showIdViewer, setShowIdViewer] = useState(false);
  const [viewingIdUser, setViewingIdUser] = useState<{
    id: string;
    name: string;
    requestId: string;
  } | null>(null);

  // Alert modal
  const { alertState, showAlert, hideAlert } = useAlert();

  const openIdViewer = (
    userId: string,
    userName: string,
    requestId: string,
  ) => {
    setViewingIdUser({ id: userId, name: userName, requestId });
    setShowIdViewer(true);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const [events, requests] = await Promise.all([
        eventsApi.getMyEvents(),
        requestsApi.getMyRequests(),
      ]);

      setMyEvents(events);
      setMyRequests(requests);

      // Load pending requests for each of my events
      const pendingData = await Promise.all(
        events.map(async (event) => {
          try {
            const eventRequests = await requestsApi.getEventRequests(event.id);
            const pending = eventRequests.filter((r) => r.status === "PENDING");
            return { event, requests: pending };
          } catch {
            return { event, requests: [] };
          }
        }),
      );

      setPendingRequestsForMyEvents(
        pendingData.filter((d) => d.requests.length > 0),
      );
    } catch (error) {
      console.error("Error loading events data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleAcceptFromModal = async (requestId: string) => {
    setActionLoading(true);
    try {
      await requestsApi.accept(requestId);
      setShowIdViewer(false);
      setViewingIdUser(null);
      loadData(true);
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
      loadData(true);
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

  const totalPendingCount = pendingRequestsForMyEvents.reduce(
    (acc, item) => acc + item.requests.length,
    0,
  );

  const confirmedParticipations = myRequests.filter(
    (r) => r.status === "ACCEPTED",
  );
  const pendingParticipations = myRequests.filter(
    (r) => r.status === "PENDING",
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("events.myEvents.title")}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
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
            {t("events.myEvents.tabs.events")}
          </Text>
          {myEvents.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "events" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "events" && styles.tabBadgeTextActive,
                ]}
              >
                {myEvents.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "pending" && styles.tabActive]}
          onPress={() => setActiveTab("pending")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "pending" && styles.tabTextActive,
            ]}
          >
            {t("events.myEvents.tabs.pending")}
          </Text>
          {totalPendingCount > 0 && (
            <View
              style={[
                styles.tabBadge,
                styles.tabBadgeUrgent,
                activeTab === "pending" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "pending" && styles.tabBadgeTextActive,
                ]}
              >
                {totalPendingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "participations" && styles.tabActive,
          ]}
          onPress={() => setActiveTab("participations")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "participations" && styles.tabTextActive,
            ]}
          >
            {t("events.myEvents.tabs.participations")}
          </Text>
          {confirmedParticipations.length > 0 && (
            <View
              style={[
                styles.tabBadge,
                activeTab === "participations" && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === "participations" && styles.tabBadgeTextActive,
                ]}
              >
                {confirmedParticipations.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.listSection}>
            {/* Mes événements */}
            {activeTab === "events" && (
              <>
                {myEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📅</Text>
                    <Text style={styles.emptyTitle}>
                      {t("events.myEvents.noEvents")}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {t("events.myEvents.noEventsSubtitle")}
                    </Text>
                    <TouchableOpacity
                      style={styles.createButton}
                      onPress={() => navigation.navigate("CreateEvent")}
                    >
                      <Text style={styles.createButtonText}>
                        {t("events.myEvents.createEvent")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  myEvents.map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      style={styles.eventCard}
                      onPress={() =>
                        navigation.navigate("EventDetail", {
                          eventId: event.id,
                        })
                      }
                    >
                      <View style={styles.eventCardHeader}>
                        <View style={styles.iconBadge}>
                          <Text style={styles.eventIcon}>
                            {EVENT_TYPE_ICONS[event.type]}
                          </Text>
                        </View>
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventType}>
                            {EVENT_TYPE_LABELS[event.type]}
                          </Text>
                          <Text style={styles.eventTitle} numberOfLines={1}>
                            {event.title}
                          </Text>
                        </View>
                        <View style={styles.participantsBadge}>
                          <Text style={styles.participantsBadgeText}>
                            {event.currentCount}/{event.maxParticipants}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.eventCardFooter}>
                        <Text style={styles.eventDate}>
                          📅 {formatDate(event.date)} • {formatTime(event.date)}
                          {event.endDate && ` - ${formatTime(event.endDate)}`}
                        </Text>
                        {(event._count?.requests || 0) > 0 && (
                          <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>
                              {event._count?.requests}{" "}
                              {t("events.myEvents.pending")}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}

            {/* Demandes à valider */}
            {activeTab === "pending" && (
              <>
                {pendingRequestsForMyEvents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>✅</Text>
                    <Text style={styles.emptyTitle}>
                      {t("events.myEvents.noPending")}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {t("events.myEvents.noPendingSubtitle")}
                    </Text>
                  </View>
                ) : (
                  pendingRequestsForMyEvents.map(({ event, requests }) => (
                    <View key={event.id} style={styles.pendingSection}>
                      <TouchableOpacity
                        style={styles.pendingEventHeader}
                        onPress={() =>
                          navigation.navigate("EventDetail", {
                            eventId: event.id,
                          })
                        }
                      >
                        <Text style={styles.pendingEventIcon}>
                          {EVENT_TYPE_ICONS[event.type]}
                        </Text>
                        <Text
                          style={styles.pendingEventTitle}
                          numberOfLines={1}
                        >
                          {event.title}
                        </Text>
                        <Text style={styles.pendingEventArrow}>›</Text>
                      </TouchableOpacity>

                      {requests.map((request) => (
                        <TouchableOpacity
                          key={request.id}
                          style={styles.requestCard}
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
                                {t("idViewer.tapToVerify")}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.requestArrow}>→</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))
                )}
              </>
            )}

            {/* Mes participations */}
            {activeTab === "participations" && (
              <>
                {myRequests.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>
                      {t("events.myEvents.noParticipations")}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {t("events.myEvents.noParticipationsSubtitle")}
                    </Text>
                  </View>
                ) : (
                  <>
                    {confirmedParticipations.length > 0 && (
                      <View style={styles.participationGroup}>
                        <Text style={styles.groupTitle}>
                          {t("events.myEvents.confirmed")}
                        </Text>
                        {confirmedParticipations.map((request) => (
                          <TouchableOpacity
                            key={request.id}
                            style={styles.participationCard}
                            onPress={() =>
                              navigation.navigate("EventDetail", {
                                eventId: request.eventId,
                              })
                            }
                          >
                            <View style={styles.participationIconBadge}>
                              <Text style={styles.participationIcon}>
                                {request.event
                                  ? EVENT_TYPE_ICONS[request.event.type]
                                  : "📅"}
                              </Text>
                            </View>
                            <View style={styles.participationInfo}>
                              <Text
                                style={styles.participationTitle}
                                numberOfLines={1}
                              >
                                {request.event?.title || "Événement"}
                              </Text>
                              <Text style={styles.participationDate}>
                                {request.event
                                  ? `${formatDate(request.event.date)} • ${formatTime(request.event.date)}${request.event.endDate ? ` - ${formatTime(request.event.endDate)}` : ""}`
                                  : "Date inconnue"}
                              </Text>
                            </View>
                            <Text style={styles.participationArrow}>›</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {pendingParticipations.length > 0 && (
                      <View style={styles.participationGroup}>
                        <Text style={styles.groupTitle}>
                          {t("events.myEvents.waiting")}
                        </Text>
                        {pendingParticipations.map((request) => (
                          <TouchableOpacity
                            key={request.id}
                            style={[
                              styles.participationCard,
                              styles.participationCardPending,
                            ]}
                            onPress={() =>
                              navigation.navigate("EventDetail", {
                                eventId: request.eventId,
                              })
                            }
                          >
                            <View
                              style={[
                                styles.participationIconBadge,
                                styles.participationIconBadgePending,
                              ]}
                            >
                              <Text style={styles.participationIcon}>
                                {request.event
                                  ? EVENT_TYPE_ICONS[request.event.type]
                                  : "📅"}
                              </Text>
                            </View>
                            <View style={styles.participationInfo}>
                              <Text
                                style={styles.participationTitle}
                                numberOfLines={1}
                              >
                                {request.event?.title || "Événement"}
                              </Text>
                              <Text style={styles.participationDate}>
                                {request.event
                                  ? `${formatDate(request.event.date)} • ${formatTime(request.event.date)}${request.event.endDate ? ` - ${formatTime(request.event.endDate)}` : ""}`
                                  : t("events.myEvents.unknownDate")}
                              </Text>
                            </View>
                            <Text style={styles.participationArrow}>›</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>

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

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  addBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    gap: 4,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    flexShrink: 1,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  tabBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  tabBadgeUrgent: {
    backgroundColor: "#FEE2E2",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  listSection: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBadge: {
    width: 48,
    height: 48,
    backgroundColor: "#F0F0FF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  eventIcon: {
    fontSize: 22,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  participantsBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  participantsBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  eventCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  eventDate: {
    fontSize: 13,
    color: "#6B7280",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  pendingSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pendingEventHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pendingEventIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  pendingEventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  pendingEventArrow: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  requestAvatar: {
    width: 44,
    height: 44,
    backgroundColor: "#E0E7FF",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  requestAvatarText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  viewIdHint: {
    flexDirection: "row",
    alignItems: "center",
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
  participationGroup: {
    marginBottom: 20,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  participationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  participationCardPending: {
    backgroundColor: "#FFFBEB",
  },
  participationIconBadge: {
    width: 44,
    height: 44,
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  participationIconBadgePending: {
    backgroundColor: "#FEF3C7",
  },
  participationIcon: {
    fontSize: 20,
  },
  participationInfo: {
    flex: 1,
  },
  participationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  participationDate: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  participationArrow: {
    fontSize: 20,
    color: "#9CA3AF",
  },
});
