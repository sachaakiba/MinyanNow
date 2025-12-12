import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { AlertModal, useAlert } from "../components";

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
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
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
    {showArrow && <Text style={styles.settingArrow}>›</Text>}
  </TouchableOpacity>
);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const { signOut } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  const handleSignOut = () => {
    showAlert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            await signOut();
          },
        },
      ],
      "confirm"
    );
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
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="👤"
              title="Modifier mon profil"
              subtitle="Informations personnelles"
              onPress={() => navigation.navigate("EditProfile")}
            />
            <SettingItem
              icon="🪪"
              title="Pièce d'identité"
              subtitle="Mettre à jour ma pièce d'identité"
              onPress={() => navigation.navigate("UpdateIdDocument")}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🔔"
              title="Préférences de notifications"
              subtitle="Gérer les alertes et rappels"
              onPress={() => navigation.navigate("NotificationSettings")}
            />
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aide</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="❓"
              title="Centre d'aide"
              subtitle="FAQ et support"
              onPress={() => navigation.navigate("HelpCenter")}
            />
            <SettingItem
              icon="📧"
              title="Nous contacter"
              subtitle="Signaler un problème"
              onPress={() => navigation.navigate("ContactUs")}
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Légal</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="📄"
              title="Conditions d'utilisation"
              onPress={() => navigation.navigate("TermsOfService")}
            />
            <SettingItem
              icon="🔒"
              title="Politique de confidentialité"
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="🚪"
              title="Déconnexion"
              onPress={handleSignOut}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MinyanNow v1.0.0</Text>
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
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingIcon: {
    width: 44,
    height: 44,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  settingIconDanger: {
    backgroundColor: "#FEE2E2",
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
    color: "#111827",
  },
  settingTitleDanger: {
    color: "#DC2626",
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 22,
    color: "#9CA3AF",
  },
  versionContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  versionText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
