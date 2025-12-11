import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Input,
  Button,
  DatePickerModal,
  AlertModal,
  useAlert,
} from "../components";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";

type CompleteProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CompleteProfile"
>;

interface CompleteProfileScreenProps {
  navigation: CompleteProfileScreenNavigationProp;
}

// Liste des parachiot de la Torah
const PARACHIOT = [
  "Berechit",
  "Noa'h",
  "Lekh Lekha",
  "Vayera",
  "Hayé Sarah",
  "Toledot",
  "Vayetsé",
  "Vayichla'h",
  "Vayéchev",
  "Mikets",
  "Vayigach",
  "Vaye'hi",
  "Chemot",
  "Vaéra",
  "Bo",
  "Bechala'h",
  "Yitro",
  "Michpatim",
  "Terouma",
  "Tetsavé",
  "Ki Tissa",
  "Vayakhel",
  "Pekoudé",
  "Vayikra",
  "Tsav",
  "Chemini",
  "Tazria",
  "Metsora",
  "A'haré Mot",
  "Kedochim",
  "Emor",
  "Behar",
  "Be'houkotaï",
  "Bamidbar",
  "Nasso",
  "Behaalotekha",
  "Chela'h Lekha",
  "Kora'h",
  "Houkat",
  "Balak",
  "Pin'has",
  "Matot",
  "Massé",
  "Devarim",
  "Vaet'hanan",
  "Ekev",
  "Reé",
  "Choftim",
  "Ki Tetsé",
  "Ki Tavo",
  "Nitsavim",
  "Vayelekh",
  "Haazinou",
  "Vezot Haberakha",
];

const COMMUNITIES = [
  { id: "ashkenaze", label: "Ashkénaze" },
  { id: "sefarade", label: "Séfarade" },
  { id: "mizrahi", label: "Mizrahi" },
  { id: "teimani", label: "Téimani (Yéménite)" },
  { id: "loubavitch", label: "Loubavitch" },
  { id: "other", label: "Autre" },
];

