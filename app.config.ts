import "dotenv/config";
import { ExpoConfig, ConfigContext } from "expo/config";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MinyanNow",
  slug: "MinyanNow",
  scheme: "minyannow",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: false,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.minyannow.app",
    config: {
      googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "MinyanNow a besoin de votre localisation pour afficher les événements à proximité.",
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
  ],
  extra: {
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "66d64d92-4479-464f-b15e-3bf5db122e1a",
    },
  },
});
