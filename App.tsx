import React from "react";
import { StatusBar } from "expo-status-bar";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { NotificationProvider } from "./src/components/NotificationProvider";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </NotificationProvider>
    </AuthProvider>
  );
}
