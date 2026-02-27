import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { I18nextProvider } from "react-i18next";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/components/NotificationProvider";
import { PendingRequestsProvider } from "./src/context/PendingRequestsContext";
import i18n, { initializeLanguage } from "./src/lib/i18n";
import { SplashScreen } from "./src/components/SplashScreen";

export default function App() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    // Initialise la langue sauvegardée
    initializeLanguage()
      .then(() => {
        setIsI18nReady(true);
      })
      .catch((error) => {
        console.error("Error initializing i18n:", error);
        // Continue even if i18n initialization fails
        setIsI18nReady(true);
      });
  }, []);

  if (!isI18nReady) {
    return (
      <SplashScreen
        onFinish={() => {
          // This callback is called by SplashScreen after 2.5s
          // But we actually wait for i18n to be ready, so this is just a no-op
          // The real transition happens when isI18nReady becomes true
        }}
      />
    );
  }

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <PendingRequestsProvider>
          <NotificationProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </NotificationProvider>
        </PendingRequestsProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
