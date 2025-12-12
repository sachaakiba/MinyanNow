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
} from "react-native";
import { usersApi } from "../lib/api";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadIdDocument();
    }
  }, [visible, userId]);

  const loadIdDocument = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await usersApi.getIdDocument(userId);
      setImageUrl(result.url);
    } catch (err: any) {
      setError(err.message || "Impossible de charger la pièce d'identité");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setImageUrl(null);
    setError(null);
    onClose();
  };

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
              <Text style={styles.headerTitle}>Pièce d'identité</Text>
              <Text style={styles.headerSubtitle}>{userName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Chargement...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                  style={styles.retryBtn}
                  onPress={loadIdDocument}
                >
                  <Text style={styles.retryBtnText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            ) : imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.idImage}
                resizeMode="contain"
              />
            ) : null}
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Text style={styles.securityIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Cette image est sécurisée et ne peut être consultée que par vous
              en tant qu'organisateur.
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
                <Text style={styles.rejectButtonText}>Refuser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  actionLoading && styles.buttonDisabled,
                ]}
                onPress={() => onAccept(requestId)}
                disabled={actionLoading}
              >
                <Text style={styles.acceptButtonText}>
                  {actionLoading ? "..." : "Accepter"}
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
  content: {
    padding: 20,
    minHeight: 300,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
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
    minHeight: 300,
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
  idImage: {
    width: "100%",
    height: SCREEN_WIDTH * 0.8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
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
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
