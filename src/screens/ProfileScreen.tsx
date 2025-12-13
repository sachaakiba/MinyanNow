import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/colors";

export const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t("profile.notProvided");
    const locale =
      i18n.language === "he"
        ? "he-IL"
        : i18n.language === "en"
        ? "en-US"
        : "fr-FR";
    return new Date(dateString).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("profile.title")}</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)?.toUpperCase() ||
                user?.name?.charAt(0)?.toUpperCase() ||
                "?"}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.name || t("profile.notProvided")}
          </Text>
          {user?.hebrewName && (
            <Text style={styles.hebrewName}>{user.hebrewName}</Text>
          )}
          <Text style={styles.phoneNumber}>{user?.phoneNumber}</Text>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>{t("profile.personalInfo")}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("profile.firstName")}</Text>
                <Text style={styles.infoValue}>
                  {user?.firstName || t("profile.notProvided")}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("profile.lastName")}</Text>
                <Text style={styles.infoValue}>
                  {user?.lastName || t("profile.notProvided")}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>✡️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("profile.hebrewName")}</Text>
                <Text style={styles.infoValue}>
                  {user?.hebrewName || t("profile.notProvided")}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>📅</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("profile.dateOfBirth")}</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user?.dateOfBirth)}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Text>🏛️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t("profile.synagogue")}</Text>
                <Text style={styles.infoValue}>
                  {user?.synagogue || t("profile.notProvided")}
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={styles.editButtonIcon}>✏️</Text>
            <Text style={styles.editButtonText}>
              {t("profile.editProfile")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verification Section */}
        <View style={styles.verificationSection}>
          <Text style={styles.sectionTitle}>{t("profile.verification")}</Text>

          <View style={styles.verificationCard}>
            <View style={styles.verificationHeader}>
              <View style={styles.verificationIconContainer}>
                <Text style={styles.verificationIcon}>🪪</Text>
              </View>
              <View style={styles.verificationContent}>
                <Text style={styles.verificationTitle}>
                  {t("profile.idDocument")}
                </Text>
                {user?.idDocumentUrl ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>
                      {t("profile.idVerified")}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>
                      {t("profile.idNotProvided")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            {user?.idUploadedAt && (
              <Text style={styles.verificationDate}>
                {t("profile.idUpdatedAt", {
                  date: new Date(user.idUploadedAt).toLocaleDateString(
                    i18n.language === "he"
                      ? "he-IL"
                      : i18n.language === "en"
                      ? "en-US"
                      : "fr-FR"
                  ),
                })}
              </Text>
            )}
            <TouchableOpacity
              style={styles.updateIdButton}
              onPress={() => navigation.navigate("UpdateIdDocument")}
            >
              <Text style={styles.updateIdButtonText}>
                {user?.idDocumentUrl
                  ? t("profile.updateId")
                  : t("profile.addId")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate("Settings")}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>⚙️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{t("profile.settings")}</Text>
              <Text style={styles.actionSubtitle}>
                {t("profile.settingsSubtitle")}
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  settingsBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsBtnText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  hebrewName: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 68,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  editButtonIcon: {
    fontSize: 16,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  verificationSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  verificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  verificationIconContainer: {
    width: 52,
    height: 52,
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  verificationIcon: {
    fontSize: 26,
  },
  verificationContent: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  verifiedBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
  pendingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  verificationDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 12,
  },
  updateIdButton: {
    backgroundColor: "#F3F4F6",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  updateIdButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  actionIconText: {
    fontSize: 22,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 24,
    color: "#9CA3AF",
  },
});
