import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTranslation } from "react-i18next";
import { usersApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";
import { colors } from "../lib/colors";

type DocumentType = "id" | "ketouba" | "selfie";

interface DocumentState {
  image: string | null;
  uploading: boolean;
  uploaded: boolean;
}

export const UploadDocumentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshSession } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  const [documents, setDocuments] = useState<Record<DocumentType, DocumentState>>({
    id: { image: null, uploading: false, uploaded: !!user?.idDocumentUrl },
    ketouba: { image: null, uploading: false, uploaded: !!user?.ketoubaDocumentUrl },
    selfie: { image: null, uploading: false, uploaded: !!user?.selfieDocumentUrl },
  });

  const [activeDocType, setActiveDocType] = useState<DocumentType | null>(null);
  const [showPickerModal, setShowPickerModal] = useState(false);

  const getDocumentInfo = (type: DocumentType) => {
    switch (type) {
      case "id":
        return {
          icon: "🪪",
          title: t("documents.types.id"),
          description: t("documents.descriptions.id"),
        };
      case "ketouba":
        return {
          icon: "💒",
          title: t("documents.types.ketouba"),
          description: t("documents.descriptions.ketouba"),
        };
      case "selfie":
        return {
          icon: "🤳",
          title: t("documents.types.selfie"),
          description: t("documents.descriptions.selfie"),
        };
    }
  };

  const allDocumentsUploaded =
    documents.id.uploaded && documents.ketouba.uploaded && documents.selfie.uploaded;

  const pickImage = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        t("updateId.permissionDenied"),
        t("updateId.galleryPermission"),
        undefined,
        "warning"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: type === "selfie" ? [1, 1] : [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          image: `data:image/jpeg;base64,${result.assets[0].base64}`,
        },
      }));
    }
    setShowPickerModal(false);
  };

  const takePhoto = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        t("updateId.permissionDenied"),
        t("updateId.cameraPermission"),
        undefined,
        "warning"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: type === "selfie" ? [1, 1] : [3, 4],
      quality: 0.8,
      base64: true,
      cameraType: type === "selfie" ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setDocuments((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          image: `data:image/jpeg;base64,${result.assets[0].base64}`,
        },
      }));
    }
    setShowPickerModal(false);
  };

  const pickFromFiles = async (type: DocumentType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        const mimeType = asset.mimeType || "image/jpeg";
        setDocuments((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            image: `data:${mimeType};base64,${base64}`,
          },
        }));
      }
    } catch (error) {
      showAlert(t("common.error"), t("updateId.fileError"), undefined, "error");
    }
    setShowPickerModal(false);
  };

  const uploadDocument = async (type: DocumentType) => {
    const doc = documents[type];
    if (!doc.image) return;

    setDocuments((prev) => ({
      ...prev,
      [type]: { ...prev[type], uploading: true },
    }));

    try {
      switch (type) {
        case "id":
          await usersApi.uploadIdDocument(doc.image);
          break;
        case "ketouba":
          await usersApi.uploadKetoubaDocument(doc.image);
          break;
        case "selfie":
          await usersApi.uploadSelfieDocument(doc.image);
          break;
      }

      setDocuments((prev) => ({
        ...prev,
        [type]: { image: null, uploading: false, uploaded: true },
      }));

      // Refresh session to get updated user data
      refreshSession();
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("updateId.uploadError"),
        undefined,
        "error"
      );
      setDocuments((prev) => ({
        ...prev,
        [type]: { ...prev[type], uploading: false },
      }));
    }
  };

  const openPicker = (type: DocumentType) => {
    setActiveDocType(type);
    setShowPickerModal(true);
  };

  const renderDocumentCard = (type: DocumentType) => {
    const doc = documents[type];
    const info = getDocumentInfo(type);

    return (
      <View key={type} style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View
            style={[
              styles.documentIconContainer,
              doc.uploaded && styles.documentIconContainerUploaded,
            ]}
          >
            <Text style={styles.documentIcon}>{info.icon}</Text>
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{info.title}</Text>
            <Text style={styles.documentDescription}>{info.description}</Text>
          </View>
          {doc.uploaded && (
            <View style={styles.uploadedBadge}>
              <Text style={styles.uploadedBadgeText}>✓</Text>
            </View>
          )}
        </View>

        {doc.image && (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: doc.image }}
              style={[
                styles.previewImage,
                type === "selfie" && styles.previewImageSelfie,
              ]}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.changeImageBtn}
              onPress={() =>
                setDocuments((prev) => ({
                  ...prev,
                  [type]: { ...prev[type], image: null },
                }))
              }
            >
              <Text style={styles.changeImageBtnText}>{t("documents.change")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {!doc.uploaded && !doc.image && (
          <TouchableOpacity
            style={styles.addDocumentBtn}
            onPress={() => openPicker(type)}
          >
            <Text style={styles.addDocumentBtnIcon}>+</Text>
            <Text style={styles.addDocumentBtnText}>{t("documents.add")}</Text>
          </TouchableOpacity>
        )}

        {doc.image && !doc.uploaded && (
          <TouchableOpacity
            style={[styles.uploadBtn, doc.uploading && styles.uploadBtnDisabled]}
            onPress={() => uploadDocument(type)}
            disabled={doc.uploading}
          >
            {doc.uploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.uploadBtnText}>{t("documents.upload")}</Text>
            )}
          </TouchableOpacity>
        )}

        {doc.uploaded && (
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => openPicker(type)}
          >
            <Text style={styles.updateBtnText}>{t("documents.update")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>📋</Text>
          <Text style={styles.headerTitle}>{t("documents.title")}</Text>
          <Text style={styles.headerSubtitle}>{t("documents.subtitle")}</Text>
        </View>

        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    ((documents.id.uploaded ? 1 : 0) +
                      (documents.ketouba.uploaded ? 1 : 0) +
                      (documents.selfie.uploaded ? 1 : 0)) *
                    33.33
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {(documents.id.uploaded ? 1 : 0) +
              (documents.ketouba.uploaded ? 1 : 0) +
              (documents.selfie.uploaded ? 1 : 0)}{" "}
            / 3 {t("documents.completed")}
          </Text>
        </View>

        {/* Document Cards */}
        {renderDocumentCard("id")}
        {renderDocumentCard("ketouba")}
        {renderDocumentCard("selfie")}

        {/* Security Info */}
        <View style={styles.securityInfo}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>{t("documents.securityInfo")}</Text>
        </View>

        {/* Completion Message */}
        {allDocumentsUploaded && (
          <View style={styles.completionMessage}>
            <Text style={styles.completionIcon}>🎉</Text>
            <Text style={styles.completionText}>{t("documents.allUploaded")}</Text>
          </View>
        )}
      </ScrollView>

      {/* Picker Modal */}
      <Modal
        visible={showPickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPickerModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {activeDocType && getDocumentInfo(activeDocType).title}
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => activeDocType && takePhoto(activeDocType)}
            >
              <Text style={styles.modalOptionIcon}>📷</Text>
              <Text style={styles.modalOptionText}>{t("documents.takePhoto")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => activeDocType && pickImage(activeDocType)}
            >
              <Text style={styles.modalOptionIcon}>🖼️</Text>
              <Text style={styles.modalOptionText}>{t("documents.gallery")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => activeDocType && pickFromFiles(activeDocType)}
            >
              <Text style={styles.modalOptionIcon}>📁</Text>
              <Text style={styles.modalOptionText}>{t("documents.files")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPickerModal(false)}
            >
              <Text style={styles.modalCancelText}>{t("common.cancel")}</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  documentCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentIconContainer: {
    width: 52,
    height: 52,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  documentIconContainerUploaded: {
    backgroundColor: "#DCFCE7",
  },
  documentIcon: {
    fontSize: 26,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  uploadedBadge: {
    width: 28,
    height: 28,
    backgroundColor: "#10B981",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  previewContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  previewImageSelfie: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  changeImageBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  addDocumentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    gap: 8,
  },
  addDocumentBtnIcon: {
    fontSize: 20,
    color: "#6B7280",
  },
  addDocumentBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  uploadBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  uploadBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  uploadBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  updateBtn: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 16,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  securityInfo: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  securityIcon: {
    fontSize: 18,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 20,
  },
  completionMessage: {
    flexDirection: "row",
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  completionIcon: {
    fontSize: 24,
  },
  completionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  modalOptionIcon: {
    fontSize: 22,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  modalCancel: {
    alignItems: "center",
    padding: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
});
