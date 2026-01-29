import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eventsApi, usersApi, Event, EVENT_TYPE_LABELS } from "../lib/api";

const NOTIFIED_EVENTS_KEY = "notified_proximity_events";
const LOCATION_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MIN_DISTANCE_BETWEEN_UPDATES = 100; // meters

interface ProximityConfig {
  enabled: boolean;
  radius: number; // in meters
}

interface NotifiedEvent {
  eventId: string;
  notifiedAt: number;
  eventDate: string;
}

class ProximityService {
  private locationSubscription: Location.LocationSubscription | null = null;
  private config: ProximityConfig = { enabled: false, radius: 500 };
  private lastNotifiedEvents: NotifiedEvent[] = [];
  private isRunning: boolean = false;

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Load previously notified events from storage
   */
  private async loadNotifiedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFIED_EVENTS_KEY);
      if (stored) {
        const events: NotifiedEvent[] = JSON.parse(stored);
        // Filter out old events (older than 24 hours or past events)
        const now = Date.now();
        this.lastNotifiedEvents = events.filter((e) => {
          const eventDate = new Date(e.eventDate).getTime();
          const notifiedRecently = now - e.notifiedAt < 24 * 60 * 60 * 1000;
          const eventNotPassed = eventDate > now;
          return notifiedRecently && eventNotPassed;
        });
        await this.saveNotifiedEvents();
      }
    } catch (error) {
      console.error("Error loading notified events:", error);
    }
  }

  /**
   * Save notified events to storage
   */
  private async saveNotifiedEvents(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        NOTIFIED_EVENTS_KEY,
        JSON.stringify(this.lastNotifiedEvents)
      );
    } catch (error) {
      console.error("Error saving notified events:", error);
    }
  }

  /**
   * Check if we already notified for this event
   */
  private wasAlreadyNotified(eventId: string): boolean {
    return this.lastNotifiedEvents.some((e) => e.eventId === eventId);
  }

  /**
   * Mark event as notified
   */
  private async markAsNotified(event: Event): Promise<void> {
    this.lastNotifiedEvents.push({
      eventId: event.id,
      notifiedAt: Date.now(),
      eventDate: event.date,
    });
    await this.saveNotifiedEvents();
  }

  /**
   * Send local notification for nearby event
   */
  private async sendProximityNotification(
    event: Event,
    distance: number
  ): Promise<void> {
    const distanceText =
      distance >= 1000
        ? `${(distance / 1000).toFixed(1)} km`
        : `${Math.round(distance)} m`;

    const eventDate = new Date(event.date);
    const timeText = eventDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${EVENT_TYPE_LABELS[event.type]} à proximité`,
        body: `"${event.title}" à ${distanceText} de vous, aujourd'hui à ${timeText}`,
        data: {
          type: "proximity",
          eventId: event.id,
        },
        sound: "default",
      },
      trigger: null, // Send immediately
    });

    console.log(`Proximity notification sent for event ${event.id}`);
  }

  /**
   * Check for nearby events and send notifications
   */
  private async checkNearbyEvents(
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      console.log(`📍 Checking nearby events at [${latitude}, ${longitude}]`);
      console.log(`🔍 Search radius: ${this.config.radius}m`);

      // Update user location on server
      await usersApi.updateLocation(latitude, longitude);

      // Get today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const events = await eventsApi.getAll({
        lat: latitude,
        lng: longitude,
        radius: this.config.radius / 1000, // Convert to km for API
      });

      console.log(`📅 Found ${events.length} events in API response`);

      // Filter events happening today that haven't started yet
      const now = new Date();
      const upcomingEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate < tomorrow;
      });

      console.log(`⏰ Found ${upcomingEvents.length} upcoming events today`);

      // Check proximity and send notifications
      for (const event of upcomingEvents) {
        if (this.wasAlreadyNotified(event.id)) {
          console.log(`⏭️  Event ${event.id} already notified, skipping`);
          continue;
        }

        const distance = this.calculateDistance(
          latitude,
          longitude,
          event.latitude,
          event.longitude
        );

        console.log(`📏 Event "${event.title}" is ${Math.round(distance)}m away`);

        if (distance <= this.config.radius) {
          console.log(`✅ Event within radius! Sending notification...`);
          await this.sendProximityNotification(event, distance);
          await this.markAsNotified(event);
        } else {
          console.log(`❌ Event outside radius (${Math.round(distance)}m > ${this.config.radius}m)`);
        }
      }

      if (upcomingEvents.length === 0) {
        console.log(`ℹ️  No upcoming events found today within ${this.config.radius}m`);
      }
    } catch (error) {
      console.error("❌ Error checking nearby events:", error);
    }
  }

  /**
   * Start the proximity monitoring service
   */
  async start(config: ProximityConfig): Promise<boolean> {
    if (this.isRunning) {
      console.log("Proximity service already running");
      return true;
    }

    this.config = config;

    if (!config.enabled) {
      console.log("Proximity notifications disabled");
      return false;
    }

    try {
      // Request location permissions
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        console.log("Foreground location permission not granted");
        return false;
      }

      // Request background location permission
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== "granted") {
        console.log(
          "Background location permission not granted, using foreground only"
        );
      }

      // Load previously notified events
      await this.loadNotifiedEvents();

      // Start location updates
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: LOCATION_UPDATE_INTERVAL,
          distanceInterval: MIN_DISTANCE_BETWEEN_UPDATES,
        },
        async (location) => {
          await this.checkNearbyEvents(
            location.coords.latitude,
            location.coords.longitude
          );
        }
      );

      this.isRunning = true;
      console.log(
        `Proximity service started with radius ${config.radius}m`
      );
      return true;
    } catch (error) {
      console.error("Error starting proximity service:", error);
      return false;
    }
  }

  /**
   * Stop the proximity monitoring service
   */
  stop(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
    this.isRunning = false;
    console.log("Proximity service stopped");
  }

  /**
   * Update the configuration
   */
  updateConfig(config: ProximityConfig): void {
    this.config = config;
    if (!config.enabled && this.isRunning) {
      this.stop();
    }
  }

  /**
   * Check if service is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Manually trigger a proximity check (useful for testing)
   */
  async checkNow(): Promise<void> {
    try {
      // TODO: Remove this hardcoded position after fixing location permissions
      // For now, using a test position (adjust to match your test event location)
      const testLatitude = 48.893241797111024;
      const testLongitude = 2.254294894555421;

      console.log("⚠️  Using hardcoded test position for development");
      await this.checkNearbyEvents(testLatitude, testLongitude);

      /* Original code - uncomment when permissions are fixed:
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await this.checkNearbyEvents(
        location.coords.latitude,
        location.coords.longitude
      );
      */
    } catch (error) {
      console.error("Error during manual proximity check:", error);
    }
  }
}

// Singleton instance
export const proximityService = new ProximityService();
