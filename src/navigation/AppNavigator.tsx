import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthScreen } from "../screens/AuthScreen";
import { Map, CalendarDays, Shield } from "lucide-react-native";
import { OTPVerificationScreen } from "../screens/OTPVerificationScreen";
import { CompleteProfileScreen } from "../screens/CompleteProfileScreen";
import { UploadDocumentsScreen } from "../screens/UploadDocumentsScreen";
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
import { AdminDashboardScreen } from "../screens/AdminDashboardScreen";
import { SplashScreen } from "../components/SplashScreen";
import { RootStackParamList, TabParamList } from "../types/navigation";
import { useAuth } from "../context/AuthContext";
import { usePendingRequests } from "../context/PendingRequestsContext";
import { colors } from "../lib/colors";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

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
  const { user, isSuperAdmin } = useAuth();
  const { pendingCount, refreshPendingCount } = usePendingRequests();
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

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
                color={focused ? colors.primary : colors.text.tertiary}
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
              <View>
                <CalendarDays
                  size={26}
                  color={focused ? colors.primary : colors.text.tertiary}
                  strokeWidth={focused ? 2.5 : 2}
                />
                {pendingCount > 0 && (
                  <View style={styles.pendingDot}>
                    <Text style={styles.pendingDotText}>
                      {pendingCount > 9 ? "9+" : pendingCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ),
        }}
      />
      {isSuperAdmin && (
        <Tab.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItem}>
                <Shield
                  size={26}
                  color={focused ? colors.primary : colors.text.tertiary}
                  strokeWidth={focused ? 2.5 : 2}
                />
              </View>
            ),
          }}
        />
      )}
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
  const { isAuthenticated, isLoading, isProfileComplete, hasAllDocuments } =
    useAuth();
  const [showSplash, setShowSplash] = useState(true);

  // Remember if user has ever had all documents to prevent navigation stack changes
  const [hasEverHadAllDocuments, setHasEverHadAllDocuments] = useState(false);

  // Update if user now has all documents
  React.useEffect(() => {
    if (hasAllDocuments && !hasEverHadAllDocuments) {
      console.log("✅ User now has all documents, remembering this state");
      setHasEverHadAllDocuments(true);
    }
  }, [
    hasAllDocuments,
    hasEverHadAllDocuments,
    isProfileComplete,
    isAuthenticated,
  ]);

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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {!isAuthenticated ? (
          // Non connecté: écrans d'authentification
          <>
            <Stack.Screen name="Auth" component={AuthScreen} />
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
        ) : !hasAllDocuments && !hasEverHadAllDocuments ? (
          // Connecté, profil complet mais documents manquants (ID, Ketouba, Selfie)
          // Only show this screen if user has NEVER had all documents
          <>
            <Stack.Screen
              name="UploadDocuments"
              component={UploadDocumentsScreen}
            />
            <Stack.Screen
              name="UpdateIdDocument"
              component={UpdateIdDocumentScreen}
            />
          </>
        ) : (
          // Connecté, profil complet et pièce d'identité: app principale avec tabs
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
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  tabBar: {
    backgroundColor: colors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: colors.border.medium,
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
    backgroundColor: colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  profileAvatarFocused: {
    backgroundColor: colors.primary,
  },
  profileAvatarText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  pendingDot: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  pendingDotText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: "700",
  },
  profileAvatarTextFocused: {
    color: colors.text.inverse,
  },
});
