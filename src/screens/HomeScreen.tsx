import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";

export const HomeScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MinyanNow!</Text>
      <Text style={styles.subtitle}>
        {user?.name ? `Hello, ${user.name}!` : "You are logged in"}
      </Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Button title="Sign Out" onPress={handleSignOut} variant="outline" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#374151",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 32,
  },
});
