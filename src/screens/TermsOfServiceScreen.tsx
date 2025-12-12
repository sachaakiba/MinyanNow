import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types/navigation";

type TermsOfServiceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TermsOfService"
>;

interface TermsOfServiceScreenProps {
  navigation: TermsOfServiceScreenNavigationProp;
}

const LAST_UPDATED = "11 décembre 2024";
const CONTACT_EMAIL = "minyannow.app+contact@gmail.com";
const COMPANY_NAME = "MinyanNow";

export const TermsOfServiceScreen: React.FC<TermsOfServiceScreenProps> = ({
  navigation,
}) => {
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
        <Text style={styles.headerTitle}>Conditions d'utilisation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.lastUpdated}>
            Dernière mise à jour : {LAST_UPDATED}
          </Text>
        </View>

        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            Bienvenue sur {COMPANY_NAME}. En accédant à notre application mobile
            ou en l'utilisant, vous acceptez d'être lié par les présentes
            Conditions d'utilisation. Si vous n'acceptez pas ces conditions,
            veuillez ne pas utiliser notre application.
          </Text>
          <Text style={styles.paragraph}>
            Ces conditions constituent un accord juridiquement contraignant
            entre vous (l'utilisateur) et {COMPANY_NAME}. Nous nous réservons le
            droit de modifier ces conditions à tout moment. Les modifications
            prendront effet dès leur publication dans l'application.
          </Text>
        </View>

        {/* Description du service */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description du service</Text>
          <Text style={styles.paragraph}>
            {COMPANY_NAME} est une application mobile permettant aux membres de
            la communauté juive de :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Créer et gérer des événements religieux (offices, minyanim,
              études, etc.)
            </Text>
            <Text style={styles.bulletItem}>
              • Découvrir des événements à proximité de leur position
              géographique
            </Text>
            <Text style={styles.bulletItem}>
              • Participer à des événements organisés par d'autres membres
            </Text>
            <Text style={styles.bulletItem}>
              • Recevoir des notifications sur les événements pertinents
            </Text>
          </View>
        </View>

        {/* Éligibilité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Éligibilité et inscription</Text>
          <Text style={styles.paragraph}>
            Pour utiliser {COMPANY_NAME}, vous devez :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Avoir au moins 13 ans (ou l'âge minimum requis dans votre pays)
            </Text>
            <Text style={styles.bulletItem}>
              • Fournir des informations exactes et à jour lors de l'inscription
            </Text>
            <Text style={styles.bulletItem}>
              • Disposer d'un numéro de téléphone valide pour la vérification
            </Text>
            <Text style={styles.bulletItem}>
              • Fournir une pièce d'identité valide pour la vérification de
              votre identité
            </Text>
          </View>
          <Text style={styles.paragraph}>
            La vérification d'identité est requise pour garantir la sécurité de
            tous les participants aux événements. Votre pièce d'identité est
            stockée de manière sécurisée et n'est accessible qu'aux
            organisateurs des événements auxquels vous souhaitez participer.
          </Text>
        </View>

        {/* Compte utilisateur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Compte utilisateur</Text>
          <Text style={styles.paragraph}>
            Vous êtes responsable de maintenir la confidentialité de vos
            identifiants de connexion et de toutes les activités effectuées sous
            votre compte. Vous vous engagez à :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Ne pas partager vos identifiants de connexion avec des tiers
            </Text>
            <Text style={styles.bulletItem}>
              • Nous informer immédiatement de tout accès non autorisé à votre
              compte
            </Text>
            <Text style={styles.bulletItem}>
              • Maintenir vos informations personnelles à jour
            </Text>
          </View>
        </View>

        {/* Règles de conduite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Règles de conduite</Text>
          <Text style={styles.paragraph}>
            En utilisant {COMPANY_NAME}, vous vous engagez à ne pas :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Créer de faux événements ou fournir des informations trompeuses
            </Text>
            <Text style={styles.bulletItem}>
              • Harceler, menacer ou intimider d'autres utilisateurs
            </Text>
            <Text style={styles.bulletItem}>
              • Publier du contenu illégal, offensant ou inapproprié
            </Text>
            <Text style={styles.bulletItem}>
              • Utiliser l'application à des fins commerciales non autorisées
            </Text>
            <Text style={styles.bulletItem}>
              • Tenter de contourner les mesures de sécurité de l'application
            </Text>
            <Text style={styles.bulletItem}>
              • Usurper l'identité d'une autre personne
            </Text>
            <Text style={styles.bulletItem}>
              • Collecter des données personnelles d'autres utilisateurs sans
              leur consentement
            </Text>
          </View>
        </View>

        {/* Événements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            6. Création et participation aux événements
          </Text>
          <Text style={styles.subSectionTitle}>
            6.1 Organisateurs d'événements
          </Text>
          <Text style={styles.paragraph}>
            En créant un événement, vous vous engagez à :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Fournir des informations exactes sur l'événement (lieu, horaire,
              type)
            </Text>
            <Text style={styles.bulletItem}>
              • Respecter les lois et réglementations locales applicables
            </Text>
            <Text style={styles.bulletItem}>
              • Vérifier l'identité des participants avant de les accepter
            </Text>
            <Text style={styles.bulletItem}>
              • Informer les participants en cas de modification ou d'annulation
            </Text>
          </View>
          <Text style={styles.subSectionTitle}>6.2 Participants</Text>
          <Text style={styles.paragraph}>
            En participant à un événement, vous vous engagez à :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Respecter les règles établies par l'organisateur
            </Text>
            <Text style={styles.bulletItem}>
              • Arriver à l'heure et prévenir en cas d'impossibilité de
              participer
            </Text>
            <Text style={styles.bulletItem}>
              • Adopter un comportement respectueux envers tous les participants
            </Text>
          </View>
        </View>

        {/* Propriété intellectuelle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            L'application {COMPANY_NAME}, y compris son design, ses logos, son
            contenu et ses fonctionnalités, est protégée par les lois sur la
            propriété intellectuelle. Vous n'êtes pas autorisé à copier,
            modifier, distribuer ou reproduire tout élément de l'application
            sans notre autorisation écrite préalable.
          </Text>
        </View>

        {/* Limitation de responsabilité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            8. Limitation de responsabilité
          </Text>
          <Text style={styles.paragraph}>
            {COMPANY_NAME} est fourni "tel quel" et "selon disponibilité". Nous
            ne garantissons pas que l'application sera exempte d'erreurs ou
            disponible de manière ininterrompue.
          </Text>
          <Text style={styles.paragraph}>
            {COMPANY_NAME} n'est pas responsable :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Des actions ou comportements des utilisateurs lors des
              événements
            </Text>
            <Text style={styles.bulletItem}>
              • Des dommages directs ou indirects résultant de l'utilisation de
              l'application
            </Text>
            <Text style={styles.bulletItem}>
              • De la perte de données ou de l'impossibilité d'accéder au
              service
            </Text>
            <Text style={styles.bulletItem}>
              • Des informations inexactes fournies par les utilisateurs
            </Text>
          </View>
        </View>

        {/* Résiliation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Résiliation</Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de suspendre ou de résilier votre
            compte à tout moment, sans préavis, si vous violez ces Conditions
            d'utilisation ou si nous estimons que votre comportement est
            préjudiciable à {COMPANY_NAME} ou aux autres utilisateurs.
          </Text>
          <Text style={styles.paragraph}>
            Vous pouvez à tout moment supprimer votre compte en nous contactant
            à l'adresse {CONTACT_EMAIL}. La suppression de votre compte
            entraînera l'effacement de vos données personnelles conformément à
            notre Politique de confidentialité.
          </Text>
        </View>

        {/* Modifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            10. Modifications des conditions
          </Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de modifier ces Conditions
            d'utilisation à tout moment. Les modifications seront effectives dès
            leur publication dans l'application. Votre utilisation continue de
            l'application après la publication des modifications constitue votre
            acceptation des nouvelles conditions.
          </Text>
          <Text style={styles.paragraph}>
            En cas de modification substantielle, nous vous en informerons par
            notification dans l'application ou par e-mail.
          </Text>
        </View>

        {/* Droit applicable */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            11. Droit applicable et litiges
          </Text>
          <Text style={styles.paragraph}>
            Ces Conditions d'utilisation sont régies par le droit français. Tout
            litige relatif à l'interprétation ou à l'exécution des présentes
            conditions sera soumis à la compétence exclusive des tribunaux
            français.
          </Text>
          <Text style={styles.paragraph}>
            En cas de litige, nous vous encourageons à nous contacter d'abord
            pour tenter de résoudre le problème à l'amiable.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces Conditions d'utilisation, vous
            pouvez nous contacter :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Par e-mail : {CONTACT_EMAIL}
            </Text>
            <Text style={styles.bulletItem}>
              • Via le formulaire de contact dans l'application
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 {COMPANY_NAME}. Tous droits réservés.
          </Text>
        </View>
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
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  lastUpdated: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  bulletItem: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 26,
  },
  footer: {
    marginTop: 40,
    marginBottom: 60,
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
});
