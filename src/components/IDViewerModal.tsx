import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";
import { usersApi, UserDocuments } from "../lib/api";
import { colors } from "../lib/colors";

interface IDViewerModalProps {
  visible: boolean;
  userId: string;
  userName: string;
  requestId?: string;
  onClose: () => void;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  actionLoading?: boolean;
}

type DocumentTab = "id" | "ketouba" | "selfie";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const IDViewerModal: React.FC<IDViewerModalProps> = ({
  visible,
  userId,
  userName,
  requestId,
  onClose,
  onAccept,
  onReject,
  actionLoading = false,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UserDocuments | null>(null);
  const [activeTab, setActiveTab] = useState<DocumentTab>("id");
  const [viewedDocs, setViewedDocs] = useState<Set<DocumentTab>>(new Set(["id"]));

  useEffect(() => {
    if (visible && userId) {
      loadDocuments();
      setActiveTab("id");
      setViewedDocs(new Set(["id"]));
    }
  }, [visible, userId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersApi.getUserDocuments(userId);
      setDocuments(result);
    } catch (err: any) {
      setError(err.message || t("idViewer.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: DocumentTab) => {
    setActiveTab(tab);
    setViewedDocs((prev) => new Set([...prev, tab]));
  };

  const handleClose = () => {
    setDocuments(null);
    setError(null);
    onClose();
  };

  // Check if all available documents have been viewed
  const allDocumentsViewed = () => {
    const availableDocs: DocumentTab[] = [];
    if (documents?.idDocument) availableDocs.push("id");
    if (documents?.ketoubaDocument) availableDocs.push("ketouba");
    if (documents?.selfieDocument) availableDocs.push("selfie");
    return availableDocs.every((doc) => viewedDocs.has(doc));
  };

  // Count available documents
  const getAvailableDocsCount = () => {
    let count = 0;
    if (documents?.idDocument) count++;
    if (documents?.ketoubaDocument) count++;
    if (documents?.selfieDocument) count++;
    return count;
  };

  const getCurrentDocument = () => {
    if (!documents) return null;
    switch (activeTab) {
      case "id":
        return documents.idDocument;
      case "ketouba":
        return documents.ketoubaDocument;
      case "selfie":
        return documents.selfieDocument;
      default:
        return null;
    }
  };

  const getTabLabel = (tab: DocumentTab) => {
    switch (tab) {
      case "id":
        return t("idViewer.tabs.id");
      case "ketouba":
        return t("idViewer.tabs.ketouba");
      case "selfie":
        return t("idViewer.tabs.selfie");
    }
  };

  const getTabIcon = (tab: DocumentTab) => {
    switch (tab) {
      case "id":
        return "🪪";
      case "ketouba":
        return "💒";
      case "selfie":
        return "🤳";
    }
  };

  const isTabAvailable = (tab: DocumentTab) => {
    if (!documents) return false;
    switch (tab) {
      case "id":
        return !!documents.idDocument;
      case "ketouba":
        return !!documents.ketoubaDocument;
      case "selfie":
        return !!documents.selfieDocument;
    }
  };

  const currentDoc = getCurrentDocument();
  const availableTabs: DocumentTab[] = ["id", "ketouba", "selfie"];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{t("idViewer.title")}</Text>
              <Text style={styles.headerSubtitle}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          {!loading && !error && documents && (
            <View style={styles.tabsContainer}>
              {availableTabs.map((tab) => {
                const available = isTabAvailable(tab);
                const isActive = activeTab === tab;
                const isViewed = viewedDocs.has(tab);
                
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      isActive && styles.tabActive,
                      !available && styles.tabDisabled,
                    ]}
                    onPress={() => available && handleTabChange(tab)}
                    disabled={!available}
                  >
                    <Text style={styles.tabIcon}>{getTabIcon(tab)}</Text>
                    <Text
                      style={[
                        styles.tabLabel,
                        isActive && styles.tabLabelActive,
                        !available && styles.tabLabelDisabled,
                      ]}
                    >
                      {getTabLabel(tab)}
                    </Text>
                    {available && isViewed && (
                      <View style={styles.viewedBadge}>
                        <Text style={styles.viewedBadgeText}>✓</Text>
                      </View>
                    )}
                    {!available && (
                      <View style={styles.unavailableBadge}>
                        <Text style={styles.unavailableBadgeText}>-</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Content */}
          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t("idViewer.loading")}</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadDocuments}
                >
                  <Text style={styles.retryBtnText}>{t("idViewer.retry")}</Text>
                </TouchableOpacity>
              </View>
            ) : currentDoc ? (
              <Image
                source={{ uri: currentDoc.url }}
                style={styles.idImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noDocContainer}>
                <Text style={styles.noDocIcon}>📄</Text>
                <Text style={styles.noDocText}>{t("idViewer.noDocument")}</Text>
              </View>
            )}
          </ScrollView>

          {/* Verification Status */}
          {!loading && !error && documents && requestId && (
            <View style={styles.verificationStatus}>
              <Text style={styles.verificationIcon}>
                {allDocumentsViewed() ? "✅" : "⚠️"}
              </Text>
              <Text style={styles.verificationText}>
                {allDocumentsViewed()
                  ? t("idViewer.allDocumentsViewed")
                  : t("idViewer.viewAllDocuments", { count: getAvailableDocsCount() })}
              </Text>
            </View>
          )}

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              {t("idViewer.securityNotice")}
            </Text>
          </View>

          {/* Action Buttons */}
          {requestId && onAccept && onReject && !loading && !error && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  actionLoading && styles.buttonDisabled,
                ]}
                onPress={() => onReject(requestId)}
                disabled={actionLoading}
              >
                <Text style={styles.rejectButtonText}>
                  {t("idViewer.reject")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  actionLoading && styles.buttonDisabled,
                  !allDocumentsViewed() && styles.acceptButtonWarning,
                ]}
                onPress={() => onAccept(requestId)}
                disabled={actionLoading}
              >
                <Text style={styles.acceptButtonText}>
                  {actionLoading ? "..." : t("idViewer.accept")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#6B7280",
  },
  tabsContainer: {
    flexDirection: "row",
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    position: "relative",
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabDisabled: {
    backgroundColor: "#F3F4F6",
    opacity: 0.5,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabLabelDisabled: {
    color: "#9CA3AF",
  },
  viewedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  viewedBadgeText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  unavailableBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableBadgeText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "700",
  },
  content: {
    flex: 1,
    minHeight: 250,
    maxHeight: 350,
  },
  contentContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 250,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 250,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  noDocContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 250,
  },
  noDocIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noDocText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  idImage: {
    width: "100%",
    height: SCREEN_WIDTH * 0.7,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFFBEB",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  verificationIcon: {
    fontSize: 16,
  },
  verificationText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
    fontWeight: "500",
  },
  securityNotice: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  securityIcon: {
    fontSize: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#166534",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#FEE2E2",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC2626",
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  acceptButtonWarning: {
    backgroundColor: "#F59E0B",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
