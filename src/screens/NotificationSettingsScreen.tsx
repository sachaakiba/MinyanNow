import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { AlertModal, useAlert } from "../components";
import { usersApi } from "../lib/api";
import { colors } from "../lib/colors";

type NotificationSettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NotificationSettings"
>;

interface NotificationSettingsScreenProps {
  navigation: NotificationSettingsScreenNavigationProp;
}

interface NotificationPreferences {
  notificationsEnabled: boolean;
  notifyProximity: boolean;
  notifyNewRequests: boolean;
  notifyRequestStatus: boolean;
  notifyEventUpdates: boolean;
  notifyEventReminders: boolean;
  proximityRadius: number;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notificationsEnabled: true,
  notifyProximity: true,
  notifyNewRequests: true,
  notifyRequestStatus: true,
  notifyEventUpdates: true,
  notifyEventReminders: true,
  proximityRadius: 500,
};

export const NotificationSettingsScreen: React.FC<
  NotificationSettingsScreenProps
> = ({ navigation }) => {
  const { t } = useTranslation();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { alertState, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await usersApi.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error("Error loading preferences:", error);
      showAlert(
        t("common.error"),
        t("notifications.loadError"),
        undefined,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await usersApi.updateNotificationPreferences(preferences);
      setHasChanges(false);
      showAlert(
        t("notifications.saved"),
        t("notifications.savedMessage"),
        undefined,
        "success"
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
      showAlert(
        t("common.error"),
        t("notifications.saveError"),
        undefined,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const getRadiusLabel = (radius: number): string => {
    if (radius >= 1000) {
      return `${(radius / 1000).toFixed(1)} km`;
    }
    return `${radius} m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("notifications.loading")}</Text>
      </View>
    );
  }

  const isDisabled = !preferences.notificationsEnabled;

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
        <Text style={styles.headerTitle}>{t("notifications.title")}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={savePreferences}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.saveBtnText,
                !hasChanges && styles.saveBtnTextDisabled,
              ]}
            >
              {t("notifications.save")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <View style={styles.masterToggle}>
            <View style={styles.settingInfo}>
              <Text style={styles.masterTitle}>{t("notifications.title")}</Text>
              <Text style={styles.masterSubtitle}>
                {preferences.notificationsEnabled
                  ? t("notifications.enabled")
                  : t("notifications.disabled")}
              </Text>
            </View>
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={(value) =>
                updatePreference("notificationsEnabled", value)
              }
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notificationsEnabled ? colors.primary : "#F3F4F6"
              }
            />
          </View>
        </View>

        {/* Proximity Section */}
        <View style={[styles.section, isDisabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>{t("notifications.proximity.title")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("notifications.proximity.subtitle")}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📍</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t("notifications.proximity.toggle")}</Text>
                <Text style={styles.settingDescription}>
                  {t("notifications.proximity.toggleDescription")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.notifyProximity}
              onValueChange={(value) =>
                updatePreference("notifyProximity", value)
              }
              disabled={isDisabled}
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notifyProximity ? colors.primary : "#F3F4F6"
              }
            />
          </View>

          {preferences.notifyProximity && !isDisabled && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderLabel}>{t("notifications.proximity.radius")}</Text>
                <Text style={styles.sliderValue}>
                  {getRadiusLabel(preferences.proximityRadius)}
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={100}
                maximumValue={2000}
                step={100}
                value={preferences.proximityRadius}
                onValueChange={(value) =>
                  updatePreference("proximityRadius", value)
                }
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#E5E7EB"
                thumbTintColor={colors.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderMinMax}>100m</Text>
                <Text style={styles.sliderMinMax}>2km</Text>
              </View>
            </View>
          )}
        </View>

        {/* Organizer Section */}
        <View style={[styles.section, isDisabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>{t("notifications.organizer.title")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("notifications.organizer.subtitle")}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🙋</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t("notifications.organizer.newRequests")}</Text>
                <Text style={styles.settingDescription}>
                  {t("notifications.organizer.newRequestsDescription")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.notifyNewRequests}
              onValueChange={(value) =>
                updatePreference("notifyNewRequests", value)
              }
              disabled={isDisabled}
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notifyNewRequests ? colors.primary : "#F3F4F6"
              }
            />
          </View>
        </View>

        {/* Participant Section */}
        <View style={[styles.section, isDisabled && styles.sectionDisabled]}>
          <Text style={styles.sectionTitle}>{t("notifications.participant.title")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("notifications.participant.subtitle")}
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>✅</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t("notifications.participant.requestStatus")}</Text>
                <Text style={styles.settingDescription}>
                  {t("notifications.participant.requestStatusDescription")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.notifyRequestStatus}
              onValueChange={(value) =>
                updatePreference("notifyRequestStatus", value)
              }
              disabled={isDisabled}
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notifyRequestStatus ? colors.primary : "#F3F4F6"
              }
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📝</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>
                  {t("notifications.participant.eventUpdates")}
                </Text>
                <Text style={styles.settingDescription}>
                  {t("notifications.participant.eventUpdatesDescription")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.notifyEventUpdates}
              onValueChange={(value) =>
                updatePreference("notifyEventUpdates", value)
              }
              disabled={isDisabled}
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notifyEventUpdates ? colors.primary : "#F3F4F6"
              }
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t("notifications.participant.reminders")}</Text>
                <Text style={styles.settingDescription}>
                  {t("notifications.participant.remindersDescription")}
                </Text>
              </View>
            </View>
            <Switch
              value={preferences.notifyEventReminders}
              onValueChange={(value) =>
                updatePreference("notifyEventReminders", value)
              }
              disabled={isDisabled}
              trackColor={{ false: "#E5E7EB", true: colors.primaryLight }}
              thumbColor={
                preferences.notifyEventReminders ? colors.primary : "#F3F4F6"
              }
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            {t("notifications.info")}
          </Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
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
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtnTextDisabled: {
    color: "#9CA3AF",
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 16,
  },
  masterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  masterSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingInfo: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  settingDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  sliderContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sliderMinMax: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary,
    lineHeight: 20,
  },
});
