import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { AlertModal, useAlert } from "../components";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/colors";

type ContactUsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ContactUs"
>;

interface ContactUsScreenProps {
  navigation: ContactUsScreenNavigationProp;
}

const CONTACT_EMAIL = "minyannow.app+contact@gmail.com";

type ContactReason =
  | "general"
  | "bug"
  | "suggestion"
  | "account"
  | "security"
  | "other";

interface ReasonOption {
  id: ContactReason;
  icon: string;
}

const CONTACT_REASONS: ReasonOption[] = [
  { id: "general", icon: "❓" },
  { id: "bug", icon: "🐛" },
  { id: "suggestion", icon: "💡" },
  { id: "account", icon: "👤" },
  { id: "security", icon: "🔒" },
  { id: "other", icon: "📝" },
];

export const ContactUsScreen: React.FC<ContactUsScreenProps> = ({
  navigation,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [selectedReason, setSelectedReason] = useState<ContactReason | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const getReasonLabel = (id: ContactReason) => t(`contactUs.reasons.${id}`);
  const getEmailSubject = (id: ContactReason) => t(`contactUs.emailSubjects.${id}`);

  const handleSendEmail = async () => {
    if (!selectedReason) {
      showAlert(
        t("contactUs.reasonRequired"),
        t("contactUs.reasonRequiredMessage"),
        undefined,
        "error"
      );
      return;
    }

    if (message.trim().length < 10) {
      showAlert(
        t("contactUs.messageTooShort"),
        t("contactUs.messageTooShortMessage"),
        undefined,
        "error"
      );
      return;
    }

    setSending(true);

    const subject = encodeURIComponent(
      `[MinyanNow] ${getEmailSubject(selectedReason)}`
    );

    // Construire le corps de l'email avec les infos utilisateur
    const userInfo = user
      ? `\n\n---\nInformations utilisateur:\nNom: ${user.firstName || ""} ${
          user.lastName || ""
        }\nTéléphone: ${user.phoneNumber || "N/A"}\nID: ${user.id}`
      : "";

    const body = encodeURIComponent(`${message}${userInfo}`);

    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailtoUrl);

      if (supported) {
        await Linking.openURL(mailtoUrl);
        showAlert(
          t("contactUs.emailReady"),
          t("contactUs.emailReadyMessage"),
          [
            {
              text: t("common.ok"),
              onPress: () => navigation.goBack(),
            },
          ],
          "success"
        );
      } else {
        showAlert(
          t("common.error"),
          `${t("contactUs.emailError")} ${CONTACT_EMAIL}`,
          undefined,
          "error"
        );
      }
    } catch (error) {
      showAlert(
        t("common.error"),
        `${t("contactUs.emailError")} ${CONTACT_EMAIL}`,
        undefined,
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  const handleDirectEmail = async () => {
    const mailtoUrl = `mailto:${CONTACT_EMAIL}`;
    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      showAlert(
        t("common.error"),
        `${t("contactUs.emailError")} ${CONTACT_EMAIL}`,
        undefined,
        "error"
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("contactUs.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <View style={styles.introIconContainer}>
            <Text style={styles.introIcon}>💬</Text>
          </View>
          <Text style={styles.introTitle}>
            {t("contactUs.intro")}
          </Text>
          <Text style={styles.introText}>
            {t("contactUs.introText")}
          </Text>
        </View>

        {/* Contact Reasons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("contactUs.reasonTitle")}</Text>
          <View style={styles.reasonsGrid}>
            {CONTACT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonCard,
                  selectedReason === reason.id && styles.reasonCardActive,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Text style={styles.reasonIcon}>{reason.icon}</Text>
                <Text
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.id && styles.reasonLabelActive,
                  ]}
                >
                  {getReasonLabel(reason.id)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("contactUs.messageTitle")}</Text>
          <TextInput
            style={styles.messageInput}
            placeholder={t("contactUs.messagePlaceholder")}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={message}
            onChangeText={setMessage}
          />
          <Text style={styles.charCount}>{message.length} {t("common.characters")}</Text>
        </View>

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!selectedReason || message.trim().length < 10) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSendEmail}
          disabled={sending || !selectedReason || message.trim().length < 10}
        >
          <Text style={styles.sendButtonText}>
            {sending ? t("contactUs.sending") : t("contactUs.send")}
          </Text>
        </TouchableOpacity>

        {/* Alternative Contact */}
        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeTitle}>
            {t("contactUs.alternative")}
          </Text>
          <TouchableOpacity
            style={styles.emailCard}
            onPress={handleDirectEmail}
          >
            <View style={styles.emailIconContainer}>
              <Text style={styles.emailIcon}>📧</Text>
            </View>
            <View style={styles.emailContent}>
              <Text style={styles.emailLabel}>{t("contactUs.email")}</Text>
              <Text style={styles.emailAddress}>{CONTACT_EMAIL}</Text>
            </View>
            <Text style={styles.emailArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Response Time */}
        <View style={styles.responseTimeSection}>
          <Text style={styles.responseTimeIcon}>⏱️</Text>
          <Text style={styles.responseTimeText}>
            {t("contactUs.responseTime")}
          </Text>
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
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
    </KeyboardAvoidingView>
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
  },
  introSection: {
    padding: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    marginBottom: 16,
  },
  introIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  introIcon: {
    fontSize: 32,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  introText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  reasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  reasonCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  reasonCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  reasonIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
  },
  reasonLabelActive: {
    color: colors.primary,
    fontWeight: "600",
  },
  messageInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: "#111827",
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  charCount: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: colors.primaryLight,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  alternativeSection: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  alternativeTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
  },
  emailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  emailIcon: {
    fontSize: 24,
  },
  emailContent: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },
  emailAddress: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  emailArrow: {
    fontSize: 22,
    color: "#9CA3AF",
  },
  responseTimeSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
  },
  responseTimeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  responseTimeText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 20,
  },
  footer: {
    height: 40,
  },
});
