import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";
import { eventsApi, requestsApi, Event, EVENT_TYPE_ICONS } from "../lib/api";
import { EventCard } from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

type MapScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface MapScreenProps {
  navigation: MapScreenNavigationProp;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocationAndEvents();
  }, []);

  // Center map on user location when it's available
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000
      );
    }
  }, [location]);

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        500
      );
    }
  };

  useEffect(() => {
    console.log("Selected event changed:", selectedEvent?.title);
    if (selectedEvent) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedEvent]);

  const loadLocationAndEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permission de localisation refusée");
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const fetchedEvents = await eventsApi.getAll({
        lat: currentLocation.coords.latitude,
        lng: currentLocation.coords.longitude,
        radius: 50, // 50km radius
      });
      console.log("Fetched events:", fetchedEvents.length);
      setEvents(fetchedEvents);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (event: Event) => {
    console.log("Marker pressed:", event.title);
    setSelectedEvent(event);
    mapRef.current?.animateToRegion(
      {
        latitude: event.latitude,
        longitude: event.longitude - 0.002, // Légèrement décalé pour voir la card
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      300
    );
  };

  const handleEventPress = () => {
    if (selectedEvent) {
      navigation.navigate("EventDetail", { eventId: selectedEvent.id });
    }
  };

  const [requestLoading, setRequestLoading] = useState(false);

  const handleRequestJoin = async () => {
    if (!selectedEvent) return;

    setRequestLoading(true);
    try {
      await requestsApi.create(selectedEvent.id);
      // Show success and close card
      setSelectedEvent(null);
      // Reload events to update the UI
      loadLocationAndEvents();
      // Navigate to participations to see the request
      navigation.navigate("MyParticipations");
    } catch (error: any) {
      console.error("Error joining event:", error);
      // If there's an error, navigate to detail page to see more info
      navigation.navigate("EventDetail", { eventId: selectedEvent.id });
    } finally {
      setRequestLoading(false);
    }
  };

  const closeCard = () => {
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadLocationAndEvents}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location?.coords.latitude || 48.8566,
          longitude: location?.coords.longitude || 2.3522,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
        onPress={closeCard}
      >
        {events.map((event) => {
          const needed = event.maxParticipants - event.currentCount;
          const isFull = needed <= 0;
          const isUrgent = needed <= 3 && needed > 0;

          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: event.latitude,
                longitude: event.longitude,
              }}
              onPress={(e) => {
                e.stopPropagation();
                handleMarkerPress(event);
              }}
              tracksViewChanges={false}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.marker,
                    isFull
                      ? styles.markerFull
                      : isUrgent
                      ? styles.markerUrgent
                      : styles.markerNormal,
                  ]}
                >
                  <Text style={styles.markerIcon}>
                    {EVENT_TYPE_ICONS[event.type]}
                  </Text>
                  <View style={styles.markerBadge}>
                    <Text style={styles.markerCount}>
                      {isFull ? "✓" : needed}
                    </Text>
                  </View>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MinyanNow</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("MyParticipations")}
          >
            <Text style={styles.headerButtonText}>📋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("CreateEvent")}
          >
            <Text style={styles.headerButtonText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={styles.headerButtonText}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Refresh button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadLocationAndEvents}
      >
        <Text style={styles.refreshButtonText}>🔄</Text>
      </TouchableOpacity>

      {/* Event Card */}
      {selectedEvent && (
        <Animated.View
          style={[
            styles.cardContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={closeCard}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <EventCard
            event={selectedEvent}
            onPress={handleEventPress}
            onRequestJoin={
              selectedEvent.organizerId !== user?.id
                ? handleRequestJoin
                : undefined
            }
            isLoading={requestLoading}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  header: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#4F46E5",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerButtonText: {
    fontSize: 20,
  },
  centerButton: {
    position: "absolute",
    right: 16,
    bottom: 400,
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  centerButtonText: {
    fontSize: 20,
  },
  refreshButton: {
    position: "absolute",
    right: 16,
    bottom: 340,
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  cardContainer: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
  },
  closeButton: {
    position: "absolute",
    top: -12,
    right: -12,
    zIndex: 10,
    width: 28,
    height: 28,
    backgroundColor: "#6B7280",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  legend: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6B7280",
  },
  markerContainer: {
    alignItems: "center",
  },
  marker: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerNormal: {
    backgroundColor: "#4F46E5",
  },
  markerUrgent: {
    backgroundColor: "#F59E0B",
  },
  markerFull: {
    backgroundColor: "#10B981",
  },
  markerIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  markerBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  markerCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
  },
});
