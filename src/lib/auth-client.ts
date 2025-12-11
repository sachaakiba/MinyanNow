import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { phoneNumberClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "minyannow",
      storagePrefix: "minyannow",
      storage: SecureStore,
    }),
    phoneNumberClient(),
  ],
});

export const { signOut, useSession } = authClient;

// Phone number authentication methods
export const sendOTP = authClient.phoneNumber.sendOtp;
export const verifyOTP = authClient.phoneNumber.verify;

// Profile update - utilise $fetch pour l'authentification automatique
interface ProfileData {
  firstName: string;
  lastName: string;
  hebrewName?: string;
  dateOfBirth: string;
  barMitzvahParasha: string;
  synagogue?: string;
  community: string;
}

export const updateProfile = async (data: ProfileData) => {
  try {
    const response = await authClient.$fetch(`${API_URL}/api/users/profile`, {
      method: "PUT",
      body: data, // $fetch gère automatiquement la sérialisation JSON
    });

    return { data: response.data };
  } catch (error: any) {
    console.error("updateProfile error:", error);
    return {
      error: {
        message: error.message || "Erreur lors de la sauvegarde",
      },
    };
  }
};
