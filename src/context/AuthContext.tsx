import React, { createContext, useContext, ReactNode } from "react";
import { signIn, signUp, signOut, useSession } from "../lib/auth-client";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, isPending } = useSession();

  const handleSignIn = async (email: string, password: string) => {
    const result = await signIn.email({ email, password });
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  };

  const handleSignUp = async (
    email: string,
    password: string,
    name: string
  ) => {
    const result = await signUp.email({ email, password, name });
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user as User | null,
        isLoading: isPending,
        isAuthenticated: !!session?.user,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
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
