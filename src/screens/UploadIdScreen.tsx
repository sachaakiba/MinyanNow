import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useTranslation } from "react-i18next";
import { usersApi } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";
import { colors } from "../lib/colors";

export const UploadIdScreen: React.FC = () => {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
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
      await usersApi.uploadIdDocument(selectedImage);
      refreshSession();
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🪪</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t("idUpload.title")}</Text>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{t("idUpload.description")}</Text>

          <View style={styles.securityPoints}>
            <View style={styles.securityPoint}>
              <Text style={styles.securityIcon}>🔒</Text>
              <Text style={styles.securityText}>
                {t("idUpload.securityPoints.encrypted")}
              </Text>
            </View>
            <View style={styles.securityPoint}>
              <Text style={styles.securityIcon}>👁️</Text>
              <Text style={styles.securityText}>
                {t("idUpload.securityPoints.organizers")}
              </Text>
            </View>
            <View style={styles.securityPoint}>
              <Text style={styles.securityIcon}>🛡️</Text>
              <Text style={styles.securityText}>
                {t("idUpload.securityPoints.protection")}
              </Text>
            </View>
          </View>
        </View>

        {/* Image Preview or Upload Buttons */}
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.changeImageBtn}
              onPress={() => setSelectedImage(null)}
            >
              <Text style={styles.changeImageBtnText}>
                {t("idUpload.changePhoto")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadBtn} onPress={takePhoto}>
              <Text style={styles.uploadBtnIcon}>📷</Text>
              <Text style={styles.uploadBtnText}>
                {t("idUpload.takePhoto")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadBtn, styles.uploadBtnSecondary]}
              onPress={pickImage}
            >
              <Text style={styles.uploadBtnIcon}>🖼️</Text>
              <Text style={styles.uploadBtnTextSecondary}>
                {t("idUpload.gallery")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadBtn, styles.uploadBtnSecondary]}
              onPress={pickFromFiles}
            >
              <Text style={styles.uploadBtnIcon}>📁</Text>
              <Text style={styles.uploadBtnTextSecondary}>
                {t("idUpload.files")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submit Button */}
        {selectedImage && (
          <TouchableOpacity
            style={[styles.submitBtn, uploading && styles.submitBtnDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>{t("idUpload.submit")}</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Info */}
        <Text style={styles.infoText}>
          📄 {t("idUpload.acceptedDocuments")}
        </Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  securityPoints: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  securityPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  securityIcon: {
    fontSize: 18,
    marginTop: 2,
  },
  securityText: {
    flex: 1,
    fontSize: 14,
    color: "#166534",
    lineHeight: 20,
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  changeImageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeImageBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  uploadButtons: {
    gap: 12,
    marginBottom: 20,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  uploadBtnSecondary: {
    backgroundColor: "#F3F4F6",
  },
  uploadBtnIcon: {
    fontSize: 20,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  uploadBtnTextSecondary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  submitBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoText: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
});
