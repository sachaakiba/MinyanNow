import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import MapView, {
  Marker,
  Circle,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import * as Location from "expo-location";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../types/navigation";
import { eventsApi, requestsApi, Event, EventRequest } from "../lib/api";
import { ClusterMarker } from "../components/ClusterMarker";
import { EventCarousel } from "../components/EventCarousel";
import { clusterEvents, getGridSizeForZoom, Cluster } from "../lib/clustering";
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
  const [myRequests, setMyRequests] = useState<EventRequest[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [myPendingParticipationsCount, setMyPendingParticipationsCount] =
    useState(0);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);

  // Calcule les clusters basés sur les événements et le niveau de zoom
  const clusters = useMemo(() => {
    const gridSize = currentRegion
      ? getGridSizeForZoom(currentRegion.latitudeDelta)
      : 1;
    return clusterEvents(events, gridSize);
  }, [events, currentRegion?.latitudeDelta]);

  // Set des IDs des événements déjà demandés
  const requestedEventIds = useMemo(() => {
    return new Set(myRequests.map((req) => req.eventId));
  }, [myRequests]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadLocationAndEvents();
    }, [])
  );

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

  // Animation du carousel
  useEffect(() => {
    if (selectedCluster) {
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
  }, [selectedCluster]);

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

      // Fetch events, user's requests, and my events (for pending count) in parallel
      const [fetchedEvents, fetchedRequests, myEvents] = await Promise.all([
        eventsApi.getAll({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          radius: 50, // 50km radius
        }),
        requestsApi.getMyRequests(),
        eventsApi.getMyEvents(),
      ]);

      console.log("Fetched events:", fetchedEvents.length);
      setEvents(fetchedEvents);
      setMyRequests(fetchedRequests);

      // Calculate total pending requests for my events (to validate)
      const totalPending = myEvents.reduce(
        (acc, event) => acc + (event._count?.requests || 0),
        0
      );
      setPendingRequestsCount(totalPending);

      // Calculate my pending participations (waiting for approval)
      const myPendingCount = fetchedRequests.filter(
        (req) => req.status === "PENDING"
      ).length;
      setMyPendingParticipationsCount(myPendingCount);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleClusterPress = (cluster: Cluster) => {
    console.log("Cluster pressed:", cluster.events.length, "events");
    setSelectedCluster(cluster);

    // Centre la carte sur le cluster
    mapRef.current?.animateToRegion(
      {
        latitude: cluster.latitude,
        longitude: cluster.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      },
      300
    );
  };

  const handleEventPress = (event: Event) => {
    navigation.navigate("EventDetail", { eventId: event.id });
  };

  const handleRequestJoin = async (event: Event) => {
    setRequestLoading(true);
    try {
      await requestsApi.create(event.id);
      // Ferme le carousel et recharge les données
      setSelectedCluster(null);
      loadLocationAndEvents();
      // Navigate to participations to see the request
      navigation.navigate("MyParticipations");
    } catch (error: any) {
      console.error("Error joining event:", error);
      // If there's an error, navigate to detail page to see more info
      navigation.navigate("EventDetail", { eventId: event.id });
    } finally {
      setRequestLoading(false);
    }
  };

  const closeCarousel = () => {
    setSelectedCluster(null);
  };

  const handleRegionChange = (region: Region) => {
    setCurrentRegion(region);
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
        onPress={closeCarousel}
        onRegionChangeComplete={handleRegionChange}
      >
        {clusters.map((cluster) => {
          // Convertit le rayon en degrés vers mètres (1° ≈ 111km)
          const radiusMeters = cluster.radiusDeg * 111000;
          const isUrgent = cluster.hasUrgent;

          return (
            <React.Fragment key={cluster.id}>
              {/* Cercle de zone */}
              <Circle
                center={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                radius={radiusMeters}
                fillColor={
                  isUrgent
                    ? "rgba(245, 158, 11, 0.25)"
                    : "rgba(79, 70, 229, 0.25)"
                }
                strokeColor={
                  isUrgent
                    ? "rgba(245, 158, 11, 0.6)"
                    : "rgba(79, 70, 229, 0.6)"
                }
                strokeWidth={2}
              />
              {/* Marqueur avec le compteur au centre */}
              <Marker
                coordinate={{
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleClusterPress(cluster);
                }}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <ClusterMarker
                  count={cluster.events.length}
                  hasUrgent={cluster.hasUrgent}
                />
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Header - Logo only */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MinyanNow</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadLocationAndEvents}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => navigation.navigate("MyParticipations")}
        >
          <View style={styles.bottomBarIconContainer}>
            <Text style={styles.bottomBarIcon}>📋</Text>
            {myPendingParticipationsCount > 0 && (
              <View style={styles.bottomBarBadge}>
                <Text style={styles.bottomBarBadgeText}>
                  {myPendingParticipationsCount > 9
                    ? "9+"
                    : myPendingParticipationsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.bottomBarLabel}>Participations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <View style={styles.bottomBarCreateButton}>
            <Text style={styles.bottomBarCreateIcon}>＋</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBarItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.bottomBarIconContainer}>
            <Text style={styles.bottomBarIcon}>👤</Text>
            {pendingRequestsCount > 0 && (
              <View style={styles.bottomBarBadge}>
                <Text style={styles.bottomBarBadgeText}>
                  {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.bottomBarLabel}>Profil</Text>
        </TouchableOpacity>
      </View>

      {/* Event Carousel */}
      {selectedCluster && (
        <Animated.View
          style={[
            styles.carouselContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <EventCarousel
            events={selectedCluster.events}
            onEventPress={handleEventPress}
            onRequestJoin={handleRequestJoin}
            onClose={closeCarousel}
            isLoadingRequest={requestLoading}
            currentUserId={user?.id}
            requestedEventIds={requestedEventIds}
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
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  refreshButtonText: {
    fontSize: 20,
  },
  // Bottom Tab Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.98)",
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBarIconContainer: {
    position: "relative",
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBarIcon: {
    fontSize: 24,
  },
  bottomBarLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  bottomBarCreateButton: {
    width: 52,
    height: 52,
    backgroundColor: "#4F46E5",
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: -4,
  },
  bottomBarCreateIcon: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "300",
  },
  bottomBarBadge: {
    position: "absolute",
    top: 0,
    right: -2,
    minWidth: 18,
    height: 18,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  bottomBarBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  carouselContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
