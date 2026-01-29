import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { adminApi, AdminUser } from "../lib/api";
import { colors } from "../lib/colors";
import { useAlert } from "../components";
import { useAuth } from "../context/AuthContext";
import { Shield, Check, X, Clock, FileText, ScrollText, Camera, RefreshCw } from "lucide-react-native";

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "AdminDashboard"
>;

export const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { showAlert } = useAlert();
  const { isSuperAdmin, user } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<"id" | "ketouba" | "selfie" | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "id" | "ketouba" | "selfie">("all");

  useEffect(() => {
    // Only load if user is SUPER_ADMIN
    if (isSuperAdmin) {
      loadUsers();
    } else {
      setLoading(false);
      // Redirect to Profile if not admin
      navigation.navigate("Profile");
    }
  }, [filter, isSuperAdmin]);

  // Don't render if not admin
  if (!isSuperAdmin) {
    return null;
  }

  const loadUsers = async () => {
    try {
      const type = filter === "all" ? undefined : filter;
      const result = await adminApi.getPendingDocuments(type);
      setUsers(result.users);
    } catch (error: any) {
      console.error("Error loading admin documents:", error);
      // If 403, user is not admin - redirect to profile
      if (error.message?.includes("403") || error.message?.includes("Forbidden")) {
        console.log("User is not SUPER_ADMIN, redirecting to Profile");
        navigation.navigate("Profile");
        return;
      }
      showAlert(t("common.error"), error.message || t("admin.loadError"), undefined, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const loadDocument = async (user: AdminUser, docType: "id" | "ketouba" | "selfie") => {
    setSelectedUser(user);
    setSelectedDocType(docType);
    setDocumentUrl(null);
    setLoadingDocument(true);

    try {
      const result = await adminApi.getDocumentUrl(user.id, docType);
      setDocumentUrl(result.url);
    } catch (error: any) {
      showAlert(t("common.error"), error.message || t("admin.documentLoadError"), undefined, "error");
    } finally {
      setLoadingDocument(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedUser || !selectedDocType) return;

    setProcessing(true);
    try {
      await adminApi.verifyDocument(selectedUser.id, selectedDocType, "approve");
      showAlert(t("common.success"), t("admin.documentApproved"), undefined, "success");
      setSelectedUser(null);
      setSelectedDocType(null);
      setDocumentUrl(null);
      loadUsers();
    } catch (error: any) {
      showAlert(t("common.error"), error.message || t("admin.approveError"), undefined, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser || !selectedDocType || !rejectionReason.trim()) {
      showAlert(t("common.error"), t("admin.rejectionReasonRequired"), undefined, "error");
      return;
    }

    setProcessing(true);
    try {
      await adminApi.verifyDocument(selectedUser.id, selectedDocType, "reject", rejectionReason);
      showAlert(t("common.success"), t("admin.documentRejected"), undefined, "success");
      setSelectedUser(null);
      setSelectedDocType(null);
      setDocumentUrl(null);
      setShowRejectModal(false);
      setRejectionReason("");
      loadUsers();
    } catch (error: any) {
      showAlert(t("common.error"), error.message || t("admin.rejectError"), undefined, "error");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: "PENDING" | "APPROVED" | "REJECTED") => {
    switch (status) {
      case "APPROVED":
        return { icon: Check, color: colors.success, text: t("admin.approved") };
      case "REJECTED":
        return { icon: X, color: colors.error, text: t("admin.rejected") };
      default:
        return { icon: Clock, color: colors.warning, text: t("admin.pending") };
    }
  };

  const getDocumentIcon = (type: "id" | "ketouba" | "selfie") => {
    switch (type) {
      case "id":
        return FileText;
      case "ketouba":
        return ScrollText;
      case "selfie":
        return Camera;
    }
  };

  const getPendingCount = (type: "id" | "ketouba" | "selfie") => {
    return users.filter((u) => {
      if (type === "id") return u.idVerificationStatus === "PENDING" && u.idDocumentUrl;
      if (type === "ketouba") return u.ketoubaVerificationStatus === "PENDING" && u.ketoubaDocumentUrl;
      return u.selfieVerificationStatus === "PENDING" && u.selfieDocumentUrl;
    }).length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t("admin.title")}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text>{t("common.loading")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Shield size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>{t("admin.title")}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <RefreshCw size={20} color={colors.primary} style={{ opacity: refreshing ? 0.5 : 1 }} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <TouchableOpacity
          style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.filterText, filter === "all" && styles.filterTextActive]}>
            {t("admin.all")} ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "id" && styles.filterChipActive]}
          onPress={() => setFilter("id")}
        >
          <Text style={[styles.filterText, filter === "id" && styles.filterTextActive]}>
            {t("admin.id")} ({getPendingCount("id")})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "ketouba" && styles.filterChipActive]}
          onPress={() => setFilter("ketouba")}
        >
          <Text style={[styles.filterText, filter === "ketouba" && styles.filterTextActive]}>
            {t("admin.ketouba")} ({getPendingCount("ketouba")})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, filter === "selfie" && styles.filterChipActive]}
          onPress={() => setFilter("selfie")}
        >
          <Text style={[styles.filterText, filter === "selfie" && styles.filterTextActive]}>
            {t("admin.selfie")} ({getPendingCount("selfie")})
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Users List */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Shield size={48} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>{t("admin.noPendingDocuments")}</Text>
          </View>
        ) : (
          users.map((user) => {
            const displayName = user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.name || user.email;

            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phoneNumber && (
                      <Text style={styles.userPhone}>{user.phoneNumber}</Text>
                    )}
                  </View>
                </View>

                <View style={styles.documentsContainer}>
                  {/* ID Document */}
                  {user.idDocumentUrl && (
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => loadDocument(user, "id")}
                    >
                      <FileText size={20} color={colors.primary} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentLabel}>{t("admin.idDocument")}</Text>
                        {(() => {
                          const badge = getStatusBadge(user.idVerificationStatus);
                          const Icon = badge.icon;
                          return (
                            <View style={[styles.statusBadge, { backgroundColor: badge.color + "20" }]}>
                              <Icon size={12} color={badge.color} />
                              <Text style={[styles.statusText, { color: badge.color }]}>
                                {badge.text}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Ketouba Document */}
                  {user.ketoubaDocumentUrl && (
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => loadDocument(user, "ketouba")}
                    >
                      <ScrollText size={20} color={colors.primary} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentLabel}>{t("admin.ketoubaDocument")}</Text>
                        {(() => {
                          const badge = getStatusBadge(user.ketoubaVerificationStatus);
                          const Icon = badge.icon;
                          return (
                            <View style={[styles.statusBadge, { backgroundColor: badge.color + "20" }]}>
                              <Icon size={12} color={badge.color} />
                              <Text style={[styles.statusText, { color: badge.color }]}>
                                {badge.text}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Selfie Document */}
                  {user.selfieDocumentUrl && (
                    <TouchableOpacity
                      style={styles.documentButton}
                      onPress={() => loadDocument(user, "selfie")}
                    >
                      <Camera size={20} color={colors.primary} />
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentLabel}>{t("admin.selfieDocument")}</Text>
                        {(() => {
                          const badge = getStatusBadge(user.selfieVerificationStatus);
                          const Icon = badge.icon;
                          return (
                            <View style={[styles.statusBadge, { backgroundColor: badge.color + "20" }]}>
                              <Icon size={12} color={badge.color} />
                              <Text style={[styles.statusText, { color: badge.color }]}>
                                {badge.text}
                              </Text>
                            </View>
                          );
                        })()}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Document Viewer Modal */}
      <Modal
        visible={selectedUser !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setSelectedUser(null);
          setSelectedDocType(null);
          setDocumentUrl(null);
          setShowRejectModal(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedUser && selectedDocType
                ? t(`admin.${selectedDocType}Document`)
                : t("admin.document")}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedUser(null);
                setSelectedDocType(null);
                setDocumentUrl(null);
                setShowRejectModal(false);
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {loadingDocument ? (
            <View style={styles.modalLoading}>
              <Text>{t("common.loading")}</Text>
            </View>
          ) : documentUrl ? (
            <>
              <ScrollView style={styles.modalImageContainer}>
                <Image source={{ uri: documentUrl }} style={styles.modalImage} resizeMode="contain" />
              </ScrollView>

              {selectedUser && selectedDocType && (
                (() => {
                  const status =
                    selectedDocType === "id"
                      ? selectedUser.idVerificationStatus
                      : selectedDocType === "ketouba"
                      ? selectedUser.ketoubaVerificationStatus
                      : selectedUser.selfieVerificationStatus;

                  if (status === "PENDING") {
                    return (
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => setShowRejectModal(true)}
                          disabled={processing}
                        >
                          <X size={20} color={colors.error} />
                          <Text style={styles.rejectButtonText}>{t("admin.reject")}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={handleApprove}
                          disabled={processing}
                        >
                          <Check size={20} color={colors.success} />
                          <Text style={styles.approveButtonText}>{t("admin.approve")}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  return null;
                })()
              )}
            </>
          ) : (
            <View style={styles.modalLoading}>
              <Text>{t("admin.documentLoadError")}</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={styles.rejectModalContent}>
            <Text style={styles.rejectModalTitle}>{t("admin.rejectionReason")}</Text>
            <TextInput
              style={styles.rejectInput}
              placeholder={t("admin.rejectionReasonPlaceholder")}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={[styles.rejectModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
              >
                <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectModalButton, styles.confirmRejectButton]}
                onPress={handleReject}
                disabled={processing || !rejectionReason.trim()}
              >
                <Text style={styles.confirmRejectButtonText}>{t("admin.confirmReject")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },
  filtersContainer: {
    maxHeight: 60,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  filtersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.border.medium,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  filterTextActive: {
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 16,
    textAlign: "center",
  },
  userCard: {
    backgroundColor: colors.background.primary,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.inverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  documentsContainer: {
    gap: 12,
  },
  documentButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text.primary,
  },
  modalClose: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  modalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImageContainer: {
    flex: 1,
  },
  modalImage: {
    width: "100%",
    height: "100%",
    minHeight: 400,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: colors.error + "20",
    borderWidth: 1,
    borderColor: colors.error,
  },
  approveButton: {
    backgroundColor: colors.success + "20",
    borderWidth: 1,
    borderColor: colors.success,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.error,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.success,
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  rejectModalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: colors.border.medium,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    minHeight: 100,
    marginBottom: 20,
  },
  rejectModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  rejectModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.border.medium,
  },
  confirmRejectButton: {
    backgroundColor: colors.error,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  confirmRejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.inverse,
  },
});
