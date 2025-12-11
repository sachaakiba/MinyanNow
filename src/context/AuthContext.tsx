import React, { createContext, useContext, ReactNode } from "react";
import {
  sendOTP,
  verifyOTP,
  signOut,
  useSession,
  updateProfile,
} from "../lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  hebrewName?: string | null;
  dateOfBirth?: string | null;
  barMitzvahParasha?: string | null;
  synagogue?: string | null;
  community?: string | null;
  profileCompleted?: boolean;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  hebrewName?: string;
  dateOfBirth: string;
  barMitzvahParasha: string;
  synagogue?: string;
  community: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  sendOTP: (
    phoneNumber: string
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (
    phoneNumber: string,
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  completeProfile: (
    data: ProfileData
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, isPending, refetch } = useSession();

  const user = session?.user as User | null;
  const isProfileComplete = !!user?.profileCompleted;

  const handleSendOTP = async (phoneNumber: string) => {
    try {
      const result = await sendOTP({ phoneNumber });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de l'envoi du code",
      };
    }
  };

  const handleVerifyOTP = async (phoneNumber: string, code: string) => {
    try {
      const result = await verifyOTP({ phoneNumber, code });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Code invalide" };
    }
  };

  const handleCompleteProfile = async (data: ProfileData) => {
    try {
      const result = await updateProfile(data);
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      // Refresh session to get updated user data
      refetch();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erreur lors de la sauvegarde",
      };
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const refreshSession = () => {
    refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        isAuthenticated: !!user,
        isProfileComplete,
        sendOTP: handleSendOTP,
        verifyOTP: handleVerifyOTP,
        completeProfile: handleCompleteProfile,
        signOut: handleSignOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
