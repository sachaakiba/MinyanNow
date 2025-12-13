import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";
import { usersApi } from "../lib/api";
import { colors } from "../lib/colors";

type UpdateIdDocumentScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "UpdateIdDocument"
>;

interface UpdateIdDocumentScreenProps {
  navigation: UpdateIdDocumentScreenNavigationProp;
}

export const UpdateIdDocumentScreen: React.FC<UpdateIdDocumentScreenProps> = ({
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const { user, refreshSession } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentIdUrl, setCurrentIdUrl] = useState<string | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  useEffect(() => {
    if (user?.idDocumentUrl) {
      loadCurrentId();
    }
  }, [user?.idDocumentUrl]);

  const loadCurrentId = async () => {
    if (!user?.id) return;
    setLoadingCurrent(true);
    try {
      const result = await usersApi.getIdDocument(user.id);
      setCurrentIdUrl(result.url);
    } catch (error) {
      console.error("Error loading current ID:", error);
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
        "warning"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
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
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickFromFiles = async () => {
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
        setSelectedImage(`data:${mimeType};base64,${base64}`);
      }
    } catch (error) {
      showAlert(
        t("common.error"),
        t("updateId.fileError"),
        undefined,
        "error"
      );
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      showAlert(
        t("updateId.imageRequired"),
        t("updateId.imageRequiredMessage"),
        undefined,
        "warning"
      );
      return;
    }

    setUploading(true);
    try {
      await usersApi.uploadIdDocument(selectedImage);
      refreshSession();
      showAlert(
        t("updateId.success"),
        t("updateId.successMessage"),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }],
        "success"
      );
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("updateId.uploadError"),
        undefined,
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  const hasCurrentId = !!user?.idDocumentUrl;

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
        <Text style={styles.headerTitle}>{t("updateId.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current ID (if exists) */}
        {hasCurrentId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("updateId.currentId")}</Text>
            <View style={styles.currentIdCard}>
              {loadingCurrent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>{t("updateId.loading")}</Text>
                </View>
              ) : currentIdUrl ? (
                <Image
                  source={{ uri: currentIdUrl }}
                  style={styles.currentIdImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noPreview}>
                  <Text style={styles.noPreviewIcon}>🪪</Text>
                  <Text style={styles.noPreviewText}>
                    {t("updateId.idSaved")}
                  </Text>
                </View>
              )}
              {user?.idUploadedAt && (
                <Text style={styles.uploadDate}>
                  {t("updateId.updatedOn")} {formatDate(user.idUploadedAt)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* New ID Upload */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {hasCurrentId ? t("updateId.updateTitle") : t("updateId.addTitle")}
          </Text>

          {selectedImage ? (
            <View style={styles.previewCard}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadOptions}>
              <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
                <Text style={styles.uploadBtnIcon}>📷</Text>
                <Text style={styles.uploadBtnText}>{t("updateId.takePhoto")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                onPress={pickImage}
              >
                <Text style={styles.uploadBtnIcon}>🖼️</Text>
                <Text style={styles.uploadBtnTextSecondary}>{t("updateId.gallery")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                onPress={pickFromFiles}
              >
                <Text style={styles.uploadBtnIcon}>📁</Text>
                <Text style={styles.uploadBtnTextSecondary}>{t("updateId.files")}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t("updateId.securityTitle")}</Text>
            <Text style={styles.infoText}>
              {t("updateId.securityText")}
            </Text>
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
                {hasCurrentId ? t("updateId.update") : t("updateId.save")}
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
