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
  sendEmailOTP,
  verifyEmailOTP,
  signOut,
  useSession,
  updateProfile,
} from "../lib/auth-client";
import { usersApi } from "../lib/api";

type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

interface User {
  id: string;
  email: string;
  name: string | null;
  phoneNumber?: string | null;
  phoneNumberVerified?: boolean;
  role?: "USER" | "SUPER_ADMIN";
  firstName?: string | null;
  lastName?: string | null;
  hebrewName?: string | null;
  dateOfBirth?: string | null;
  synagogue?: string | null;
  profileCompleted?: boolean;
  idDocumentUrl?: string | null;
  idUploadedAt?: string | null;
  idVerificationStatus?: VerificationStatus;
  idRejectionReason?: string | null;
  ketoubaDocumentUrl?: string | null;
  ketoubaUploadedAt?: string | null;
  ketoubaVerificationStatus?: VerificationStatus;
  ketoubaRejectionReason?: string | null;
  selfieDocumentUrl?: string | null;
  selfieUploadedAt?: string | null;
  selfieVerificationStatus?: VerificationStatus;
  selfieRejectionReason?: string | null;
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
  hasKetoubaDocument: boolean;
  hasSelfieDocument: boolean;
  hasAllDocuments: boolean;
  isSuperAdmin: boolean;
  sendOTP: (
    phoneNumber: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (
    phoneNumber: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  sendEmailOTP: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
  verifyEmailOTP: (
    email: string,
    code: string,
  ) => Promise<{ success: boolean; error?: string }>;
  completeProfile: (
    data: ProfileData,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, isPending, refetch } = useSession();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sessionUser = session?.user as User | null;

  // Fetch full user profile when session is available
  const fetchUserProfile = useCallback(
    async (isManualRefresh = false) => {
      if (!sessionUser?.id) {
        setUserProfile(null);
        return;
      }

      // Only set profileLoading for initial load, not for manual refresh
      if (!isManualRefresh) {
        setProfileLoading(true);
      }

      try {
        const profile = await usersApi.getMe();
        console.log("📱 Profile loaded:", profile);
        setUserProfile({
          ...sessionUser,
          ...profile,
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(sessionUser);
      } finally {
        if (!isManualRefresh) {
          setProfileLoading(false);
        }
      }
    },
    [sessionUser?.id],
  );

  // Charger le profil quand la session change
  useEffect(() => {
    if (sessionUser?.id) {
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  }, [sessionUser?.id]);

  const user = userProfile || sessionUser;

  // Attendre que le profil soit chargé avant de déterminer l'état
  // Si on a un sessionUser mais pas encore de userProfile, on est en chargement
  const isStillLoadingProfile = !!sessionUser?.id && !userProfile;

  // Only show loading if we have a session but profile is still loading
  // Don't show loading if user is not authenticated (to avoid flickering on login screen)
  const isLoadingState = sessionUser?.id
    ? isPending || profileLoading || isStillLoadingProfile
    : false;

  const isProfileComplete = !!userProfile?.profileCompleted;
  const hasIdDocument = !!userProfile?.idDocumentUrl;
  const hasKetoubaDocument = !!userProfile?.ketoubaDocumentUrl;
  const hasSelfieDocument = !!userProfile?.selfieDocumentUrl;
  const hasAllDocuments =
    hasIdDocument && hasKetoubaDocument && hasSelfieDocument;
  const isSuperAdmin =
    userProfile?.role === "SUPER_ADMIN" || sessionUser?.role === "SUPER_ADMIN";

  console.log("🔐 Auth state:", {
    isAuthenticated: !!sessionUser,
    isPending,
    profileLoading,
    isStillLoadingProfile,
    isProfileComplete,
    hasIdDocument,
    hasKetoubaDocument,
    hasSelfieDocument,
    hasAllDocuments,
    isSuperAdmin,
    userRole: userProfile?.role || sessionUser?.role,
    userProfile: userProfile
      ? {
          id: userProfile.id,
          role: userProfile.role,
          profileCompleted: userProfile.profileCompleted,
          idDocumentUrl: !!userProfile.idDocumentUrl,
          ketoubaDocumentUrl: !!userProfile.ketoubaDocumentUrl,
          selfieDocumentUrl: !!userProfile.selfieDocumentUrl,
        }
      : null,
  });

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

  const handleSendEmailOTP = async (email: string) => {
    try {
      const result = await sendEmailOTP({ email, type: "sign-in" });
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

  const handleVerifyEmailOTP = async (email: string, code: string) => {
    try {
      const result = await verifyEmailOTP({ email, otp: code });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      await refetch();
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
    fetchUserProfile(false);
  };

  const refreshProfile = async () => {
    // Use isManualRefresh=true to avoid affecting isLoading state
    await fetchUserProfile(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoadingState,
        isAuthenticated: !!sessionUser,
        isProfileComplete,
        hasIdDocument,
        hasKetoubaDocument,
        hasSelfieDocument,
        hasAllDocuments,
        isSuperAdmin,
        sendOTP: handleSendOTP,
        verifyOTP: handleVerifyOTP,
        sendEmailOTP: handleSendEmailOTP,
        verifyEmailOTP: handleVerifyEmailOTP,
        completeProfile: handleCompleteProfile,
        signOut: handleSignOut,
        refreshSession,
        refreshProfile,
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
