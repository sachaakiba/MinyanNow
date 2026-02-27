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
  Image,
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
import { useTranslation } from "react-i18next";
import { RootStackParamList, TabParamList } from "../types/navigation";
import { eventsApi, requestsApi, Event, EventRequest } from "../lib/api";
import { ClusterMarker } from "../components/ClusterMarker";
import { EventCarousel } from "../components/EventCarousel";
import { EventListView } from "../components/EventListView";
import { clusterEvents, getGridSizeForZoom, Cluster } from "../lib/clustering";
import { useAuth } from "../context/AuthContext";
import { CompositeNavigationProp } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { colors } from "../lib/colors";

const { width, height } = Dimensions.get("window");

type ViewMode = "map" | "list";

type MapScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, "Home">,
  NativeStackNavigationProp<RootStackParamList>
>;

interface MapScreenProps {
  navigation: MapScreenNavigationProp;
}

export const MapScreen: React.FC<MapScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [events, setEvents] = useState<Event[]>([]);
  const [myRequests, setMyRequests] = useState<EventRequest[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [locationDenied, setLocationDenied] = useState(false);

  const clusters = useMemo(() => {
    const gridSize = currentRegion
      ? getGridSizeForZoom(currentRegion.latitudeDelta)
      : 1;
    return clusterEvents(events, gridSize);
  }, [events, currentRegion?.latitudeDelta]);

  const requestedEventIds = useMemo(() => {
    return new Set(myRequests.map((req) => req.eventId));
  }, [myRequests]);

  useFocusEffect(
    useCallback(() => {
      loadLocationAndEvents();
    }, [])
  );

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
        setLocationDenied(true);
        setViewMode("list");
        // Fetch events without location filter
        const [fetchedEvents, fetchedRequests] = await Promise.all([
          eventsApi.getAll(),
          requestsApi.getMyRequests(),
        ]);
        setEvents(fetchedEvents);
        setMyRequests(fetchedRequests);
        setLoading(false);
        return;
      }

      setLocationDenied(false);
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      const [fetchedEvents, fetchedRequests] = await Promise.all([
        eventsApi.getAll({
          lat: currentLocation.coords.latitude,
          lng: currentLocation.coords.longitude,
          radius: 50,
        }),
        requestsApi.getMyRequests(),
      ]);

      console.log("Fetched events:", fetchedEvents.length);
      setEvents(fetchedEvents);
      setMyRequests(fetchedRequests);
    } catch (err) {
      console.error("Error loading data:", err);
      setError(t("map.loadError"));
    } finally {
      setLoading(false);
    }
  };

  const handleClusterPress = (cluster: Cluster) => {
    console.log("Cluster pressed:", cluster.events.length, "events");
    setSelectedCluster(cluster);

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
      setSelectedCluster(null);
      loadLocationAndEvents();
    } catch (error: any) {
      console.error("Error joining event:", error);
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

  const toggleViewMode = () => {
    setSelectedCluster(null);
    setViewMode((prev) => (prev === "map" ? "list" : "map"));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t("map.loading")}</Text>
      </View>
    );
  }

  if (error && !events.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadLocationAndEvents}
        >
          <Text style={styles.retryButtonText}>{t("map.retry")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {viewMode === "map" ? (
        <>
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
              const radiusMeters = cluster.radiusDeg * 111000;
              const isUrgent = cluster.hasUrgent;

              return (
                <React.Fragment key={cluster.id}>
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
        </>
      ) : (
        <View style={styles.listContainer}>
          <EventListView
            events={events}
            loading={loading}
            onEventPress={handleEventPress}
            onRefresh={loadLocationAndEvents}
          />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/rabin.png")}
            style={styles.headerLogo}
          />
          <Text style={styles.headerTitle}>{t("map.title")}</Text>
        </View>
        <View style={styles.headerRight}>
          {!locationDenied && (
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={toggleViewMode}
            >
              <Text style={styles.toggleButtonText}>
                {viewMode === "map" ? "☰" : "🗺"}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadLocationAndEvents}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Create Button */}
      <TouchableOpacity
        style={styles.floatingCreateButton}
        onPress={() => navigation.navigate("CreateEvent")}
      >
        <Text style={styles.floatingCreateButtonText}>＋</Text>
      </TouchableOpacity>
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
  listContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    paddingTop: 110,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.primary,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.text.inverse,
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 8,
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.primary,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  toggleButton: {
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
  toggleButtonText: {
    fontSize: 20,
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
  floatingCreateButton: {
    position: "absolute",
    bottom: 80,
    right: 10,
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingCreateButtonText: {
    fontSize: 32,
    color: colors.text.inverse,
    fontWeight: "300",
    marginTop: -2,
  },
  carouselContainer: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
  },
});
