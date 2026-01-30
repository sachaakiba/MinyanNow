import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  Input,
  Button,
  AlertModal,
  useAlert,
  LanguageSelector,
} from "../components";
import { CountrySelector } from "../components/CountrySelector";
import { PhoneInput } from "../components/PhoneInput";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/colors";
import { AuthMethod, CountryCode, PHONE_COUNTRIES } from "../types/auth";

type AuthScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Auth"
>;

interface AuthScreenProps {
  navigation: AuthScreenNavigationProp;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { sendOTP, sendEmailOTP } = useAuth();
  const { alertState, showAlert, hideAlert } = useAlert();

  const [authMode, setAuthMode] = useState<AuthMethod>("phone");

  // Phone state
  const [country, setCountry] = useState<CountryCode>("FR");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Email state
  const [email, setEmail] = useState("");

  // Shared state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhone = () => {
    const digits = phoneNumber.replace(/\D/g, "");
    const config = PHONE_COUNTRIES[country];

    if (!digits) {
      setError(t("auth.phoneAuth.invalidPhone"));
      return false;
    }

    if (digits.length !== config.length) {
      setError(t("auth.phoneAuth.invalidPhone"));
      return false;
    }

    if (config.startsWith && !digits.startsWith(config.startsWith)) {
      setError(t("auth.phoneAuth.invalidPhone"));
      return false;
    }

    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setError(t("auth.emailAuth.invalidEmail"));
      return false;
    }

    if (email.endsWith("@phone.minyannow.app")) {
      setError(t("auth.emailAuth.invalidEmail"));
      return false;
    }

    return true;
  };

  const handleSendPhoneOTP = async () => {
    if (!validatePhone()) return;

    setLoading(true);
    try {
      const digits = phoneNumber.replace(/\D/g, "");
      const internationalPhone =
        PHONE_COUNTRIES[country].toInternational(digits);
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

  const handleSendEmailOTP = async () => {
    if (!validateEmail()) return;

    setLoading(true);
    try {
      const result = await sendEmailOTP(email);

      if (result.success) {
        navigation.navigate("OTPVerification", {
          authMethod: "email",
          identifier: email,
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

  const switchMode = () => {
    setError(null);
    setAuthMode(authMode === "phone" ? "email" : "phone");
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

        {/* Form — phone first, clean layout */}
        <View style={styles.form}>
          {authMode === "phone" ? (
            <>
              <CountrySelector value={country} onChange={setCountry} />
              <View style={styles.spacer} />
              <PhoneInput
                country={country}
                value={phoneNumber}
                onChange={(value) => {
                  setPhoneNumber(value);
                  setError(null);
                }}
                error={error || undefined}
                label={t("auth.phoneAuth.phoneLabel")}
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
              {/* Email option: subtle line below main CTA */}
              <View style={styles.emailOption}>
                <Text style={styles.emailOptionText}>
                  {t("auth.switch.connectByEmail")}{" "}
                  <Text style={styles.emailOptionLink} onPress={switchMode}>
                    {t("auth.switch.connectByEmailLink")}
                  </Text>
                </Text>
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                onPress={switchMode}
                style={styles.backToPhone}
                activeOpacity={0.7}
              >
                <Text style={styles.backToPhoneText}>
                  ← {t("auth.switch.usePhone")}
                </Text>
              </TouchableOpacity>
              <View style={styles.spacer} />
              <Input
                label={t("auth.emailAuth.emailLabel")}
                placeholder={t("auth.emailAuth.emailPlaceholder")}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError(null);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error || undefined}
              />
              <Button
                title={
                  loading
                    ? t("auth.emailAuth.sendingCode")
                    : t("auth.emailAuth.continueButton")
                }
                onPress={handleSendEmailOTP}
                loading={loading}
                style={styles.button}
              />
            </>
          )}
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
  spacer: {
    height: 16,
  },
  button: {
    marginTop: 8,
  },
  emailOption: {
    marginTop: 28,
    alignItems: "center",
  },
  emailOptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emailOptionLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  backToPhone: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingRight: 8,
  },
  backToPhoneText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
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
