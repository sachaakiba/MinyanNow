import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";
import { colors } from "../lib/colors";
import { LANGUAGES, LanguageCode, changeLanguage } from "../lib/i18n";

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Settings"
>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
  rightElement?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
  rightElement,
}) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
      <Text style={styles.settingIconText}>{icon}</Text>
    </View>
    <View style={styles.settingContent}>
      <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {rightElement}
    {showArrow && !rightElement && <Text style={styles.settingArrow}>›</Text>}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const currentLanguage = i18n.language as LanguageCode;
  const currentLang = LANGUAGES[currentLanguage] || LANGUAGES.fr;

  const handleSignOut = () => {
    showAlert(
      t("alerts.signOut.title"),
      t("alerts.signOut.message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.signOut"),
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ],
      "confirm"
    );
  };

  const handleSelectLanguage = async (language: LanguageCode) => {
    if (language !== currentLanguage) {
      await changeLanguage(language);
    }
    setLanguageModalVisible(false);
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
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="👤"
              title={t("settings.editProfile")}
              subtitle={t("settings.editProfileSubtitle")}
              onPress={() => navigation.navigate("EditProfile")}
            />
            <SettingItem
              icon="🪪"
              title={t("settings.idDocument")}
              subtitle={t("settings.idDocumentSubtitle")}
              onPress={() => navigation.navigate("UpdateIdDocument")}
            />
            <SettingItem
              icon="🌐"
              title={t("settings.language")}
              subtitle={t("settings.languageSubtitle")}
              onPress={() => setLanguageModalVisible(true)}
              rightElement={
                <View style={styles.languageBadge}>
                  <Text style={styles.languageFlag}>{currentLang.flag}</Text>
                  <Text style={styles.languageName}>
                    {currentLang.nativeName}
                  </Text>
                </View>
              }
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.notifications")}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔔"
              title={t("settings.notificationPreferences")}
              subtitle={t("settings.notificationSubtitle")}
              onPress={() => navigation.navigate("NotificationSettings")}
            />
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.help")}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="❓"
              title={t("settings.helpCenter")}
              subtitle={t("settings.helpCenterSubtitle")}
              onPress={() => navigation.navigate("HelpCenter")}
            />
            <SettingItem
              icon="📧"
              title={t("settings.contactUs")}
              subtitle={t("settings.contactUsSubtitle")}
              onPress={() => navigation.navigate("ContactUs")}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("settings.legal")}</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📄"
              title={t("settings.termsOfService")}
              onPress={() => navigation.navigate("TermsOfService")}
            />
            <SettingItem
              icon="🔒"
              title={t("settings.privacyPolicy")}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🚪"
              title={t("settings.signOut")}
              onPress={handleSignOut}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            {t("settings.version", { version: "1.0.0" })}
          </Text>
        </View>
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableWithoutFeedback
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t("languages.select")}</Text>

                {(Object.keys(LANGUAGES) as LanguageCode[]).map((langCode) => {
                  const lang = LANGUAGES[langCode];
                  const isSelected = langCode === currentLanguage;

                  return (
                    <TouchableOpacity
                      key={langCode}
                      style={[
                        styles.languageOption,
                        isSelected && styles.languageOptionSelected,
                      ]}
                      onPress={() => handleSelectLanguage(langCode)}
                    >
                      <Text style={styles.languageOptionFlag}>{lang.flag}</Text>
                      <View style={styles.languageOptionInfo}>
                        <Text
                          style={[
                            styles.languageOptionName,
                            isSelected && styles.languageOptionNameSelected,
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setLanguageModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 20,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.background.tertiary,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingIconDanger: {
    backgroundColor: colors.errorLight,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  settingTitleDanger: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 22,
    color: colors.text.tertiary,
  },
  languageBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  languageFlag: {
    fontSize: 16,
  },
  languageName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.secondary,
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
    textAlign: "center",
    marginBottom: 20,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.background.secondary,
  },
  languageOptionSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  languageOptionFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageOptionInfo: {
    flex: 1,
  },
  languageOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  languageOptionNameSelected: {
    color: colors.primary,
  },
  checkmark: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 8,
    padding: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: "500",
  },
});
