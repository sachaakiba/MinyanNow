import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { phoneNumber } from "better-auth/plugins";
import twilio from "twilio";
import prisma from "./prisma";

// Initialize Twilio client (only if credentials are configured)
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    "*",
    "minyannow://*",
    "exp://*",
    "http://localhost:*",
  ],
  plugins: [
    expo(),
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        // In development mode, only log to console (don't use Twilio to save costs)
        if (process.env.NODE_ENV === "local") {
          console.log(`\n${"=".repeat(50)}`);
          console.log(`📱 [DEV MODE] OTP for ${phoneNumber}: ${code}`);
          console.log(`${"=".repeat(50)}\n`);
          return; // Skip Twilio in development
        }

        // In production/recipe: Send SMS via Twilio
        if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
          try {
            await twilioClient.messages.create({
              body: `Votre code MinyanNow: ${code}`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: phoneNumber,
            });
            console.log(`✅ SMS sent successfully to ${phoneNumber}`);
          } catch (error) {
            console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);
            throw new Error("Failed to send OTP via SMS");
          }
        } else {
          console.error(
            "❌ Twilio not configured in production - cannot send SMS!"
          );
          throw new Error("SMS service not configured");
        }
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
