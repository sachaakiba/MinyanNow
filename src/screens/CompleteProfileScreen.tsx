import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
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
import { usersApi } from "../lib/api";

type CompleteProfileScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CompleteProfile"
>;

interface CompleteProfileScreenProps {
  navigation: CompleteProfileScreenNavigationProp;
}

export const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({
  navigation,
}) => {
  const { completeProfile, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hebrewName, setHebrewName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [synagogue, setSynagogue] = useState("");

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ID Document
  const [idDocumentImage, setIdDocumentImage] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState(false);

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

    if (!idDocumentImage) {
      newErrors.idDocument = "La pièce d'identité est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickIdDocument = async () => {
    setErrors((prev) => ({ ...prev, idDocument: "" }));

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        "Permission refusée",
        "Nous avons besoin de l'accès à votre galerie pour sélectionner votre pièce d'identité",
        undefined,
        "error"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setIdDocumentImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const takeIdPhoto = async () => {
    setErrors((prev) => ({ ...prev, idDocument: "" }));

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showAlert(
        "Permission refusée",
        "Nous avons besoin de l'accès à votre caméra pour photographier votre pièce d'identité",
        undefined,
        "error"
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
      setIdDocumentImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickIdFromFiles = async () => {
    setErrors((prev) => ({ ...prev, idDocument: "" }));

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: "base64",
        });
        const mimeType = asset.mimeType || "image/jpeg";
        setIdDocumentImage(`data:${mimeType};base64,${base64}`);
      }
    } catch (err: any) {
      showAlert(
        "Erreur",
        "Erreur lors de la sélection du fichier",
        undefined,
        "error"
      );
    }
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
      // First upload the ID document
      if (idDocumentImage) {
        setUploadingId(true);
        try {
          await usersApi.uploadIdDocument(idDocumentImage);
        } catch (error: any) {
          showAlert(
            "Erreur",
            error.message || "Impossible d'envoyer la pièce d'identité",
            undefined,
            "error"
          );
          setLoading(false);
          setUploadingId(false);
          return;
        }
        setUploadingId(false);
      }

      // Then complete the profile
      const result = await completeProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        hebrewName: hebrewName.trim() || undefined,
        dateOfBirth: dateOfBirth!.toISOString(),
        synagogue: synagogue.trim() || undefined,
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

          {/* Synagogue */}
          <Input
            label="Synagogue fréquentée (optionnel)"
            placeholder="Ex: Synagogue de la Victoire"
            value={synagogue}
            onChangeText={setSynagogue}
            autoCapitalize="words"
          />

          {/* Pièce d'identité */}
          <View style={styles.idSection}>
            <Text style={styles.idSectionTitle}>🪪 Pièce d'identité *</Text>
            <View style={styles.idSecurityInfo}>
              <Text style={styles.idSecurityIcon}>🔒</Text>
              <Text style={styles.idSecurityText}>
                Pour la sécurité de notre communauté, nous vérifions l'identité
                de chaque membre. Votre document est stocké de manière sécurisée
                et n'est visible que par les organisateurs d'événements.
              </Text>
            </View>

            {idDocumentImage ? (
              <View style={styles.idPreviewContainer}>
                <Image
                  source={{ uri: idDocumentImage }}
                  style={styles.idPreviewImage}
                  resizeMode="contain"
                />
                <TouchableOpacity
                  style={styles.idChangeBtn}
                  onPress={() => setIdDocumentImage(null)}
                >
                  <Text style={styles.idChangeBtnText}>Changer de photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.idUploadButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.idUploadBtn,
                    errors.idDocument && styles.idUploadBtnError,
                  ]}
                  onPress={takeIdPhoto}
                >
                  <Text style={styles.idUploadBtnText}>Prendre une photo</Text>
                </TouchableOpacity>
                <View style={styles.idUploadButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.idUploadBtnSecondary,
                      errors.idDocument && styles.idUploadBtnError,
                    ]}
                    onPress={pickIdDocument}
                  >
                    <Text style={styles.idUploadBtnTextSecondary}>Galerie</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.idUploadBtnSecondary,
                      errors.idDocument && styles.idUploadBtnError,
                    ]}
                    onPress={pickIdFromFiles}
                  >
                    <Text style={styles.idUploadBtnTextSecondary}>
                      Fichiers
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {errors.idDocument && (
              <Text style={styles.errorText}>{errors.idDocument}</Text>
            )}
            <Text style={styles.idInfoText}>
              Documents acceptés : Carte d'identité, Passeport, Permis de
              conduire
            </Text>
          </View>

          <Button
            title={
              uploadingId
                ? "Envoi de la pièce d'identité..."
                : "Valider mon profil"
            }
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
  // ID Document styles
  idSection: {
    marginTop: 24,
    marginBottom: 8,
  },
  idSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  idSecurityInfo: {
    flexDirection: "row",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  idSecurityIcon: {
    fontSize: 20,
    marginTop: 2,
  },
  idSecurityText: {
    flex: 1,
    fontSize: 13,
    color: "#166534",
    lineHeight: 19,
  },
  idPreviewContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  idPreviewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  idChangeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  idChangeBtnText: {
    fontSize: 14,
    color: "#4F46E5",
    fontWeight: "600",
  },
  idUploadButtonsContainer: {
    gap: 12,
    marginBottom: 8,
  },
  idUploadButtonsRow: {
    flexDirection: "row",
    gap: 12,
  },
  idUploadBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
  },
  idUploadBtnSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  idUploadBtnError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  idUploadBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  idUploadBtnTextSecondary: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  idInfoText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
});
