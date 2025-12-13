import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
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
import { colors } from "../lib/colors";

interface IDUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRequired?: boolean; // Si true, l'utilisateur ne peut pas fermer la modal sans uploader
}

export const IDUploadModal: React.FC<IDUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  isRequired = false,
}) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    setError(null);

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setError(t("idUpload.galleryPermissionDenied"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const takePhoto = async () => {
    setError(null);

    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setError(t("idUpload.cameraPermissionDenied"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
      }
    }
  };

  const pickFromFiles = async () => {
    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        const mimeType = asset.mimeType || "image/jpeg";
        setSelectedImage(`data:${mimeType};base64,${base64}`);
      }
    } catch (err: any) {
      setError(t("idUpload.fileSelectionError"));
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setUploading(true);
    setError(null);

    try {
      await usersApi.uploadIdDocument(selectedImage);
      onSuccess();
      setSelectedImage(null);
    } catch (err: any) {
      setError(err.message || t("idUpload.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (isRequired) return; // Ne peut pas fermer si obligatoire
    setSelectedImage(null);
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              {!isRequired && (
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🪪</Text>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t("idUpload.title")}</Text>

            {/* Description */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {t("idUpload.description")}
              </Text>

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
                  <Text style={styles.uploadBtnText}>
                    {t("idUpload.takePhoto")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                  onPress={pickImage}
                >
                  <Text style={styles.uploadBtnTextSecondary}>
                    {t("idUpload.gallery")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.uploadBtn, styles.uploadBtnSecondary]}
                  onPress={pickFromFiles}
                >
                  <Text style={styles.uploadBtnTextSecondary}>
                    {t("idUpload.files")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            {selectedImage && (
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  uploading && styles.submitBtnDisabled,
                ]}
                onPress={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {t("idUpload.submit")}
                  </Text>
                )}
              </TouchableOpacity>
            )}

            {/* Info */}
            <Text style={styles.infoText}>
              📄 {t("idUpload.acceptedDocuments")}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
  },
  uploadBtnSecondary: {
    backgroundColor: "#F3F4F6",
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
  errorContainer: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
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
