import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as WebBrowser from "expo-web-browser";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";
import { usersApi } from "../lib/api";
import { colors } from "../lib/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type DocumentType = "id" | "ketouba" | "selfie";

type UpdateIdDocumentScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UpdateIdDocument"
>;

type UpdateIdDocumentScreenRouteProp = RouteProp<
  RootStackParamList,
  "UpdateIdDocument"
>;

interface UpdateIdDocumentScreenProps {
  navigation: UpdateIdDocumentScreenNavigationProp;
  route: UpdateIdDocumentScreenRouteProp;
}

export const UpdateIdDocumentScreen: React.FC<UpdateIdDocumentScreenProps> = ({
  navigation,
  route,
}) => {
  const { t, i18n } = useTranslation();
  const { user, refreshSession } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  const documentType: DocumentType = route.params?.documentType || "id";

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentDocUrl, setCurrentDocUrl] = useState<string | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false); // Track if image failed to load (probably a PDF)

  const getDocumentInfo = () => {
    switch (documentType) {
      case "id":
        return {
          icon: "🪪",
          title: t("profile.idDocument"),
          currentUrl: user?.idDocumentUrl,
          uploadedAt: user?.idUploadedAt,
        };
      case "ketouba":
        return {
          icon: "💒",
          title: t("profile.ketoubaDocument"),
          currentUrl: user?.ketoubaDocumentUrl,
          uploadedAt: user?.ketoubaUploadedAt,
        };
      case "selfie":
        return {
          icon: "🤳",
          title: t("profile.selfieDocument"),
          currentUrl: user?.selfieDocumentUrl,
          uploadedAt: user?.selfieUploadedAt,
        };
    }
  };

  const docInfo = getDocumentInfo();

  useEffect(() => {
    // Reset image error state when document changes
    setImageLoadError(false);
    if (docInfo.currentUrl && user?.id) {
      loadCurrentDocument();
    }
  }, [docInfo.currentUrl, user?.id]);

  // Helper to check if URL or data URI is a PDF
  const isPDF = (url: string | null): boolean => {
    if (!url) return false;

    // Log pour debug
    console.log("🔍 Checking if PDF:", url);

    // Check data URI
    if (url.includes("application/pdf")) {
      console.log("✅ Detected PDF from data URI");
      return true;
    }

    // Check file extension
    if (url.toLowerCase().includes(".pdf")) {
      console.log("✅ Detected PDF from .pdf extension");
      return true;
    }

    // Check Cloudinary URLs with /raw/ (new PDFs uploaded correctly)
    if (url.includes("cloudinary.com") && url.includes("/raw/")) {
      console.log("✅ Detected PDF from Cloudinary /raw/ path");
      return true;
    }

    // For old documents: if image failed to load and it's in a document folder, assume it's a PDF
    if (
      imageLoadError &&
      url.includes("cloudinary.com") &&
      (url.includes("id-documents") ||
        url.includes("ketouba-documents") ||
        url.includes("selfie-documents"))
    ) {
      console.log("✅ Detected PDF from image load error in document folder");
      return true;
    }

    console.log("❌ Not detected as PDF");
    return false;
  };

  // Open PDF in browser
  const openPDF = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showAlert(
        t("common.error"),
        t("updateId.pdfOpenError") || "Could not open PDF",
        undefined,
        "error",
      );
    }
  };

  const loadCurrentDocument = async () => {
    if (!user?.id) return;
    setLoadingCurrent(true);
    try {
      const result = await usersApi.getUserDocuments(user.id);
      switch (documentType) {
        case "id":
          setCurrentDocUrl(result.idDocument?.url || null);
          break;
        case "ketouba":
          setCurrentDocUrl(result.ketoubaDocument?.url || null);
          break;
        case "selfie":
          setCurrentDocUrl(result.selfieDocument?.url || null);
          break;
      }
    } catch (error) {
      console.error("Error loading current document:", error);
    } finally {
      setLoadingCurrent(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        t("updateId.permissionDenied"),
        t("updateId.cameraPermission"),
        undefined,
        "warning",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: documentType === "selfie" ? [1, 1] : [4, 3],
      quality: 0.8,
      base64: true,
      cameraType:
        documentType === "selfie"
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back,
    });

    if (!result.canceled && result.assets[0].base64) {
      const mimeType = result.assets[0].mimeType || "image/jpeg";
      setSelectedImage(`data:${mimeType};base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        t("updateId.permissionDenied"),
        t("updateId.galleryPermission"),
        undefined,
        "warning",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: documentType === "selfie" ? [1, 1] : [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const mimeType = result.assets[0].mimeType || "image/jpeg";
      setSelectedImage(`data:${mimeType};base64,${result.assets[0].base64}`);
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "image/*",
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/heic",
          "image/heif",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        const mimeType = asset.mimeType || "image/jpeg";
        setSelectedImage(`data:${mimeType};base64,${base64}`);
        setSelectedFileName(asset.name || null);
      }
    } catch (error) {
      showAlert(t("common.error"), t("updateId.fileError"), undefined, "error");
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      showAlert(
        t("updateId.imageRequired"),
        t("updateId.imageRequiredMessage"),
        undefined,
        "warning",
      );
      return;
    }

    setUploading(true);
    try {
      switch (documentType) {
        case "id":
          await usersApi.uploadIdDocument(selectedImage);
          break;
        case "ketouba":
          await usersApi.uploadKetoubaDocument(selectedImage);
          break;
        case "selfie":
          await usersApi.uploadSelfieDocument(selectedImage);
          break;
      }

      // Navigate back to profile
      navigation.goBack();

      // Refresh session and show success after navigation
      setTimeout(() => {
        refreshSession();
        showAlert(
          t("updateId.success"),
          t("updateId.successMessage"),
          undefined,
          "success",
        );
      }, 200);
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("updateId.uploadError"),
        undefined,
        "error",
      );
    } finally {
      setUploading(false);
    }
  };

  const hasCurrentDoc = !!docInfo.currentUrl;

  const formatDate = (dateString: string) => {
    const locale =
      i18n.language === "he"
        ? "he-IL"
        : i18n.language === "en"
          ? "en-US"
          : "fr-FR";
    return new Date(dateString).toLocaleDateString(locale);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{docInfo.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Document (if exists) */}
        {hasCurrentDoc && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {documentType === "id"
                ? t("updateId.currentId")
                : documentType === "ketouba"
                  ? t("updateId.currentKetouba")
                  : t("updateId.currentSelfie")}
            </Text>
            <View style={styles.currentIdCard}>
              {loadingCurrent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>
                    {t("updateId.loading")}
                  </Text>
                </View>
              ) : currentDocUrl ? (
                <>
                  {isPDF(currentDocUrl) ? (
                    <View style={styles.pdfViewerContainer}>
                      <WebView
                        source={{
                          uri: `https://docs.google.com/viewer?url=${encodeURIComponent(currentDocUrl)}&embedded=true`,
                        }}
                        style={styles.pdfWebView}
                        startInLoadingState
                        renderLoading={() => (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator
                              size="large"
                              color={colors.primary}
                            />
                            <Text style={styles.loadingText}>
                              {t("updateId.loadingPDF")}
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: currentDocUrl }}
                      style={[
                        styles.currentIdImage,
                        documentType === "selfie" && styles.selfieImage,
                      ]}
                      resizeMode="contain"
                      onError={(error) => {
                        console.log(
                          "❌ Image load error:",
                          error.nativeEvent.error,
                        );
                        // If image fails to load in a document folder, it's probably a PDF
                        setImageLoadError(true);
                      }}
                    />
                  )}
                </>
              ) : (
                <View style={styles.noPreview}>
                  <Text style={styles.noPreviewIcon}>{docInfo.icon}</Text>
                  <Text style={styles.noPreviewText}>
                    {t("updateId.idSaved")}
                  </Text>
                </View>
              )}
              {docInfo.uploadedAt && (
                <Text style={styles.uploadDate}>
                  {t("updateId.updatedOn")} {formatDate(docInfo.uploadedAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* New Document Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {hasCurrentDoc ? t("updateId.updateTitle") : t("updateId.addTitle")}
          </Text>

          {selectedImage ? (
            <View style={styles.previewCard}>
              {isPDF(selectedImage) ? (
                <View style={styles.pdfPreviewNew}>
                  <Text style={styles.pdfIcon}>📄</Text>
                  <Text style={styles.pdfFileName}>
                    {selectedFileName || "document.pdf"}
                  </Text>
                  <Text style={styles.pdfReady}>
                    {t("updateId.pdfReady") || "PDF ready to upload"}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: selectedImage }}
                  style={[
                    styles.previewImage,
                    documentType === "selfie" && styles.selfieImage,
                  ]}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedFileName(null);
                }}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Text style={styles.uploadBtnIcon}>📷</Text>
                <Text style={styles.uploadBtnText}>
                  {documentType === "selfie"
                    ? t("documents.takeSelfie")
                    : t("updateId.takePhoto")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                onPress={pickImage}
              >
                <Text style={styles.uploadBtnIcon}>🖼️</Text>
                <Text style={styles.uploadBtnTextSecondary}>
                  {t("updateId.gallery")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                onPress={pickFromFiles}
              >
                <Text style={styles.uploadBtnIcon}>📁</Text>
                <Text style={styles.uploadBtnTextSecondary}>
                  {t("updateId.files")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("updateId.securityTitle")}</Text>
            <Text style={styles.infoText}>{t("updateId.securityText")}</Text>
          </View>
        </View>

        {/* Upload Button */}
        {selectedImage && (
          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>
                {hasCurrentDoc ? t("updateId.update") : t("updateId.save")}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

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
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 20,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  currentIdCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  currentIdImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  noPreview: {
    padding: 40,
    alignItems: "center",
    gap: 8,
  },
  noPreviewIcon: {
    fontSize: 48,
  },
  noPreviewText: {
    fontSize: 14,
    color: "#6B7280",
  },
  pdfViewerContainer: {
    width: "100%",
  },
  pdfWebView: {
    width: "100%",
    height: 400,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
  },
  pdfContainer: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 20,
  },
  pdfLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  pdfOpenButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  pdfOpenButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pdfPreview: {
    padding: 40,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
  },
  pdfIcon: {
    fontSize: 48,
  },
  pdfText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  pdfHint: {
    fontSize: 13,
    color: "#6B7280",
  },
  pdfPreviewNew: {
    padding: 40,
    alignItems: "center",
    gap: 12,
    width: "100%",
  },
  pdfFileName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
  },
  pdfReady: {
    fontSize: 13,
    color: "#10B981",
  },
  uploadDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 12,
  },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    position: "relative",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: "#EF4444",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  removeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  uploadOptions: {
    gap: 12,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  uploadBtnSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  uploadBtnIcon: {
    fontSize: 20,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadBtnTextSecondary: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: colors.primary,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  submitBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
