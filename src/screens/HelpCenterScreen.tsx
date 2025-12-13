import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../types/navigation";
import { colors } from "../lib/colors";

// Activer LayoutAnimation sur Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type HelpCenterScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "HelpCenter"
>;

interface HelpCenterScreenProps {
  navigation: HelpCenterScreenNavigationProp;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_DATA: FAQItem[] = [
  // Compte et inscription
  {
    id: "1",
    category: "Compte",
    question: "Comment créer un compte sur MinyanNow ?",
    answer:
      "Pour créer un compte, ouvrez l'application et entrez votre numéro de téléphone. Vous recevrez un code de vérification par SMS. Une fois le code validé, complétez votre profil avec vos informations personnelles et téléchargez une pièce d'identité pour finaliser votre inscription.",
  },
  {
    id: "2",
    category: "Compte",
    question: "Pourquoi dois-je fournir une pièce d'identité ?",
    answer:
      "La vérification d'identité est essentielle pour garantir la sécurité de tous les participants aux événements. Elle permet aux organisateurs de vérifier l'identité des personnes qui souhaitent rejoindre leurs événements. Votre pièce d'identité est stockée de manière sécurisée et n'est visible que par les organisateurs des événements auxquels vous demandez à participer.",
  },
  {
    id: "3",
    category: "Compte",
    question: "Comment modifier mes informations personnelles ?",
    answer:
      "Rendez-vous dans l'onglet Profil, puis appuyez sur 'Modifier mes informations' ou accédez aux Paramètres > Modifier mon profil. Vous pourrez y modifier votre nom, prénom, nom hébraïque, date de naissance et synagogue habituelle.",
  },
  {
    id: "4",
    category: "Compte",
    question: "Comment supprimer mon compte ?",
    answer:
      "Pour supprimer votre compte, contactez-nous à minyannow.app+contact@gmail.com. Nous procéderons à la suppression de votre compte et de toutes vos données personnelles conformément à notre politique de confidentialité. Cette action est irréversible.",
  },

  // Événements
  {
    id: "5",
    category: "Événements",
    question: "Comment créer un événement ?",
    answer:
      "Depuis la carte, appuyez sur le bouton '+' en bas de l'écran. Remplissez les informations de votre événement : type (Shacharit, Minha, Arvit, etc.), titre, date, heure, lieu et nombre de participants souhaités. Votre événement sera visible par tous les utilisateurs à proximité.",
  },
  {
    id: "6",
    category: "Événements",
    question: "Comment rejoindre un événement ?",
    answer:
      "Parcourez la carte pour trouver des événements à proximité ou utilisez le carrousel en bas de l'écran. Appuyez sur un événement pour voir ses détails, puis sur 'Demander à participer'. L'organisateur recevra votre demande et pourra l'accepter ou la refuser après avoir vérifié votre identité.",
  },
  {
    id: "7",
    category: "Événements",
    question: "Pourquoi ma demande de participation a-t-elle été refusée ?",
    answer:
      "L'organisateur de l'événement a le droit d'accepter ou de refuser les demandes de participation. Les raisons peuvent varier : événement complet, vérification d'identité non concluante, ou autres critères définis par l'organisateur. N'hésitez pas à chercher d'autres événements similaires.",
  },
  {
    id: "8",
    category: "Événements",
    question: "Comment annuler ma participation à un événement ?",
    answer:
      "Rendez-vous dans l'onglet 'Événements', puis dans 'Participations'. Trouvez l'événement concerné et appuyez sur 'Annuler ma participation'. Par courtoisie, prévenez l'organisateur si possible, surtout si l'événement est proche.",
  },
  {
    id: "9",
    category: "Événements",
    question: "Comment modifier ou supprimer un événement que j'ai créé ?",
    answer:
      "Dans l'onglet 'Événements', accédez à 'Mes événements'. Sélectionnez l'événement que vous souhaitez modifier ou supprimer. Vous pouvez modifier les détails ou supprimer l'événement. Les participants acceptés seront notifiés des modifications.",
  },

  // Notifications
  {
    id: "10",
    category: "Notifications",
    question: "Comment activer les notifications de proximité ?",
    answer:
      "Allez dans Paramètres > Préférences de notifications. Activez 'Événements à proximité' et définissez le rayon de détection souhaité (de 100m à 2km). Vous serez notifié lorsqu'un événement se déroule près de vous.",
  },
  {
    id: "11",
    category: "Notifications",
    question: "Je ne reçois pas de notifications, que faire ?",
    answer:
      "Vérifiez que les notifications sont activées dans les paramètres de l'application ET dans les paramètres de votre téléphone. Assurez-vous également que l'application a l'autorisation d'accéder à votre position si vous souhaitez recevoir des notifications de proximité.",
  },
  {
    id: "12",
    category: "Notifications",
    question: "Comment désactiver certaines notifications ?",
    answer:
      "Dans Paramètres > Préférences de notifications, vous pouvez personnaliser chaque type de notification : événements à proximité, nouvelles demandes (pour les organisateurs), statut de vos demandes, modifications d'événements et rappels.",
  },

  // Sécurité et confidentialité
  {
    id: "13",
    category: "Sécurité",
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Oui, nous prenons la sécurité de vos données très au sérieux. Toutes les communications sont chiffrées (HTTPS), votre pièce d'identité est stockée de manière sécurisée sur des serveurs certifiés, et l'accès à vos informations est strictement limité.",
  },
  {
    id: "14",
    category: "Sécurité",
    question: "Qui peut voir ma pièce d'identité ?",
    answer:
      "Seuls les organisateurs des événements auxquels vous demandez à participer peuvent voir votre pièce d'identité, et uniquement au moment de valider votre demande. Elle n'est pas visible par les autres participants ni stockée de manière accessible publiquement.",
  },
  {
    id: "15",
    category: "Sécurité",
    question: "Comment signaler un comportement inapproprié ?",
    answer:
      "Si vous êtes témoin ou victime d'un comportement inapproprié, contactez-nous immédiatement à minyannow.app+contact@gmail.com. Décrivez la situation avec le plus de détails possible. Nous prendrons les mesures nécessaires, pouvant aller jusqu'à la suspension du compte concerné.",
  },
];

const CATEGORIES = [
  "Tout",
  "Compte",
  "Événements",
  "Notifications",
  "Sécurité",
];

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({
  navigation,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Tout");

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredFAQ =
    selectedCategory === "Tout"
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre d'aide</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category &&
                    styles.categoryChipTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>
            Comment pouvons-nous vous aider ?
          </Text>
          <Text style={styles.introText}>
            Consultez les questions fréquentes ci-dessous ou contactez-nous si
            vous ne trouvez pas la réponse à votre question.
          </Text>
        </View>

        {/* FAQ List */}
        <View style={styles.faqSection}>
          {filteredFAQ.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.faqItem}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <View style={styles.faqQuestionContainer}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                </View>
                <Text style={styles.faqExpandIcon}>
                  {expandedId === item.id ? "−" : "+"}
                </Text>
              </View>
              {expandedId === item.id && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>
            Vous n'avez pas trouvé de réponse ?
          </Text>
          <Text style={styles.contactText}>
            Notre équipe est là pour vous aider. N'hésitez pas à nous contacter.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => navigation.navigate("ContactUs")}
          >
            <Text style={styles.contactButtonText}>Nous contacter</Text>
          </TouchableOpacity>
        </View>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 20,
    color: "#374151",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  placeholder: {
    width: 40,
  },
  categoriesContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  introSection: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  faqSection: {
    paddingHorizontal: 16,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  faqQuestionContainer: {
    flex: 1,
    marginRight: 12,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "uppercase",
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 22,
  },
  faqExpandIcon: {
    fontSize: 24,
    color: "#6B7280",
    fontWeight: "300",
  },
  faqAnswer: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  contactSection: {
    margin: 16,
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  contactText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    height: 40,
  },
});
