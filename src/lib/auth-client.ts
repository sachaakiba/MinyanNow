import { createAuthClient } from "better-auth/react";

// API base URL - update this for production
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: API_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
