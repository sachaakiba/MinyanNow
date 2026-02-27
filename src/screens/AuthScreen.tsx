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
import { useTranslation } from "react-i18next";
import {
  // Input, // EMAIL AUTH DISABLED - uncomment if re-enabling email login
  Button,
  AlertModal,
  useAlert,
  LanguageSelector,
} from "../components";
import { PhoneInput } from "../components/PhoneInput";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/colors";

type AuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Auth"
>;

interface AuthScreenProps {
  navigation: AuthScreenNavigationProp;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { sendOTP } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState("");

  // EMAIL AUTH DISABLED - Uncomment to re-enable email login
  // const [authMode, setAuthMode] = useState<AuthMethod>("phone");
  // const [email, setEmail] = useState("");

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toInternational = (phone: string): string => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (cleaned.startsWith("+")) return cleaned;

    const lang = i18n.language;
    if (lang === "fr" && cleaned.startsWith("0")) {
      return `+33${cleaned.substring(1)}`;
    }
    if (lang === "he" && cleaned.startsWith("0")) {
      return `+972${cleaned.substring(1)}`;
    }
    if (lang === "en") {
      return `+1${cleaned}`;
    }
    return `+${cleaned}`;
  };

  const validatePhone = () => {
    const cleaned = phoneNumber.replace(/\s/g, "");

    if (!cleaned) {
      setError(t("auth.phoneAuth.invalidPhone"));
      return false;
    }

    return true;
  };

  // EMAIL AUTH DISABLED - Uncomment to re-enable email login
  // const validateEmail = () => {
  //   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  //
  //   if (!email || !emailRegex.test(email)) {
  //     setError(t("auth.emailAuth.invalidEmail"));
  //     return false;
  //   }
  //
  //   if (email.endsWith("@phone.minyannow.app")) {
  //     setError(t("auth.emailAuth.invalidEmail"));
  //     return false;
  //   }
  //
  //   return true;
  // };

  const handleSendPhoneOTP = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    try {
      const internationalPhone = toInternational(phoneNumber);
      const result = await sendOTP(internationalPhone);

      if (result.success) {
        navigation.navigate("OTPVerification", {
          authMethod: "phone",
          identifier: internationalPhone,
        });
      } else {
        showAlert(
          t("common.error"),
          result.error || t("errors.generic"),
          undefined,
          "error",
        );
      }
    } catch (err) {
      showAlert(t("common.error"), t("errors.generic"), undefined, "error");
    } finally {
      setLoading(false);
    }
  };

  // EMAIL AUTH DISABLED - Uncomment to re-enable email login
  // const handleSendEmailOTP = async () => {
  //   if (!validateEmail()) return;
  //
  //   setLoading(true);
  //   try {
  //     const result = await sendEmailOTP(email);
  //
  //     if (result.success) {
  //       navigation.navigate("OTPVerification", {
  //         authMethod: "email",
  //         identifier: email,
  //       });
  //     } else {
  //       showAlert(
  //         t("common.error"),
  //         result.error || t("errors.generic"),
  //         undefined,
  //         "error",
  //       );
  //     }
  //   } catch (err) {
  //     showAlert(t("common.error"), t("errors.generic"), undefined, "error");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const switchMode = () => {
  //   setError(null);
  //   setAuthMode(authMode === "phone" ? "email" : "phone");
  // };

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
        {/* Language Selector */}
        <View style={styles.languageContainer}>
          <LanguageSelector compact />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>{t("auth.welcome.appName")}</Text>
          <Text style={styles.title}>{t("auth.welcome.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.welcome.subtitle")}</Text>
        </View>

        {/* Form — phone only */}
        <View style={styles.form}>
          <PhoneInput
            value={phoneNumber}
            onChange={(value) => {
              setPhoneNumber(value);
              setError(null);
            }}
            error={error || undefined}
            label={t("auth.phoneAuth.phoneLabel")}
            placeholder={t("auth.phoneAuth.phonePlaceholder")}
          />
          <Button
            title={
              loading
                ? t("auth.phoneAuth.sendingCode")
                : t("auth.phoneAuth.continueButton")
            }
            onPress={handleSendPhoneOTP}
            loading={loading}
            style={styles.button}
          />
          {/* EMAIL AUTH DISABLED - Uncomment to re-enable email login option */}
          {/* <View style={styles.emailOption}>
            <Text style={styles.emailOptionText}>
              {t("auth.switch.connectByEmail")}{" "}
              <Text style={styles.emailOptionLink} onPress={switchMode}>
                {t("auth.switch.connectByEmailLink")}
              </Text>
            </Text>
          </View> */}
        </View>

        {/* Footer */}
        <View style={styles.info}>
          <Text style={styles.infoText}>
            {t("auth.phoneAuth.termsText")}{" "}
            <Text
              style={styles.infoLink}
              onPress={() => navigation.navigate("TermsOfService")}
            >
              {t("auth.phoneAuth.termsLink")}
            </Text>{" "}
            {t("auth.phoneAuth.andText")}{" "}
            <Text
              style={styles.infoLink}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            >
              {t("auth.phoneAuth.privacyLink")}
            </Text>
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
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  languageContainer: {
    alignItems: "flex-end",
    marginBottom: 20,
  },
  header: {
    marginBottom: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
  },
  // EMAIL AUTH DISABLED - Uncomment to re-enable email login styles
  // emailOption: {
  //   marginTop: 28,
  //   alignItems: "center",
  // },
  // emailOptionText: {
  //   fontSize: 14,
  //   color: colors.text.secondary,
  //   textAlign: "center",
  //   lineHeight: 22,
  // },
  // emailOptionLink: {
  //   color: colors.primary,
  //   fontWeight: "600",
  // },
  // backToPhone: {
  //   alignSelf: "flex-start",
  //   paddingVertical: 4,
  //   paddingRight: 8,
  // },
  // backToPhoneText: {
  //   fontSize: 15,
  //   color: colors.primary,
  //   fontWeight: "600",
  // },
  info: {
    marginTop: "auto",
  },
  infoText: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  infoLink: {
    color: colors.primary,
    fontWeight: "500",
  },
});
