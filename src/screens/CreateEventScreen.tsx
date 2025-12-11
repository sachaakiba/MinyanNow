import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { RootStackParamList } from "../types/navigation";
import { Input, Button, AlertModal, useAlert } from "../components";
import {
  eventsApi,
  EventType,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_ICONS,
} from "../lib/api";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Debug: log the API key (remove in production)
console.log(
  "Google Maps API Key:",
  GOOGLE_MAPS_API_KEY ? "Present" : "Missing"
);

type CreateEventScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "CreateEvent"
>;

interface CreateEventScreenProps {
  navigation: CreateEventScreenNavigationProp;
}

const EVENT_TYPES: EventType[] = [
  "SHEVA_BERAKHOT",
  "BRIT_MILA",
  "MINCHA",
  "ARVIT",
  "OTHER",
];

export const CreateEventScreen: React.FC<CreateEventScreenProps> = ({
  navigation,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<EventType>("SHEVA_BERAKHOT");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<Date>(new Date());
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [loading, setLoading] = useState(false);

  // Participants initiaux (déjà présents)
  const [initialParticipants, setInitialParticipants] = useState<string[]>([]);
  const [newParticipantName, setNewParticipantName] = useState("");

  // Picker visibility states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const googlePlacesRef = useRef<any>(null);

  // Alert modal
  const { alertState, showAlert, hideAlert } = useAlert();

  // Nombre de places restantes à pourvoir
  const remainingSpots = parseInt(maxParticipants) - initialParticipants.length;

  const addParticipant = () => {
    const name = newParticipantName.trim();
    if (!name) return;
    if (initialParticipants.length >= parseInt(maxParticipants) - 1) {
      showAlert(
        "Maximum atteint",
        "Vous devez laisser au moins une place pour les demandes",
        undefined,
        "warning"
      );
      return;
    }
    setInitialParticipants([...initialParticipants, name]);
    setNewParticipantName("");
  };

  const removeParticipant = (index: number) => {
    setInitialParticipants(initialParticipants.filter((_, i) => i !== index));
  };

  const formatDate = (date: Date) => {
    const days = [
      "Dimanche",
      "Lundi",
      "Mardi",
      "Mercredi",
      "Jeudi",
      "Vendredi",
      "Samedi",
    ];
    const months = [
      "janvier",
      "février",
      "mars",
      "avril",
      "mai",
      "juin",
      "juillet",
      "août",
      "septembre",
      "octobre",
      "novembre",
      "décembre",
    ];
    return `${days[date.getDay()]} ${date.getDate()} ${
      months[date.getMonth()]
    } ${date.getFullYear()}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const onDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
    }
  };

  const handleCreate = async () => {
    if (
      !title ||
      !address ||
      !city ||
      latitude === null ||
      longitude === null
    ) {
      showAlert(
        "Erreur",
        "Veuillez remplir tous les champs obligatoires",
        undefined,
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const dateTime = new Date(selectedDate);
      dateTime.setHours(selectedTime.getHours());
      dateTime.setMinutes(selectedTime.getMinutes());
      dateTime.setSeconds(0);

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
        initialParticipants,
      });

      showAlert(
        "Succès",
        "Événement créé avec succès!",
        [{ text: "OK", onPress: () => navigation.goBack() }],
        "success"
      );
    } catch (error: any) {
      showAlert(
        "Erreur",
        error.message || "Impossible de créer l'événement",
        undefined,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderDatePicker = () => {
    if (!showDatePicker) return null;

    if (Platform.OS === "ios") {
      return (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
                locale="fr-FR"
                style={styles.iosDatePicker}
                themeVariant="light"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      );
    }

    // Android
    return (
      <DateTimePicker
        value={selectedDate}
        mode="date"
        display="default"
        onChange={onDateChange}
        minimumDate={new Date()}
      />
    );
  };

  const renderTimePicker = () => {
    if (!showTimePicker) return null;

    if (Platform.OS === "ios") {
      return (
        <Modal
          visible={showTimePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTimePicker(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalCancel}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Heure</Text>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalDone}>OK</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedTime}
                mode="time"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setSelectedTime(date);
                }}
                locale="fr-FR"
                style={styles.iosTimePicker}
                themeVariant="light"
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      );
    }

    // Android
    return (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        display="default"
        onChange={onTimeChange}
        is24Hour={true}
      />
    );
  };

  const renderAddressModal = () => (
    <Modal
      visible={showAddressModal}
      animationType="slide"
      onRequestClose={() => setShowAddressModal(false)}
    >
      <View style={styles.addressModalContainer}>
        <View style={styles.addressModalHeader}>
          <TouchableOpacity onPress={() => setShowAddressModal(false)}>
            <Text style={styles.addressModalCancel}>Annuler</Text>
          </TouchableOpacity>
          <Text style={styles.addressModalTitle}>Rechercher une adresse</Text>
          <View style={styles.placeholder} />
        </View>

        <GooglePlacesAutocomplete
          ref={googlePlacesRef}
          placeholder="Tapez une adresse..."
          onPress={(data, details = null) => {
            if (details) {
              // Extract address components
              const addressComponents = details.address_components;
              let streetNumber = "";
              let route = "";
              let cityName = "";

              addressComponents?.forEach((component) => {
                if (component.types.includes("street_number")) {
                  streetNumber = component.long_name;
                }
                if (component.types.includes("route")) {
                  route = component.long_name;
                }
                if (component.types.includes("locality")) {
                  cityName = component.long_name;
                }
              });

              const fullAddress = streetNumber
                ? `${streetNumber} ${route}`
                : route || data.description.split(",")[0];

              setAddress(fullAddress);
              setCity(cityName);
              setLatitude(details.geometry.location.lat);
              setLongitude(details.geometry.location.lng);
              setShowAddressModal(false);
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: "fr",
            types: "address",
          }}
          fetchDetails={true}
          enablePoweredByContainer={false}
          minLength={1}
          listViewDisplayed="auto"
          keyboardShouldPersistTaps="always"
          keepResultsAfterBlur={true}
          styles={{
            container: styles.googlePlacesContainer,
            textInputContainer: styles.googleTextInputContainer,
            textInput: styles.googleTextInput,
            listView: styles.googleListView,
            row: styles.googleRow,
            description: styles.googleDescription,
            separator: styles.googleSeparator,
            poweredContainer: { display: "none" },
          }}
          textInputProps={{
            autoFocus: true,
            placeholderTextColor: "#9CA3AF",
            returnKeyType: "search",
          }}
          debounce={200}
          onFail={(error) => console.error("Google Places Error:", error)}
          onNotFound={() => console.log("No results found")}
        />
      </View>
    </Modal>
  );

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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Type d'événement</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeSlider}
          style={styles.typeSliderContainer}
        >
          {EVENT_TYPES.map((eventType) => (
            <TouchableOpacity
              key={eventType}
              style={[
                styles.typeButton,
                type === eventType ? styles.typeButtonActive : null,
              ]}
              onPress={() => setType(eventType)}
            >
              <Text style={styles.typeIcon}>{EVENT_TYPE_ICONS[eventType]}</Text>
              <Text
                style={[
                  styles.typeLabel,
                  type === eventType ? styles.typeLabelActive : null,
                ]}
              >
                {EVENT_TYPE_LABELS[eventType]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input
          label="Titre *"
          placeholder="Ex: Sheva Berakhot David & Sarah"
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

        {/* Date & Time Pickers */}
        <Text style={styles.sectionTitle}>Date et heure</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.pickerButton, styles.halfInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerIcon}>📅</Text>
            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerLabel}>Date</Text>
              <Text style={styles.pickerValue}>{formatDate(selectedDate)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pickerButton, styles.halfInput]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.pickerIcon}>🕐</Text>
            <View style={styles.pickerTextContainer}>
              <Text style={styles.pickerLabel}>Heure</Text>
              <Text style={styles.pickerValue}>{formatTime(selectedTime)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Address Picker */}
        <Text style={styles.sectionTitle}>Lieu</Text>
        <TouchableOpacity
          style={styles.addressButton}
          onPress={() => setShowAddressModal(true)}
        >
          <Text style={styles.addressIcon}>📍</Text>
          <View style={styles.addressTextContainer}>
            {address ? (
              <>
                <Text style={styles.addressValue}>{address}</Text>
                <Text style={styles.addressCity}>{city}</Text>
              </>
            ) : (
              <Text style={styles.addressPlaceholder}>
                Rechercher une adresse...
              </Text>
            )}
          </View>
          <Text style={styles.addressArrow}>›</Text>
        </TouchableOpacity>

        {/* Participants déjà présents */}
        <Text style={styles.sectionTitle}>Personnes déjà présentes</Text>
        <Text style={styles.sectionSubtitle}>
          Ajoutez les noms des personnes qui seront déjà sur place
        </Text>

        <View style={styles.addParticipantRow}>
          <View style={styles.addParticipantInput}>
            <Input
              label=""
              placeholder="Nom du participant"
              value={newParticipantName}
              onChangeText={setNewParticipantName}
              autoCapitalize="words"
            />
          </View>
          <TouchableOpacity
            style={[
              styles.addParticipantBtn,
              !newParticipantName.trim() && styles.addParticipantBtnDisabled,
            ]}
            onPress={addParticipant}
            disabled={!newParticipantName.trim()}
          >
            <Text style={styles.addParticipantBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {initialParticipants.length > 0 && (
          <View style={styles.participantsList}>
            {initialParticipants.map((name, index) => (
              <View key={index} style={styles.participantItem}>
                <Text style={styles.participantName}>{name}</Text>
                <TouchableOpacity
                  style={styles.removeParticipantBtn}
                  onPress={() => removeParticipant(index)}
                >
                  <Text style={styles.removeParticipantBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {initialParticipants.length > 0 && (
          <View style={styles.currentCountInfo}>
            <Text style={styles.currentCountText}>
              👥 {initialParticipants.length} personne
              {initialParticipants.length > 1 ? "s" : ""} déjà présente
              {initialParticipants.length > 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* Nombre de personnes recherchées */}
        <Text style={styles.sectionTitle}>
          Combien de personnes recherchez-vous ?
        </Text>
        <Text style={styles.sectionSubtitle}>
          Indiquez le nombre de personnes supplémentaires dont vous avez besoin
        </Text>

        <View style={styles.participantsPicker}>
          <TouchableOpacity
            style={[
              styles.participantsBtn,
              remainingSpots <= 1 ? styles.participantsBtnDisabled : null,
            ]}
            onPress={() => {
              if (remainingSpots > 1)
                setMaxParticipants(String(parseInt(maxParticipants) - 1));
            }}
            disabled={remainingSpots <= 1}
          >
            <Text style={styles.participantsBtnText}>−</Text>
          </TouchableOpacity>

          <View style={styles.participantsValueContainer}>
            <Text style={styles.participantsValue}>{remainingSpots}</Text>
            <Text style={styles.participantsLabel}>
              personne{remainingSpots > 1 ? "s" : ""}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.participantsBtn,
              parseInt(maxParticipants) >= 10
                ? styles.participantsBtnDisabled
                : null,
            ]}
            onPress={() => {
              const current = parseInt(maxParticipants) || 10;
              if (current < 10) setMaxParticipants(String(current + 1));
            }}
            disabled={parseInt(maxParticipants) >= 10}
          >
            <Text style={styles.participantsBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.participantsSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Déjà présents</Text>
            <Text style={styles.summaryValue}>
              {initialParticipants.length}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Recherchés</Text>
            <Text style={[styles.summaryValue, styles.summaryHighlight]}>
              {remainingSpots}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowTotal]}>
            <Text style={styles.summaryLabelTotal}>Total pour le minyan</Text>
            <Text style={styles.summaryValueTotal}>{maxParticipants}</Text>
          </View>
        </View>

        <Button
          title="Créer l'événement"
          onPress={handleCreate}
          loading={loading}
          style={styles.createButton}
        />
      </ScrollView>

      {renderDatePicker()}
      {renderTimePicker()}
      {renderAddressModal()}

      {/* Alert Modal */}
      <AlertModal
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
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
    fontWeight: "500" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
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
    fontWeight: "600" as const,
    color: "#374151",
    marginBottom: 12,
    marginTop: 8,
  },
  typeSliderContainer: {
    marginHorizontal: -20,
    marginBottom: 24,
  },
  typeSlider: {
    paddingHorizontal: 20,
    gap: 10,
  },
  typeButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
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
    fontWeight: "500" as const,
  },
  typeLabelActive: {
    color: "#4F46E5",
  },
  row: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top" as const,
  },
  // Date/Time Picker Styles
  pickerButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pickerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerTextContainer: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 2,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
  // iOS Modal Picker Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: "#111827",
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: "#6B7280",
  },
  modalDone: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#4F46E5",
  },
  iosDatePicker: {
    height: 350,
    marginHorizontal: 8,
  },
  iosTimePicker: {
    height: 200,
  },
  // Address Styles
  addressButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  addressIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  addressTextContainer: {
    flex: 1,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
  },
  addressCity: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addressPlaceholder: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  addressArrow: {
    fontSize: 24,
    color: "#9CA3AF",
  },
  coordinatesInfo: {
    backgroundColor: "#D1FAE5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  coordinatesText: {
    fontSize: 14,
    color: "#065F46",
  },
  // Address Modal Styles
  addressModalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
  },
  addressModalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  addressModalCancel: {
    fontSize: 16,
    color: "#4F46E5",
  },
  addressModalTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#111827",
  },
  // Google Places Styles
  googlePlacesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  googleTextInputContainer: {
    backgroundColor: "transparent",
  },
  googleTextInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  googleListView: {
    marginTop: 8,
  },
  googleRow: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  googleDescription: {
    fontSize: 15,
    color: "#374151",
  },
  googleSeparator: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  participantsPicker: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  participantsBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#4F46E5",
    borderRadius: 24,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  participantsBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  participantsBtnText: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  participantsValueContainer: {
    flex: 1,
    alignItems: "center" as const,
  },
  participantsValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#111827",
  },
  participantsLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
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
  sectionSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
    marginTop: -8,
  },
  addParticipantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  addParticipantInput: {
    flex: 1,
  },
  addParticipantBtn: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 48,
    height: 48,
    backgroundColor: "#4F46E5",
    borderRadius: 12,
  },
  addParticipantBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  addParticipantBtnText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  participantsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  participantName: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  removeParticipantBtn: {
    width: 28,
    height: 28,
    backgroundColor: "#FEE2E2",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  removeParticipantBtnText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  participantsSummary: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  summaryHighlight: {
    color: "#4F46E5",
    fontSize: 16,
  },
  summaryRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#C7D2FE",
    marginBottom: 0,
  },
  summaryLabelTotal: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  summaryValueTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4F46E5",
  },
  currentCountInfo: {
    backgroundColor: "#DCFCE7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  currentCountText: {
    fontSize: 14,
    color: "#166534",
    fontWeight: "500",
  },
  createButton: {
    marginTop: 8,
  },
});
