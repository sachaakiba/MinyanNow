import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert, DatePickerModal } from "../components";
import { usersApi } from "../lib/api";
import { colors } from "../lib/colors";

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditProfile"
>;

interface EditProfileScreenProps {
  navigation: EditProfileScreenNavigationProp;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  navigation,
}) => {
  const { t, i18n } = useTranslation();
  const { user, refreshSession } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [hebrewName, setHebrewName] = useState(user?.hebrewName || "");
  const [synagogue, setSynagogue] = useState(user?.synagogue || "");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    user?.dateOfBirth ? new Date(user.dateOfBirth) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatDate = (date: Date) => {
    const locale =
      i18n.language === "he"
        ? "he-IL"
        : i18n.language === "en"
        ? "en-US"
        : "fr-FR";
    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showAlert(
        t("editProfile.fieldsRequired"),
        t("editProfile.fieldsRequiredMessage"),
        undefined,
        "warning"
      );
      return;
    }

    if (!dateOfBirth) {
      showAlert(
        t("editProfile.dateRequired"),
        t("editProfile.dateRequiredMessage"),
        undefined,
        "warning"
      );
      return;
    }

    setSaving(true);
    try {
      await usersApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        hebrewName: hebrewName.trim() || undefined,
        dateOfBirth: dateOfBirth.toISOString(),
        synagogue: synagogue.trim() || undefined,
      });

      refreshSession();
      showAlert(
        t("editProfile.success"),
        t("editProfile.successMessage"),
        [{ text: t("common.ok"), onPress: () => navigation.goBack() }],
        "success"
      );
    } catch (error: any) {
      showAlert(
        t("common.error"),
        error.message || t("editProfile.error"),
        undefined,
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("editProfile.title")}</Text>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>{t("editProfile.save")}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstName?.charAt(0)?.toUpperCase() ||
                user?.name?.charAt(0)?.toUpperCase() ||
                "?"}
            </Text>
          </View>
          <Text style={styles.phoneNumber}>{user?.phoneNumber}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Prénom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.firstName")}</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t("editProfile.firstNamePlaceholder")}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          {/* Nom */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.lastName")}</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder={t("editProfile.lastNamePlaceholder")}
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          {/* Prénom hébraïque */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.hebrewName")}</Text>
            <TextInput
              style={styles.input}
              value={hebrewName}
              onChangeText={setHebrewName}
              placeholder={t("editProfile.hebrewNamePlaceholder")}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.dateOfBirth")}</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  styles.selectInputText,
                  !dateOfBirth && styles.placeholder,
                ]}
              >
                {dateOfBirth
                  ? formatDate(dateOfBirth)
                  : t("editProfile.selectDate")}
              </Text>
              <Text style={styles.selectIcon}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Synagogue */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("editProfile.synagogue")}</Text>
            <TextInput
              style={styles.input}
              value={synagogue}
              onChangeText={setSynagogue}
              placeholder={t("editProfile.synagoguePlaceholder")}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>{t("editProfile.requiredFields")}</Text>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        value={dateOfBirth || new Date(2000, 0, 1)}
        onChange={(date: Date) => {
          setDateOfBirth(date);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
        maximumDate={new Date()}
        minimumDate={new Date(1920, 0, 1)}
        title={t("editProfile.dateOfBirth")}
      />

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
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  phoneNumber: {
    fontSize: 14,
    color: "#6B7280",
  },
  form: {
    padding: 20,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
  },
  selectInputText: {
    fontSize: 16,
    color: "#111827",
  },
  placeholder: {
    color: "#9CA3AF",
  },
  selectIcon: {
    fontSize: 18,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    lineHeight: 20,
  },
});
