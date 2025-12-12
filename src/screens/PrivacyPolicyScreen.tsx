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

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PrivacyPolicy"
>;

interface PrivacyPolicyScreenProps {
  navigation: PrivacyPolicyScreenNavigationProp;
}

const LAST_UPDATED = "11 décembre 2024";
const CONTACT_EMAIL = "minyannow.app+contact@gmail.com";
const DPO_EMAIL = "minyannow.app+dpo@gmail.com";
const COMPANY_NAME = "MinyanNow";
const COMPANY_ADDRESS = "Paris, France";

export const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({
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
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
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
          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Chez {COMPANY_NAME}, nous attachons une grande importance à la
            protection de vos données personnelles. Cette Politique de
            confidentialité explique comment nous collectons, utilisons,
            partageons et protégeons vos informations lorsque vous utilisez
            notre application mobile.
          </Text>
          <Text style={styles.paragraph}>
            Cette politique est conforme au Règlement Général sur la Protection
            des Données (RGPD) de l'Union Européenne et aux autres lois
            applicables en matière de protection des données.
          </Text>
        </View>

        {/* Responsable du traitement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Responsable du traitement</Text>
          <Text style={styles.paragraph}>
            Le responsable du traitement de vos données personnelles est :
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxText}>{COMPANY_NAME}</Text>
            <Text style={styles.infoBoxText}>{COMPANY_ADDRESS}</Text>
            <Text style={styles.infoBoxText}>Email : {CONTACT_EMAIL}</Text>
          </View>
          <Text style={styles.paragraph}>
            Pour toute question relative à la protection de vos données, vous
            pouvez contacter notre Délégué à la Protection des Données (DPO) à
            l'adresse : {DPO_EMAIL}
          </Text>
        </View>

        {/* Données collectées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Données collectées</Text>
          <Text style={styles.paragraph}>
            Nous collectons les types de données suivants :
          </Text>

          <Text style={styles.subSectionTitle}>
            3.1 Données que vous nous fournissez
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Informations d'identification :</Text>{" "}
              nom, prénom, nom hébraïque, date de naissance
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Coordonnées :</Text> numéro de
              téléphone
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Pièce d'identité :</Text> copie de
              votre document d'identité pour vérification
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Informations de profil :</Text>{" "}
              synagogue habituelle
            </Text>
          </View>

          <Text style={styles.subSectionTitle}>
            3.2 Données collectées automatiquement
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Données de géolocalisation :</Text>{" "}
              votre position pour afficher les événements à proximité (avec
              votre consentement)
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Données d'utilisation :</Text>{" "}
              interactions avec l'application, événements créés ou rejoints
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Données techniques :</Text> type
              d'appareil, version du système d'exploitation, identifiants
              uniques
            </Text>
          </View>
        </View>

        {/* Finalités du traitement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Finalités du traitement</Text>
          <Text style={styles.paragraph}>
            Nous utilisons vos données personnelles pour les finalités suivantes
            :
          </Text>

          <View style={styles.tableContainer}>
            <View style={styles.tableRow}>
              <Text style={styles.tableHeader}>Finalité</Text>
              <Text style={styles.tableHeader}>Base légale</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                Création et gestion de votre compte
              </Text>
              <Text style={styles.tableCell}>Exécution du contrat</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                Vérification de votre identité
              </Text>
              <Text style={styles.tableCell}>Intérêt légitime (sécurité)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                Affichage des événements à proximité
              </Text>
              <Text style={styles.tableCell}>Consentement</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                Envoi de notifications (rappels, proximité)
              </Text>
              <Text style={styles.tableCell}>Consentement</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Amélioration de nos services</Text>
              <Text style={styles.tableCell}>Intérêt légitime</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>
                Réponse à vos demandes de support
              </Text>
              <Text style={styles.tableCell}>Exécution du contrat</Text>
            </View>
          </View>
        </View>

        {/* Partage des données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Partage des données</Text>
          <Text style={styles.paragraph}>
            Nous ne vendons jamais vos données personnelles. Nous pouvons les
            partager dans les cas suivants :
          </Text>

          <Text style={styles.subSectionTitle}>
            5.1 Avec les autres utilisateurs
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Votre nom et prénom sont visibles par les organisateurs lorsque
              vous demandez à rejoindre un événement
            </Text>
            <Text style={styles.bulletItem}>
              • Votre pièce d'identité est accessible aux organisateurs pour
              vérifier votre identité avant d'accepter votre participation
            </Text>
            <Text style={styles.bulletItem}>
              • Votre nom est visible par les autres participants acceptés
            </Text>
          </View>

          <Text style={styles.subSectionTitle}>5.2 Avec nos prestataires</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Cloudinary :</Text> stockage sécurisé
              des pièces d'identité
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Expo :</Text> envoi des notifications
              push
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Google Maps :</Text> affichage des
              cartes et géolocalisation
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Ces prestataires sont contractuellement tenus de protéger vos
            données et de ne les utiliser que pour les services que nous leur
            demandons de fournir.
          </Text>

          <Text style={styles.subSectionTitle}>5.3 Obligations légales</Text>
          <Text style={styles.paragraph}>
            Nous pouvons divulguer vos données si la loi l'exige ou en réponse à
            des demandes légales valides des autorités publiques.
          </Text>
        </View>

        {/* Conservation des données */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Conservation des données</Text>
          <Text style={styles.paragraph}>
            Nous conservons vos données personnelles pendant les durées
            suivantes :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Données de compte :</Text> pendant
              toute la durée de votre inscription, puis 3 ans après la
              suppression de votre compte
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Pièce d'identité :</Text> pendant
              toute la durée de votre inscription, supprimée immédiatement lors
              de la suppression du compte
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Données de géolocalisation :</Text>{" "}
              conservées uniquement pendant votre session active
            </Text>
            <Text style={styles.bulletItem}>
              • <Text style={styles.bold}>Historique des événements :</Text> 2
              ans après la date de l'événement
            </Text>
          </View>
        </View>

        {/* Sécurité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Sécurité des données</Text>
          <Text style={styles.paragraph}>
            Nous mettons en œuvre des mesures de sécurité techniques et
            organisationnelles appropriées pour protéger vos données contre
            l'accès non autorisé, la modification, la divulgation ou la
            destruction :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Chiffrement des données en transit (HTTPS/TLS)
            </Text>
            <Text style={styles.bulletItem}>
              • Stockage sécurisé des pièces d'identité avec accès restreint
            </Text>
            <Text style={styles.bulletItem}>
              • Authentification par OTP (code à usage unique)
            </Text>
            <Text style={styles.bulletItem}>
              • Accès limité aux données selon le principe du moindre privilège
            </Text>
            <Text style={styles.bulletItem}>
              • Surveillance et journalisation des accès aux données sensibles
            </Text>
          </View>
        </View>

        {/* Vos droits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Vos droits</Text>
          <Text style={styles.paragraph}>
            Conformément au RGPD, vous disposez des droits suivants sur vos
            données personnelles :
          </Text>

          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>📋 Droit d'accès</Text>
              <Text style={styles.rightDescription}>
                Obtenir une copie de toutes les données que nous détenons sur
                vous
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>✏️ Droit de rectification</Text>
              <Text style={styles.rightDescription}>
                Corriger des données inexactes ou incomplètes vous concernant
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>🗑️ Droit à l'effacement</Text>
              <Text style={styles.rightDescription}>
                Demander la suppression de vos données personnelles
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>⏸️ Droit à la limitation</Text>
              <Text style={styles.rightDescription}>
                Limiter le traitement de vos données dans certaines
                circonstances
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>📤 Droit à la portabilité</Text>
              <Text style={styles.rightDescription}>
                Recevoir vos données dans un format structuré et lisible par
                machine
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>🚫 Droit d'opposition</Text>
              <Text style={styles.rightDescription}>
                Vous opposer au traitement de vos données pour des raisons
                tenant à votre situation particulière
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Text style={styles.rightTitle}>
                ⚙️ Droit de retirer votre consentement
              </Text>
              <Text style={styles.rightDescription}>
                Retirer votre consentement à tout moment pour les traitements
                basés sur le consentement
              </Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Pour exercer ces droits, contactez-nous à {DPO_EMAIL}. Nous
            répondrons à votre demande dans un délai d'un mois.
          </Text>
          <Text style={styles.paragraph}>
            Vous avez également le droit de déposer une plainte auprès de la
            CNIL (Commission Nationale de l'Informatique et des Libertés) si
            vous estimez que vos droits ne sont pas respectés.
          </Text>
        </View>

        {/* Géolocalisation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Géolocalisation</Text>
          <Text style={styles.paragraph}>
            {COMPANY_NAME} utilise votre position géographique pour :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Afficher les événements à proximité sur la carte
            </Text>
            <Text style={styles.bulletItem}>
              • Vous envoyer des notifications lorsque vous êtes proche d'un
              événement (si activé)
            </Text>
          </View>
          <Text style={styles.paragraph}>
            La géolocalisation est basée sur votre consentement. Vous pouvez la
            désactiver à tout moment dans les paramètres de votre appareil ou
            dans l'application (section Notifications).
          </Text>
          <Text style={styles.paragraph}>
            Nous ne conservons pas l'historique de vos déplacements. Seule votre
            dernière position connue est stockée pour le service de
            notifications de proximité.
          </Text>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Notifications push</Text>
          <Text style={styles.paragraph}>
            Nous pouvons vous envoyer des notifications push pour vous informer
            :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Des événements à proximité de votre position
            </Text>
            <Text style={styles.bulletItem}>
              • Des nouvelles demandes de participation (organisateurs)
            </Text>
            <Text style={styles.bulletItem}>
              • De l'acceptation ou du refus de vos demandes
            </Text>
            <Text style={styles.bulletItem}>
              • Des modifications d'événements auxquels vous participez
            </Text>
            <Text style={styles.bulletItem}>
              • Des rappels avant les événements
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Vous pouvez gérer vos préférences de notifications dans les
            paramètres de l'application ou désactiver complètement les
            notifications dans les paramètres de votre appareil.
          </Text>
        </View>

        {/* Transferts internationaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Transferts internationaux</Text>
          <Text style={styles.paragraph}>
            Certains de nos prestataires peuvent traiter vos données en dehors
            de l'Espace Économique Européen (EEE). Dans ce cas, nous nous
            assurons que des garanties appropriées sont en place :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Clauses contractuelles types approuvées par la Commission
              européenne
            </Text>
            <Text style={styles.bulletItem}>
              • Certification des prestataires américains sous le EU-US Data
              Privacy Framework
            </Text>
          </View>
        </View>

        {/* Mineurs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>12. Protection des mineurs</Text>
          <Text style={styles.paragraph}>
            {COMPANY_NAME} n'est pas destiné aux enfants de moins de 13 ans.
            Nous ne collectons pas sciemment de données personnelles auprès
            d'enfants de moins de 13 ans. Si vous êtes parent ou tuteur et que
            vous pensez que votre enfant nous a fourni des données personnelles,
            veuillez nous contacter à {CONTACT_EMAIL}.
          </Text>
          <Text style={styles.paragraph}>
            Pour les utilisateurs âgés de 13 à 16 ans, le consentement d'un
            parent ou tuteur peut être requis conformément à la législation
            applicable.
          </Text>
        </View>

        {/* Cookies et technologies similaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            13. Cookies et technologies similaires
          </Text>
          <Text style={styles.paragraph}>
            Notre application mobile n'utilise pas de cookies au sens
            traditionnel. Cependant, nous utilisons des technologies similaires
            pour :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Maintenir votre session de connexion
            </Text>
            <Text style={styles.bulletItem}>
              • Stocker vos préférences localement sur votre appareil
            </Text>
            <Text style={styles.bulletItem}>
              • Améliorer les performances de l'application
            </Text>
          </View>
        </View>

        {/* Modifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            14. Modifications de cette politique
          </Text>
          <Text style={styles.paragraph}>
            Nous pouvons mettre à jour cette Politique de confidentialité de
            temps à autre. Nous vous informerons de tout changement important
            par :
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletItem}>
              • Une notification dans l'application
            </Text>
            <Text style={styles.bulletItem}>
              • La mise à jour de la date "Dernière mise à jour" en haut de
              cette page
            </Text>
          </View>
          <Text style={styles.paragraph}>
            Nous vous encourageons à consulter régulièrement cette politique
            pour rester informé de la manière dont nous protégeons vos données.
          </Text>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>15. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant cette Politique de confidentialité ou
            vos données personnelles :
          </Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Contact général</Text>
            <Text style={styles.infoBoxText}>{CONTACT_EMAIL}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>
              Délégué à la Protection des Données (DPO)
            </Text>
            <Text style={styles.infoBoxText}>{DPO_EMAIL}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>Autorité de contrôle</Text>
            <Text style={styles.infoBoxText}>
              CNIL - Commission Nationale de l'Informatique et des Libertés
            </Text>
            <Text style={styles.infoBoxText}>www.cnil.fr</Text>
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
    fontSize: 16,
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
  bold: {
    fontWeight: "600",
    color: "#374151",
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
  infoBox: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoBoxText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  tableContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tableHeader: {
    flex: 1,
    padding: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    backgroundColor: "#F9FAFB",
  },
  tableCell: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#4B5563",
  },
  rightsList: {
    marginBottom: 16,
  },
  rightItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rightTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  rightDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
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
