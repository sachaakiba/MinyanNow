import { useState, useEffect, useRef, useCallback } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { authClient } from "../lib/auth-client";
import { usersApi } from "../lib/api";
import { proximityService } from "../services/ProximityService";
import { navigationRef } from "../navigation/AppNavigator";
import { colors } from "../lib/colors";

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [proximityEnabled, setProximityEnabled] = useState(false);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  // Load notification preferences and start proximity service
  const initializeProximityService = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const prefs = await usersApi.getNotificationPreferences();
      
      if (prefs.notificationsEnabled && prefs.notifyProximity) {
        const started = await proximityService.start({
          enabled: true,
          radius: prefs.proximityRadius,
        });
        setProximityEnabled(started);
      } else {
        proximityService.stop();
        setProximityEnabled(false);
      }
    } catch (error) {
      console.error("Error initializing proximity service:", error);
    }
  }, [isAuthenticated]);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          // App came to foreground - check for nearby events
          if (proximityEnabled) {
            proximityService.checkNow();
          }
        }
        appState.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [proximityEnabled]);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setExpoPushToken(token);
          // Save token to server
          saveTokenToServer(token);
        }
      });

      // Initialize proximity service
      initializeProximityService();

      // Listen for incoming notifications
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          setNotification(notification);
        });

      // Listen for notification responses (when user taps on notification)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data;
          console.log("Notification tapped:", data);
          // Handle navigation based on notification data
          handleNotificationResponse(data);
        });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
        proximityService.stop();
      };
    }
  }, [isAuthenticated, initializeProximityService]);

  const saveTokenToServer = async (token: string) => {
    try {
      await authClient.$fetch(`${API_URL}/api/users/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pushToken: token }),
      });

      console.log("Push token saved to server");
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  };

  const pendingEventId = useRef<string | null>(null);

  const navigateToEvent = useCallback((eventId: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate("EventDetail", { eventId });
      pendingEventId.current = null;
    } else {
      pendingEventId.current = eventId;
    }
  }, []);

  useEffect(() => {
    if (!pendingEventId.current) return;
    const interval = setInterval(() => {
      if (navigationRef.isReady() && pendingEventId.current) {
        navigationRef.navigate("EventDetail", {
          eventId: pendingEventId.current,
        });
        pendingEventId.current = null;
        clearInterval(interval);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const eventId = response.notification.request.content.data
          ?.eventId as string | undefined;
        if (eventId) {
          navigateToEvent(eventId);
        }
      }
    });
  }, [navigateToEvent]);

  const handleNotificationResponse = (data: Record<string, unknown>) => {
    console.log("Handle notification response:", data);
    const eventId = data.eventId as string | undefined;
    if (eventId) {
      navigateToEvent(eventId);
    }
  };

  // Refresh proximity settings (call this after changing settings)
  const refreshProximitySettings = useCallback(async () => {
    await initializeProximityService();
  }, [initializeProximityService]);

  return {
    expoPushToken,
    notification,
    proximityEnabled,
    refreshProximitySettings,
  };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  // Must be a physical device
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permissions not granted");
    return null;
  }

  // Get the Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    // Only try to get token if we have a valid UUID projectId
    if (projectId && projectId.includes("-")) {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = tokenData.data;
      console.log("Expo push token:", token);
    } else {
      console.log("No valid projectId configured. Run 'eas init' to enable push notifications.");
    }
  } catch (error) {
    console.log("Push notifications not available:", error);
  }

  // Configure Android channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.primary,
    });
  }

  return token;
}
