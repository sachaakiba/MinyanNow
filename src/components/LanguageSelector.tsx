import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../lib/colors";
import { LANGUAGES, LanguageCode, changeLanguage } from "../lib/i18n";

interface LanguageSelectorProps {
  // Mode compact pour afficher juste le bouton
  compact?: boolean;
  // Callback après changement de langue
  onLanguageChange?: (language: LanguageCode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  onLanguageChange,
}) => {
  const { t, i18n } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const currentLanguage = i18n.language as LanguageCode;

  const handleSelectLanguage = async (language: LanguageCode) => {
    if (language !== currentLanguage) {
      await changeLanguage(language);
      onLanguageChange?.(language);
    }
    setModalVisible(false);
  };

  const currentLang = LANGUAGES[currentLanguage] || LANGUAGES.fr;

  return (
    <>
      {/* Bouton pour ouvrir le sélecteur */}
      <TouchableOpacity
        style={[styles.trigger, compact && styles.triggerCompact]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.triggerFlag}>{currentLang.flag}</Text>
        {!compact && (
          <Text style={styles.triggerText}>{currentLang.nativeName}</Text>
        )}
      </TouchableOpacity>

      {/* Modal de sélection */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modal}>
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
                      <Text style={styles.languageFlag}>{lang.flag}</Text>
                      <View style={styles.languageInfo}>
                        <Text
                          style={[
                            styles.languageName,
                            isSelected && styles.languageNameSelected,
                          ]}
                        >
                          {lang.nativeName}
                        </Text>
                        {lang.name !== lang.nativeName && (
                          <Text style={styles.languageNameSecondary}>
                            {lang.name}
                          </Text>
                        )}
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
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
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  triggerCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 44,
    height: 44,
    justifyContent: "center",
    borderRadius: 22,
  },
  triggerFlag: {
    fontSize: 20,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modal: {
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
  languageFlag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  languageNameSelected: {
    color: colors.primary,
  },
  languageNameSecondary: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
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
