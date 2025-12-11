import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { RootStackParamList } from "../types/navigation";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import {
  eventsApi,
  EventType,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
} from "../lib/api";

type CreateEventScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateEvent"
>;

interface CreateEventScreenProps {
  navigation: CreateEventScreenNavigationProp;
}

const EVENT_TYPES: EventType[] = [
  "SHEVA_BERAKHOT",
  "SHABBAT",
  "BRIT_MILA",
  "BAR_MITZVAH",
  "OTHER",
];

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({
  navigation,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("SHEVA_BERAKHOT");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const handleCreate = async () => {
    if (!title || !date || !time || !address || !city) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      // Geocode the address
      setGeocoding(true);
      const fullAddress = `${address}, ${city}`;
      const geocodeResult = await Location.geocodeAsync(fullAddress);
      setGeocoding(false);

      if (geocodeResult.length === 0) {
        Alert.alert(
          "Erreur",
          "Adresse introuvable. Veuillez vérifier l'adresse."
        );
        setLoading(false);
        return;
      }

      const { latitude, longitude } = geocodeResult[0];

      const dateTime = new Date(`${date}T${time}`);

      await eventsApi.create({
        title,
        description: description || undefined,
        type,
        date: dateTime.toISOString(),
        address,
        city,
        latitude,
        longitude,
        maxParticipants: parseInt(maxParticipants) || 10,
      });

      Alert.alert("Succès", "Événement créé avec succès!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert("Erreur", error.message || "Impossible de créer l'événement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel événement</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Type d'événement</Text>
        <View style={styles.typeGrid}>
          {EVENT_TYPES.map((eventType) => (
            <TouchableOpacity
              key={eventType}
              style={[
                styles.typeButton,
                type === eventType && styles.typeButtonActive,
              ]}
              onPress={() => setType(eventType)}
            >
              <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[eventType]}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === eventType && styles.typeLabelActive,
                ]}
              >
                {EVENT_TYPE_LABELS[eventType]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Titre *"
          placeholder="Ex: Minyan Shaharit"
          value={title}
          onChangeText={setTitle}
        />

        <Input
          label="Description"
          placeholder="Détails supplémentaires..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Input
              label="Date *"
              placeholder="YYYY-MM-DD"
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Heure *"
              placeholder="HH:MM"
              value={time}
              onChangeText={setTime}
            />
          </View>
        </View>

        <Input
          label="Adresse *"
          placeholder="123 Rue Example"
          value={address}
          onChangeText={setAddress}
        />

        <Input
          label="Ville *"
          placeholder="Paris"
          value={city}
          onChangeText={setCity}
        />

        <Input
          label="Nombre de participants max"
          placeholder="10"
          value={maxParticipants}
          onChangeText={setMaxParticipants}
          keyboardType="number-pad"
        />

        <View style={styles.participantsInfo}>
          <Text style={styles.participantsInfoText}>
            💡 Pour un Minyan, 10 hommes sont nécessaires
          </Text>
        </View>

        <Button
          title={geocoding ? "Géolocalisation..." : "Créer l'événement"}
          onPress={handleCreate}
          loading={loading}
          style={styles.createButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    fontSize: 16,
    color: "#4F46E5",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
  },
  typeButtonActive: {
    backgroundColor: "#EEF2FF",
    borderColor: "#4F46E5",
  },
  typeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeLabelActive: {
    color: "#4F46E5",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  participantsInfo: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  participantsInfoText: {
    fontSize: 14,
    color: "#92400E",
  },
  createButton: {
    marginTop: 8,
  },
});
