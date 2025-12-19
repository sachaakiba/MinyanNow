import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MinyanNow",
  slug: "minyannow",
  scheme: "minyannow",
  version: "1.0.1-beta.1",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  splash: {
    image: "./assets/rabin.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  owner: "sachakiba",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.minyannow.app",
    icon: "./assets/rabin.png",
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "MinyanNow needs your location to display nearby events.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "MinyanNow needs your location in background to notify you about nearby events.",
      NSLocationAlwaysUsageDescription:
        "MinyanNow needs your location in background to notify you about nearby events.",
    },
  },
  android: {
    package: "com.minyannow.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    config: {
      googleMaps: {
        apiKey: GOOGLE_MAPS_API_KEY,
      },
    },
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./assets/icon.png",
        color: "#4F46E5",
      },
    ],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission:
          "MinyanNow needs your location in background to notify you about nearby events.",
        locationAlwaysPermission:
          "MinyanNow needs your location in background to notify you about nearby events.",
        locationWhenInUsePermission:
          "MinyanNow needs your location to display nearby events.",
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
  ],
  extra: {
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
    eas: {
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
