# MinyanNow

A React Native (Expo) application with authentication using Better Auth and Prisma with Neon PostgreSQL database.

## Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up the database:**

   ```bash
   npm run db:push
   npm run db:generate
   ```

3. **Configure environment variables:**

   The `.env` file is already configured with:

   - `DATABASE_URL` - Neon PostgreSQL connection string
   - `BETTER_AUTH_SECRET` - Secret key for authentication
   - `BETTER_AUTH_URL` - Auth server URL
   - `EXPO_PUBLIC_API_URL` - API URL for the mobile app

## Running the Application

You need to run both the backend server and the Expo app:

### 1. Start the Authentication Server

```bash
npm run server
```

This starts the Express server on `http://localhost:3000` with Better Auth endpoints.

### 2. Start the Expo App

In a new terminal:

```bash
npm start
```

Then:

- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your device

## Project Structure

```
MinyanNow/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── api/
│   │   └── server.ts       # Express server with Better Auth
│   ├── components/
│   │   ├── Button.tsx
│   │   └── Input.tsx
│   ├── lib/
│   │   ├── auth.ts         # Better Auth server config
│   │   ├── auth-client.ts  # Better Auth client for React Native
│   │   └── prisma.ts       # Prisma client
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── SignInScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── HomeScreen.tsx
│   └── types/
│       └── navigation.ts
├── App.tsx
├── package.json
└── .env
```

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version
- `npm run server` - Start the authentication server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:studio` - Open Prisma Studio

## Authentication Endpoints

The server exposes the following Better Auth endpoints:

- `POST /api/auth/sign-up/email` - Create new account
- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session

## Tech Stack

- **Frontend:** React Native with Expo
- **Navigation:** React Navigation (Native Stack)
- **Authentication:** Better Auth
- **Database:** Neon PostgreSQL
- **ORM:** Prisma
- **Backend:** Express.js

## Notes for Development

- When testing on a physical device, update `EXPO_PUBLIC_API_URL` in `.env` to your machine's local IP address (e.g., `http://192.168.1.x:3000`)
- The database schema includes `User`, `Session`, `Account`, and `Verification` models required by Better Auth
