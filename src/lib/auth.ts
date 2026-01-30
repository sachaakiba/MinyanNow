import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { phoneNumber, emailOTP } from "better-auth/plugins";
import twilio from "twilio";
import { Resend } from "resend";
import prisma from "./prisma";

// Initialize Twilio client (only if credentials are configured)
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

// Initialize Resend client for email OTP
const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Test phone numbers for Apple Review - Fixed OTP: 123456
// These numbers will use a fixed OTP code instead of sending real SMS
const TEST_PHONE_NUMBERS = [
  "+33612345678", // France test number for Apple Review (format: 06 12 34 56 78)
  "+15551234567", // US test number for Apple Review (format: (555) 123-4567)
];
const TEST_OTP_CODE = "123456";

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
        // Check if this is a test phone number for Apple Review
        if (TEST_PHONE_NUMBERS.includes(phoneNumber)) {
          console.log(`\n${"=".repeat(50)}`);
          console.log(`🧪 [APPLE REVIEW TEST] Phone: ${phoneNumber}`);
          console.log(`📱 Fixed OTP code: ${TEST_OTP_CODE}`);
          console.log(`ℹ️  Note: Better-auth will store the generated code in DB`);
          console.log(`ℹ️  But you should use ${TEST_OTP_CODE} for verification`);
          console.log(`${"=".repeat(50)}\n`);
          return; // Don't send SMS for test numbers
        }

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
      verifyOTP: async ({ phoneNumber, code }) => {
        // For test phone numbers, always accept the fixed OTP code
        if (TEST_PHONE_NUMBERS.includes(phoneNumber)) {
          const isValid = code === TEST_OTP_CODE;
          console.log(`🧪 [APPLE REVIEW TEST] Verifying ${phoneNumber} with code ${code}: ${isValid ? "✅ Valid" : "❌ Invalid"}`);
          return isValid;
        }
        
        // For real numbers, we need to check against the DB
        // We'll query the verification table to validate the code
        const verification = await prisma.verification.findFirst({
          where: {
            identifier: phoneNumber,
            value: code,
            expiresAt: {
              gt: new Date(),
            },
          },
        });
        
        return !!verification;
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
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        // In development mode, only log to console
        if (process.env.NODE_ENV === "local") {
          console.log(`\n${"=".repeat(50)}`);
          console.log(`📧 [DEV MODE] Email OTP for ${email}: ${otp}`);
          console.log(`Type: ${type}`);
          console.log(`${"=".repeat(50)}\n`);
          return;
        }

        // In production: Send via Resend
        if (resendClient) {
          try {
            await resendClient.emails.send({
              from: 'onboarding@resend.dev',
              to: email,
              subject: "Votre code MinyanNow",
              text: `Votre code de vérification: ${otp}`,
              html: `<p>Votre code de vérification: <strong>${otp}</strong></p>`,
            });
            console.log(`✅ Email sent successfully to ${email}`);
          } catch (error) {
            console.error(`❌ Failed to send email to ${email}:`, error);
            throw new Error("Failed to send OTP via email");
          }
        } else {
          console.error(
            "❌ Resend not configured in production - cannot send email!"
          );
          throw new Error("Email service not configured");
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      disableSignUp: false, // Allow auto-signup on email verification
    }),
  ],
  emailAndPassword: {
    enabled: false, // Désactivé - on utilise uniquement OTP
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
      role: { type: "string", required: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
