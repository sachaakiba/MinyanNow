import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Map, CalendarDays } from "lucide-react-native";
import { PhoneAuthScreen } from "../screens/PhoneAuthScreen";
import { OTPVerificationScreen } from "../screens/OTPVerificationScreen";
import { CompleteProfileScreen } from "../screens/CompleteProfileScreen";
import { MapScreen } from "../screens/MapScreen";
import { CreateEventScreen } from "../screens/CreateEventScreen";
import { EventDetailScreen } from "../screens/EventDetailScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { MyEventsScreen } from "../screens/MyEventsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { NotificationSettingsScreen } from "../screens/NotificationSettingsScreen";
import { EditProfileScreen } from "../screens/EditProfileScreen";
import { UpdateIdDocumentScreen } from "../screens/UpdateIdDocumentScreen";
import { TermsOfServiceScreen } from "../screens/TermsOfServiceScreen";
import { PrivacyPolicyScreen } from "../screens/PrivacyPolicyScreen";
import { HelpCenterScreen } from "../screens/HelpCenterScreen";
import { ContactUsScreen } from "../screens/ContactUsScreen";
import { SplashScreen } from "../components/SplashScreen";
import { IDUploadModal } from "../components";
import { RootStackParamList, TabParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Profile Avatar Tab Component
const ProfileTabIcon = ({
  focused,
  userName,
}: {
  focused: boolean;
  userName: string | null | undefined;
}) => {
  const initial = userName?.charAt(0)?.toUpperCase() || "?";
  return (
    <View style={styles.tabItem}>
      <View
        style={[styles.profileAvatar, focused && styles.profileAvatarFocused]}
      >
        <Text
          style={[
            styles.profileAvatarText,
            focused && styles.profileAvatarTextFocused,
          ]}
        >
          {initial}
        </Text>
      </View>
    </View>
  );
};

const MainTabs = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
        },
        tabBarShowLabel: false,
        tabBarItemStyle: {
          height: 60,
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Map
                size={26}
                color={focused ? "#111827" : "#9CA3AF"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyEvents"
        component={MyEventsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <CalendarDays
                size={26}
                color={focused ? "#111827" : "#9CA3AF"}
                strokeWidth={focused ? 2.5 : 2}
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <ProfileTabIcon
              focused={focused}
              userName={user?.firstName || user?.name}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

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
              <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
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
            // Connecté et profil complet: app principale avec tabs
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
              />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen
                name="UpdateIdDocument"
                component={UpdateIdDocumentScreen}
              />
              <Stack.Screen
                name="TermsOfService"
                component={TermsOfServiceScreen}
              />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
              />
              <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
              <Stack.Screen name="ContactUs" component={ContactUsScreen} />
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
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E7EB",
    elevation: 0,
    shadowOpacity: 0,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarFocused: {
    backgroundColor: "#111827",
  },
  profileAvatarText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  profileAvatarTextFocused: {
    color: "#FFFFFF",
  },
});
