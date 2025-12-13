import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Button, AlertModal, useAlert } from "../components";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { colors } from "../lib/colors";

type OTPVerificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OTPVerification"
>;

type OTPVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  "OTPVerification"
>;

interface OTPVerificationScreenProps {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTP_LENGTH = 6;

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { phoneNumber } = route.params;
  const { verifyOTP, sendOTP } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Alert modal
  const { alertState, showAlert, hideAlert } = useAlert();

  // Countdown pour le renvoi du code
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  // Focus sur le premier input au montage
  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    setError(null);

    // Gère le copier-coller du code complet
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const newOtp = [...otp];
      digits.split("").forEach((digit, i) => {
        if (i < OTP_LENGTH) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus sur le dernier input rempli ou le prochain vide
      const nextIndex = Math.min(digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Gère la saisie normale
    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Passe au prochain input si un chiffre est entré
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Gère la touche Backspace
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== OTP_LENGTH) {
      setError(t("auth.otp.invalidCode"));
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, code);

      if (result.success) {
        // La navigation vers Home sera automatique via AuthContext
      } else {
        setError(result.error || t("auth.otp.invalidCode"));
        // Réinitialise le code
        setOtp(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCountdown > 0) return;

    setResendLoading(true);
    try {
      const result = await sendOTP(phoneNumber);

      if (result.success) {
        setResendCountdown(60);
        showAlert(
          t("common.success"),
          t("auth.otp.resendLink"),
          undefined,
          "success"
        );
      } else {
        showAlert(
          t("common.error"),
          result.error || t("errors.generic"),
          undefined,
          "error"
        );
      }
    } catch (error) {
      showAlert(t("common.error"), t("errors.generic"), undefined, "error");
    } finally {
      setResendLoading(false);
    }
  };

  // Formate le numéro pour l'affichage
  const formatPhoneDisplay = (phone: string) => {
    // +33612345678 -> 06 12 34 56 78
    if (phone.startsWith("+33")) {
      const digits = "0" + phone.substring(3);
      return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
    }
    return phone;
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
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>{t("auth.otp.back")}</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{t("auth.otp.title")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.otp.subtitle")}
            {"\n"}
            <Text style={styles.phoneNumber}>
              {formatPhoneDisplay(phoneNumber)}
            </Text>
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
                error ? styles.otpInputError : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title={loading ? t("auth.otp.verifying") : t("common.confirm")}
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>{t("auth.otp.resendText")} </Text>
          {resendCountdown > 0 ? (
            <Text style={styles.resendCountdown}>
              {t("auth.otp.resendCountdown", { seconds: resendCountdown })}
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={resendLoading}
            >
              <Text style={styles.resendLink}>
                {resendLoading ? t("common.loading") : t("auth.otp.resendLink")}
              </Text>
            </TouchableOpacity>
          )}
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
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "500",
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    lineHeight: 24,
  },
  phoneNumber: {
    color: "#111827",
    fontWeight: "600",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  otpInputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    flexWrap: "wrap",
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendCountdown: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  resendLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});
