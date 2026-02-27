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
  SafeAreaView,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [viewedDocs, setViewedDocs] = useState<Set<DocumentTab>>(
    new Set(["id"])
  );

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

  const allDocumentsViewed = () => {
    const availableDocs: DocumentTab[] = [];
    if (documents?.idDocument) availableDocs.push("id");
    if (documents?.ketoubaDocument) availableDocs.push("ketouba");
    if (documents?.selfieDocument) availableDocs.push("selfie");
    return availableDocs.every((doc) => viewedDocs.has(doc));
  };

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
  const hasActions = requestId && onAccept && onReject && !loading && !error;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.safeArea}>
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

          {/* Scrollable Content — takes all available space */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {loading ? (
              <View style={styles.centeredPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>{t("idViewer.loading")}</Text>
              </View>
            ) : error ? (
              <View style={styles.centeredPlaceholder}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadDocuments}
                >
                  <Text style={styles.retryBtnText}>
                    {t("idViewer.retry")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : currentDoc ? (
              <Image
                source={{ uri: currentDoc.url }}
                style={styles.idImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.centeredPlaceholder}>
                <Text style={styles.noDocIcon}>📄</Text>
                <Text style={styles.noDocText}>
                  {t("idViewer.noDocument")}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom fixed section */}
          <View style={styles.bottomSection}>
            {/* Verification Status */}
            {!loading && !error && documents && requestId && (
              <View style={styles.verificationStatus}>
                <Text style={styles.verificationIcon}>
                  {allDocumentsViewed() ? "✅" : "⚠️"}
                </Text>
                <Text style={styles.verificationText}>
                  {allDocumentsViewed()
                    ? t("idViewer.allDocumentsViewed")
                    : t("idViewer.viewAllDocuments", {
                        count: getAvailableDocsCount(),
                      })}
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
            {hasActions && (
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
                  {actionLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.acceptButtonText}>
                      {t("idViewer.accept")}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 18,
    color: colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  tab: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    position: "relative",
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabDisabled: {
    backgroundColor: colors.background.tertiary,
    opacity: 0.5,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text.secondary,
    textAlign: "center",
  },
  tabLabelActive: {
    color: colors.primary,
  },
  tabLabelDisabled: {
    color: colors.text.tertiary,
  },
  viewedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
  },
  viewedBadgeText: {
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: "700",
  },
  unavailableBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  unavailableBadgeText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  centeredPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: colors.error,
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
    color: colors.text.inverse,
  },
  noDocIcon: {
    fontSize: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  noDocText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: "center",
  },
  idImage: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
  },
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
  },
  verificationStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.warningLight,
    gap: 8,
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
    backgroundColor: colors.successLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  securityIcon: {
    fontSize: 14,
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    color: colors.successDark,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    backgroundColor: colors.background.primary,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.errorLight,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.error,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptButtonWarning: {
    backgroundColor: colors.warning,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.inverse,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
