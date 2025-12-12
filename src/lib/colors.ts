// Couleurs principales de l'application MinyanNow
// Modifier ces valeurs pour changer le thème de l'application

export const colors = {
  // Couleur principale - utilisée pour les éléments interactifs principaux
  primary: "#3A8EDB",
  primaryLight: "#E8F4FD",
  primaryDark: "#2A6BA8",

  // Couleurs de texte
  text: {
    primary: "#111827",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  // Couleurs de fond
  background: {
    primary: "#FFFFFF",
    secondary: "#F8FAFC",
    tertiary: "#F3F4F6",
  },

  // Couleurs de bordure
  border: {
    light: "#F3F4F6",
    medium: "#E5E7EB",
    dark: "#D1D5DB",
  },

  // Couleurs d'état
  success: "#10B981",
  successLight: "#D1FAE5",
  successDark: "#166534",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",

  error: "#DC2626",
  errorLight: "#FEE2E2",

  // Couleurs spécifiques
  accent: "#4F46E5", // Violet pour certains accents
  accentLight: "#EEF2FF",
} as const;

// Type pour les couleurs
export type Colors = typeof colors;
