import prisma from "../../lib/prisma";
import { sendPushNotification, NotificationTemplates } from "./notifications";

// Track which events have already been reminded to avoid duplicates
const remindedEventIds = new Set<string>();

// Check interval: every 5 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Check for events starting in approximately 1 hour and send reminders
 * to all accepted participants (and the organizer) who have reminders enabled.
 */
async function checkAndSendReminders(): Promise<void> {
  try {
    const now = new Date();
    // Events starting between 55 and 65 minutes from now
    const reminderWindowStart = new Date(now.getTime() + 55 * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + 65 * 60 * 1000);

    // Find events in the reminder window that haven't been reminded yet
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            pushToken: true,
            notificationsEnabled: true,
            notifyEventReminders: true,
          },
        },
        requests: {
          where: { status: "ACCEPTED" },
          include: {
            user: {
              select: {
                id: true,
                pushToken: true,
                notificationsEnabled: true,
                notifyEventReminders: true,
              },
            },
          },
        },
      },
    });

    for (const event of events) {
      // Skip if already reminded
      if (remindedEventIds.has(event.id)) {
        continue;
      }

      console.log(`🔔 Sending 1h reminder for event "${event.title}" (${event.id})`);

      const notification = NotificationTemplates.eventReminder(
        event.title,
        "dans 1 heure"
      );

      // Send to organizer (if reminders enabled)
      if (
        event.organizer.notificationsEnabled &&
        event.organizer.notifyEventReminders &&
        event.organizer.pushToken
      ) {
        await sendPushNotification(event.organizer.pushToken, {
          ...notification,
          data: { type: "event_reminder", eventId: event.id },
        });
        console.log(`  ✅ Reminder sent to organizer (${event.organizer.id})`);
      }

      // Send to all accepted participants (if reminders enabled)
      for (const request of event.requests) {
        if (
          request.user.notificationsEnabled &&
          request.user.notifyEventReminders &&
          request.user.pushToken
        ) {
          await sendPushNotification(request.user.pushToken, {
            ...notification,
            data: { type: "event_reminder", eventId: event.id },
          });
          console.log(`  ✅ Reminder sent to participant (${request.user.id})`);
        }
      }

      // Mark as reminded
      remindedEventIds.add(event.id);
    }

    // Clean up old entries from the Set (events that have passed)
    // This prevents memory leaks over time
    if (remindedEventIds.size > 1000) {
      const activeEventIds = new Set(events.map((e) => e.id));
      for (const eventId of remindedEventIds) {
        if (!activeEventIds.has(eventId)) {
          remindedEventIds.delete(eventId);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error checking event reminders:", error);
  }
}

/**
 * Start the event reminder scheduler.
 * Checks every 5 minutes for events starting in ~1 hour.
 */
export function startEventReminderScheduler(): void {
  console.log("⏰ Event reminder scheduler started (checking every 5 minutes)");

  // Run immediately on startup
  checkAndSendReminders();

  // Then run every 5 minutes
  setInterval(checkAndSendReminders, CHECK_INTERVAL_MS);
}
