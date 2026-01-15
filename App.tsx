import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/components/NotificationProvider";
import i18n, { initializeLanguage } from "./src/lib/i18n";
import { SplashScreen } from "./src/components/SplashScreen";

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    // Initialise la langue sauvegardée
    initializeLanguage().then(() => {
      setIsI18nReady(true);
    });
  }, []);

  if (!isI18nReady) {
    return (
      <SplashScreen
        onFinish={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <NotificationProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </NotificationProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
