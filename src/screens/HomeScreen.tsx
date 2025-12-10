import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "../components/Button";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Home"
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const handleSignOut = () => {
    navigation.replace("SignIn");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to MinyanNow!</Text>
      <Text style={styles.subtitle}>You are logged in</Text>
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
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
  },
});