export const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({
  navigation,
}) => {
  const { completeProfile, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hebrewName, setHebrewName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [barMitzvahParasha, setBarMitzvahParasha] = useState("");
  const [synagogue, setSynagogue] = useState("");
  const [community, setCommunity] = useState("");

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showParashaModal, setShowParashaModal] = useState(false);
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Alert modal
  const { alertState, showAlert, hideAlert } = useAlert();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!dateOfBirth) {
      newErrors.dateOfBirth = "La date de naissance est requise";
    } else {
      // Vérifier que l'utilisateur a au moins 13 ans (Bar Mitzvah)
      const today = new Date();
      const age = today.getFullYear() - dateOfBirth.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = "Vous devez avoir au moins 13 ans";
      }
    }

    if (!barMitzvahParasha) {
      newErrors.barMitzvahParasha = "La paracha de Bar Mitzvah est requise";
    }

    if (!community) {
      newErrors.community = "La communauté est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (selectedDate: Date) => {
    setDateOfBirth(selectedDate);
    setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        hebrewName: hebrewName.trim() || undefined,
        dateOfBirth: dateOfBirth!.toISOString(),
        barMitzvahParasha,
        synagogue: synagogue.trim() || undefined,
        community,
      });

      if (result.success) {
        // La navigation sera automatique via AuthContext
      } else {
        showAlert(
          "Erreur",
          result.error || "Impossible de sauvegarder le profil",
          undefined,
          "error"
        );
      }
    } catch (error) {
      showAlert("Erreur", "Une erreur est survenue", undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>✡️</Text>
          <Text style={styles.title}>Complétez votre profil</Text>
          <Text style={styles.subtitle}>
            Ces informations nous permettent de vérifier votre appartenance à la
            communauté juive et de personnaliser votre expérience.
          </Text>
        </View>

        <View style={styles.form}>
          {/* Prénom */}
          <Input
            label="Prénom *"
            placeholder="Ex: David"
            value={firstName}
            onChangeText={(text) => {
              setFirstName(text);
              setErrors((prev) => ({ ...prev, firstName: "" }));
            }}
            autoCapitalize="words"
            error={errors.firstName}
          />

          {/* Nom */}
          <Input
            label="Nom de famille *"
            placeholder="Ex: Cohen"
            value={lastName}
            onChangeText={(text) => {
              setLastName(text);
              setErrors((prev) => ({ ...prev, lastName: "" }));
            }}
            autoCapitalize="words"
            error={errors.lastName}
          />

          {/* Nom hébraïque */}
          <Input
            label="Nom hébraïque (optionnel)"
            placeholder="Ex: David ben Avraham"
            value={hebrewName}
            onChangeText={setHebrewName}
            autoCapitalize="words"
          />

          {/* Date de naissance */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Date de naissance *</Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                errors.dateOfBirth && styles.selectButtonError,
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !dateOfBirth && styles.selectButtonPlaceholder,
                ]}
              >
                {dateOfBirth
                  ? formatDate(dateOfBirth)
                  : "Sélectionner une date"}
              </Text>
              <Text style={styles.selectButtonIcon}>📅</Text>
            </TouchableOpacity>
            {errors.dateOfBirth && (
              <Text style={styles.errorText}>{errors.dateOfBirth}</Text>
            )}
          </View>

          {/* Paracha Bar Mitzvah */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Paracha de votre Bar Mitzvah *</Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                errors.barMitzvahParasha && styles.selectButtonError,
              ]}
              onPress={() => setShowParashaModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !barMitzvahParasha && styles.selectButtonPlaceholder,
                ]}
              >
                {barMitzvahParasha || "Sélectionner une paracha"}
              </Text>
              <Text style={styles.selectButtonIcon}>📖</Text>
            </TouchableOpacity>
            {errors.barMitzvahParasha && (
              <Text style={styles.errorText}>{errors.barMitzvahParasha}</Text>
            )}
          </View>

          {/* Communauté */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Communauté *</Text>
            <TouchableOpacity
              style={[
                styles.selectButton,
                errors.community && styles.selectButtonError,
              ]}
              onPress={() => setShowCommunityModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !community && styles.selectButtonPlaceholder,
                ]}
              >
                {community
                  ? COMMUNITIES.find((c) => c.id === community)?.label
                  : "Sélectionner votre communauté"}
              </Text>
              <Text style={styles.selectButtonIcon}>🕍</Text>
            </TouchableOpacity>
            {errors.community && (
              <Text style={styles.errorText}>{errors.community}</Text>
            )}
          </View>

          {/* Synagogue */}
          <Input
            label="Synagogue fréquentée (optionnel)"
            placeholder="Ex: Synagogue de la Victoire"
            value={synagogue}
            onChangeText={setSynagogue}
            autoCapitalize="words"
          />

          <Button
            title="Valider mon profil"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
        </View>

        <Text style={styles.privacyNote}>
          🔒 Vos informations sont confidentielles et ne seront jamais partagées
          sans votre consentement.
        </Text>
      </ScrollView>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        value={dateOfBirth || new Date()}
        onChange={handleDateChange}
        onClose={() => setShowDatePicker(false)}
        title="Date de naissance"
        mode="date"
        maximumDate={new Date()}
        minimumDate={new Date(1930, 0, 1)}
      />

      {/* Paracha Selection Modal */}
      <Modal visible={showParashaModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.listModal}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>
                Sélectionnez votre paracha
              </Text>
              <TouchableOpacity onPress={() => setShowParashaModal(false)}>
                <Text style={styles.listModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.listModalScroll}>
              {PARACHIOT.map((parasha) => (
                <TouchableOpacity
                  key={parasha}
                  style={[
                    styles.listModalItem,
                    barMitzvahParasha === parasha &&
                      styles.listModalItemSelected,
                  ]}
                  onPress={() => {
                    setBarMitzvahParasha(parasha);
                    setErrors((prev) => ({ ...prev, barMitzvahParasha: "" }));
                    setShowParashaModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.listModalItemText,
                      barMitzvahParasha === parasha &&
                        styles.listModalItemTextSelected,
                    ]}
                  >
                    {parasha}
                  </Text>
                  {barMitzvahParasha === parasha && (
                    <Text style={styles.listModalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Community Selection Modal */}
      <Modal visible={showCommunityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.listModal}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>
                Sélectionnez votre communauté
              </Text>
              <TouchableOpacity onPress={() => setShowCommunityModal(false)}>
                <Text style={styles.listModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.listModalScroll}>
              {COMMUNITIES.map((com) => (
                <TouchableOpacity
                  key={com.id}
                  style={[
                    styles.listModalItem,
                    community === com.id && styles.listModalItemSelected,
                  ]}
                  onPress={() => {
                    setCommunity(com.id);
                    setErrors((prev) => ({ ...prev, community: "" }));
                    setShowCommunityModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.listModalItemText,
                      community === com.id && styles.listModalItemTextSelected,
                    ]}
                  >
                    {com.label}
                  </Text>
                  {community === com.id && (
                    <Text style={styles.listModalItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    textAlign: "center",
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectButtonError: {
    borderColor: "#EF4444",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  selectButtonPlaceholder: {
    color: "#9CA3AF",
  },
  selectButtonIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  submitButton: {
    marginTop: 24,
  },
  privacyNote: {
    fontSize: 13,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  listModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  listModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  listModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  listModalClose: {
    fontSize: 20,
    color: "#6B7280",
    padding: 4,
  },
  listModalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  listModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  listModalItemSelected: {
    backgroundColor: "#EEF2FF",
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: "#EEF2FF",
  },
  listModalItemText: {
    fontSize: 16,
    color: "#374151",
  },
  listModalItemTextSelected: {
    color: "#4F46E5",
    fontWeight: "600",
  },
  listModalItemCheck: {
    fontSize: 18,
    color: "#4F46E5",
    fontWeight: "600",
  },
});
