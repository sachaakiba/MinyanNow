import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { phoneNumber } from "better-auth/plugins";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    expo(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // Pour le développement, on log le code dans la console
        // En production, tu devras intégrer un service SMS comme Twilio, Vonage, etc.
        console.log(`📱 OTP for ${phoneNumber}: ${code}`);

        // TODO: En production, utiliser un service SMS
        // Exemple avec Twilio:
        // await twilioClient.messages.create({
        //   body: `Votre code MinyanNow: ${code}`,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber,
        // });
      },
      // Configuration OTP
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      // Permet la connexion/inscription par téléphone uniquement
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          // Génère un email temporaire basé sur le numéro de téléphone
          // Car BetterAuth requiert un email pour l'utilisateur
          const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
          return `${cleanPhone}@phone.minyannow.app`;
        },
      },
    }),
  ],
  emailAndPassword: {
    enabled: false, // Désactivé car on utilise uniquement le téléphone
  },
  trustedOrigins: [
    "minyannow://",
    "exp://192.168.1.158:8081",
    "exp://localhost:8081",
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      firstName: { type: "string", required: false },
      lastName: { type: "string", required: false },
      hebrewName: { type: "string", required: false },
      dateOfBirth: { type: "date", required: false },
      barMitzvahParasha: { type: "string", required: false },
      synagogue: { type: "string", required: false },
      community: { type: "string", required: false },
      profileCompleted: { type: "boolean", required: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
