# FamilyPing

**Know your parents are OK. Every day.**

FamilyPing is a mobile app that helps families stay connected through simple daily check-ins. Parents tap a single button each morning to let their loved ones know they are doing well, while family members get peace of mind with real-time status updates, mood tracking, and a built-in SOS feature.

## Tech Stack

- **Framework:** React Native + Expo (Expo Router for navigation)
- **Language:** TypeScript
- **State Management:** Zustand
- **Backend:** Supabase (Auth, Database, Edge Functions, Realtime)
- **Notifications:** expo-notifications (push + local)
- **Weather:** OpenWeatherMap API

## Setup

```bash
# Install dependencies
npm install

# Start the Expo dev server
npx expo start
```

### Environment Variables

Create a `.env.local` file or add an `extra` block to `app.json` with the following values:

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API key (for weather widget) |

Example `app.json` extra block:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://YOUR_PROJECT.supabase.co",
      "supabaseAnonKey": "YOUR_SUPABASE_ANON_KEY"
    }
  }
}
```

## Project Structure

```
FamilyPing/
  app/              # Expo Router screens & layouts
  assets/           # Images, icons, splash screens
  components/       # Reusable UI components
  lib/
    api.ts          # API calls (check-ins, messages, SOS, weather)
    auth.ts         # Authentication & family management
    notifications.ts # Push & local notification helpers
    questions.ts    # 100 daily check-in questions
    store.ts        # Zustand stores (auth, checkin, family)
    supabase.ts     # Supabase client initialisation
    theme.ts        # Colors, fonts, spacing, border radii
    types.ts        # TypeScript type definitions
  supabase/         # Supabase migrations & edge functions
  app.json          # Expo configuration
  package.json
  tsconfig.json
```

## Development Commands

```bash
# Start dev server
npx expo start

# Run on iOS simulator
npx expo run:ios

# Run on Android emulator
npx expo run:android

# Type-check
npx tsc --noEmit
```
