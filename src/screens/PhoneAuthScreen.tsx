import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Input, Button, AlertModal, useAlert } from "../components";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";

type PhoneAuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PhoneAuth"
>;

interface PhoneAuthScreenProps {
  navigation: PhoneAuthScreenNavigationProp;
}

export const PhoneAuthScreen: React.FC<PhoneAuthScreenProps> = ({
  navigation,
}) => {
  const { sendOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alert modal
  const { alertState, showAlert, hideAlert } = useAlert();

  // Formatte le numéro de téléphone pour l'affichage
  const formatPhoneDisplay = (value: string) => {
    // Garde seulement les chiffres
    const digits = value.replace(/\D/g, "");

    // Format français: 06 12 34 56 78
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    }
    return digits;
  };

  const handlePhoneChange = (value: string) => {
    // Garde seulement les chiffres et espaces pour l'affichage
    const cleaned = value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleaned);
    setError(null);
  };

  const validatePhone = () => {
    const digits = phoneNumber.replace(/\D/g, "");

    if (!digits) {
      setError("Numéro de téléphone requis");
      return false;
    }

    // Vérifie le format français (10 chiffres commençant par 0)
    if (digits.length !== 10 || !digits.startsWith("0")) {
      setError("Numéro de téléphone invalide");
      return false;
    }

    return true;
  };

  // Convertit le numéro français en format international
  const toInternationalFormat = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    // Remplace le 0 initial par +33
    return `+33${digits.substring(1)}`;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    try {
      const internationalPhone = toInternationalFormat(phoneNumber);
      const result = await sendOTP(internationalPhone);

      if (result.success) {
        navigation.navigate("OTPVerification", {
          phoneNumber: internationalPhone,
        });
      } else {
        showAlert(
          "Erreur",
          result.error || "Impossible d'envoyer le code",
          undefined,
          "error"
        );
      }
    } catch (error) {
      showAlert(
        "Erreur",
        "Une erreur est survenue. Réessayez.",
        undefined,
        "error"
      );
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
          <Text style={styles.appName}>MinyanNow</Text>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone pour recevoir un code de
            vérification
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Text style={styles.flag}>🇫🇷</Text>
              <Text style={styles.countryCodeText}>+33</Text>
            </View>
            <View style={styles.phoneInput}>
              <Input
                label=""
                placeholder="06 12 34 56 78"
                value={formatPhoneDisplay(phoneNumber)}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                error={error || undefined}
                style={styles.input}
              />
            </View>
          </View>

          <Button
            title="Recevoir le code"
            onPress={handleSendOTP}
            loading={loading}
            style={styles.button}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            En continuant, vous acceptez nos{" "}
            <Text style={styles.infoLink}>Conditions d'utilisation</Text> et
            notre{" "}
            <Text style={styles.infoLink}>Politique de confidentialité</Text>
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
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#4F46E5",
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  countryCode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginRight: 12,
    marginTop: 4,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  phoneInput: {
    flex: 1,
  },
  input: {
    fontSize: 18,
    letterSpacing: 1,
  },
  button: {
    marginTop: 8,
  },
  info: {
    marginTop: "auto",
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  infoLink: {
    color: "#4F46E5",
    fontWeight: "500",
  },
});
