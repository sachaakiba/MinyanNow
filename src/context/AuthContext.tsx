import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  sendOTP,
  verifyOTP,
  signOut,
  useSession,
  updateProfile,
} from "../lib/auth-client";
import { usersApi } from "../lib/api";

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
  synagogue?: string | null;
  profileCompleted?: boolean;
  idDocumentUrl?: string | null;
  idUploadedAt?: string | null;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  hebrewName?: string;
  dateOfBirth: string;
  synagogue?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  hasIdDocument: boolean;
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
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const sessionUser = session?.user as User | null;

  // Fetch full user profile when session is available
  const fetchUserProfile = useCallback(async () => {
    if (!sessionUser?.id) {
      setUserProfile(null);
      return;
    }

    setProfileLoading(true);
    try {
      const profile = await usersApi.getMe();
      setUserProfile({
        ...sessionUser,
        ...profile,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(sessionUser);
    } finally {
      setProfileLoading(false);
    }
  }, [sessionUser?.id]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const user = userProfile || sessionUser;
  const isProfileComplete = !!user?.profileCompleted;
  const hasIdDocument = !!user?.idDocumentUrl;

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
      // Refresh session and user profile to get updated user data
      refetch();
      await fetchUserProfile();
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
    fetchUserProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending || profileLoading,
        isAuthenticated: !!sessionUser,
        isProfileComplete,
        hasIdDocument,
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
