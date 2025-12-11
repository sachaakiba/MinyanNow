import { Expo, ExpoPushMessage } from "expo-server-sdk";

// Create a new Expo SDK client
const expo = new Expo();

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send a push notification to a single user
 */
export async function sendPushNotification(
  pushToken: string | null | undefined,
  notification: NotificationData
): Promise<boolean> {
  if (!pushToken) {
    console.log("No push token provided, skipping notification");
    return false;
  }

  // Check if the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return false;
  }

  const message: ExpoPushMessage = {
    to: pushToken,
    sound: "default",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Push notification sent:", ticketChunk);
    }
    
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

/**
 * Send push notifications to multiple users
 */
export async function sendPushNotifications(
  pushTokens: (string | null | undefined)[],
  notification: NotificationData
): Promise<void> {
  const validTokens = pushTokens.filter(
    (token): token is string => !!token && Expo.isExpoPushToken(token)
  );

  if (validTokens.length === 0) {
    console.log("No valid push tokens, skipping notifications");
    return;
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: "default" as const,
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  }));

  try {
    const chunks = expo.chunkPushNotifications(messages);
    
    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Push notifications sent:", ticketChunk);
    }
  } catch (error) {
    console.error("Error sending push notifications:", error);
  }
}

// Notification templates
export const NotificationTemplates = {
  // Pour l'organisateur
  newRequest: (participantName: string, eventTitle: string) => ({
    title: "Nouvelle demande 🙋",
    body: `${participantName} souhaite rejoindre "${eventTitle}"`,
  }),

  // Pour le participant
  requestAccepted: (eventTitle: string) => ({
    title: "Demande acceptée ✅",
    body: `Votre participation à "${eventTitle}" a été confirmée !`,
  }),

  requestRejected: (eventTitle: string) => ({
    title: "Demande refusée",
    body: `Votre demande pour "${eventTitle}" n'a pas été retenue`,
  }),

  // Pour tous les participants
  eventUpdated: (eventTitle: string) => ({
    title: "Événement modifié 📝",
    body: `"${eventTitle}" a été mis à jour`,
  }),

  eventCancelled: (eventTitle: string) => ({
    title: "Événement annulé ❌",
    body: `"${eventTitle}" a été annulé`,
  }),

  // Rappel
  eventReminder: (eventTitle: string, timeUntil: string) => ({
    title: "Rappel 🔔",
    body: `"${eventTitle}" commence ${timeUntil}`,
  }),

  // Événement complet
  eventFull: (eventTitle: string) => ({
    title: "Événement complet 🎉",
    body: `"${eventTitle}" a atteint le nombre de participants requis !`,
  }),
};
