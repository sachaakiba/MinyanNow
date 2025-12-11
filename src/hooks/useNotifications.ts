import { useState, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { authClient } from "../lib/auth-client";

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
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setExpoPushToken(token);
          // Save token to server
          saveTokenToServer(token);
        }
      });

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
      };
    }
  }, [isAuthenticated]);

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

  const handleNotificationResponse = (data: Record<string, unknown>) => {
    // This will be handled by the navigation system
    // The data contains eventId, type, etc.
    console.log("Handle notification response:", data);
  };

  return {
    expoPushToken,
    notification,
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
      lightColor: "#4F46E5",
    });
  }

  return token;
}
