import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { PhoneAuthScreen } from "../screens/PhoneAuthScreen";
import { OTPVerificationScreen } from "../screens/OTPVerificationScreen";
import { CompleteProfileScreen } from "../screens/CompleteProfileScreen";
import { MapScreen } from "../screens/MapScreen";
import { CreateEventScreen } from "../screens/CreateEventScreen";
import { EventDetailScreen } from "../screens/EventDetailScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MyParticipationsScreen } from "../screens/MyParticipationsScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { SplashScreen } from "../components/SplashScreen";
import { IDUploadModal } from "../components";
import { RootStackParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const {
    isAuthenticated,
    isLoading,
    isProfileComplete,
    hasIdDocument,
    refreshSession,
  } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Show ID upload modal for users with complete profile but no ID document
  const showIdUploadModal =
    isAuthenticated && isProfileComplete && !hasIdDocument;

  // Show splash screen on first load
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <SplashScreen onFinish={() => {}} />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {!isAuthenticated ? (
            // Non connecté: écrans d'authentification
            <>
              <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
              <Stack.Screen
                name="OTPVerification"
                component={OTPVerificationScreen}
              />
            </>
          ) : !isProfileComplete ? (
            // Connecté mais profil incomplet
            <>
              <Stack.Screen
                name="CompleteProfile"
                component={CompleteProfileScreen}
              />
            </>
          ) : (
            // Connecté et profil complet: app principale
            <>
              <Stack.Screen name="Home" component={MapScreen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen
                name="MyParticipations"
                component={MyParticipationsScreen}
              />
              <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Modal obligatoire pour les utilisateurs existants sans pièce d'identité */}
      <IDUploadModal
        visible={showIdUploadModal}
        isRequired={true}
        onClose={() => {}}
        onSuccess={() => {
          refreshSession();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
