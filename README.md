# Stellar Insights Mobile

React Native mobile application for Stellar Insights payment analytics.

## Current Status

**Correction:** the "Verified in CI" claims that used to be here were not accurate — the only workflow that touches `mobile/` at all is [`.github/workflows/security-scan.yml`](../.github/workflows/security-scan.yml), which runs `npm audit` and nothing else. Nothing installs, type-checks, lints, or builds this package in CI. The status below reflects an actual run on a clean checkout instead.

**Verified (clean checkout, Node v24.18.0 / npm v11.16.0 — package.json only requires `node >= 18`; this is notably newer than the Node 18/20 era React Native 0.73 targeted, worth keeping in mind if something looks version-sensitive):**
- ✅ `npm install` completes cleanly — 1226 packages, no ERESOLVE / peer-dependency conflicts, no native-module-linking errors, `package-lock.json` unchanged from what's committed.

**Currently broken — do not treat these as passing gates:**
- ❌ `npm run type-check` fails: 130 errors across 68 files. One was a real blocking bug — `src/config/network.ts` contained JSX (`<NetworkContext.Provider>`) but had a `.ts` extension, so nothing in the file could even parse; fixed by renaming to `.tsx` (this change). The rest are pre-existing and out of scope for a quick fix:
  - 23 errors (`TS6137`, "Cannot import type declaration files") share one root cause: `tsconfig.json`'s path alias `"@types/*": ["src/types/*"]` collides with TypeScript's reserved handling of the `@types/` npm scope, which refuses runtime imports through that prefix regardless of what the alias actually points to. Renaming the alias (e.g. `@apptypes/*`) and updating its ~15 import sites would likely clear this bucket in one pass.
  - ~10 errors ("Cannot find namespace 'NodeJS'") suggest `@types/node` isn't a devDependency.
  - The remaining ~97 are scattered and unrelated to each other across `src/features/*` (face_recognition, fingerprint_scanner, voice_commands — RN `AccessibilityRole` type mismatches, `react-native-mmkv` API drift, stale React Native Testing Library matcher usage) and `src/hooks/*` — will need file-by-file triage.
- ❌ `npm run lint` doesn't run at all — crashes immediately with `TypeError: prettier.resolveConfig.sync is not a function`. Root cause: `@react-native/eslint-config@0.73.2` pulls in its own nested `eslint-plugin-prettier@4.2.5`, built against Prettier's pre-v3 (sync) API; this repo's `prettier` resolves to `3.8.3`. Likely fix is an npm `overrides` pin of `eslint-plugin-prettier` to `^5` (the version compatible with Prettier v3) — not attempted here since it needs a full clean lint run afterward to confirm it doesn't change lint behavior elsewhere in the package.

**NOT verified (no simulator/EAS credentials in CI environment):**
- ❌ Native iOS build (simulator or device)
- ❌ Native Android build (emulator or device)
- ❌ End-to-end testing on actual device
- ❌ App store distribution (iOS/Google Play)

**What this means:**
- `npm install` is reliable — dependencies land on disk without special flags or manual intervention.
- Don't rely on `npm run type-check` or `npm run lint` as stabilization signals yet; both need dedicated follow-up work before they're meaningful gates.
- The app can be built and run locally if you have Xcode/Android Studio configured, independent of the type-check/lint issues above (Metro/Babel transpile without type-checking).
- Contributors who want to test native builds must do so on their own machine
- Full testing requires running `npm run ios` or `npm run android` locally

**To verify native builds yourself:**

```bash
# Install dependencies
npm install
cd ios && pod install && cd ..

# For iOS (requires Xcode):
npm run ios

# For Android (requires Android Studio/SDK):
npm run android
```

If you encounter issues, see the Troubleshooting section below. If you fix an issue, please document it in this README or open an issue for the team.

## Features

- 📱 Cross-platform (iOS & Android)
- 🔐 Secure authentication with SEP-10
- 🌐 Network switching (testnet/mainnet)
- 📴 Offline-first architecture
- 🔔 Push notifications
- 🔒 Biometric authentication
- 🎨 Native UI patterns

## Prerequisites

- Node.js 18+
- React Native CLI
- Xcode (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Install iOS pods:

```bash
cd ios && pod install && cd ..
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run the app:

```bash
# iOS
npm run ios

# Android
npm run android
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   └── main/         # Main app screens
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API and business logic
│   │   ├── api.ts        # API client
│   │   ├── auth.ts       # Authentication service
│   │   ├── storage.ts    # Local storage
│   │   ├── network.ts    # Network monitoring
│   │   └── notifications.ts # Push notifications
│   ├── store/            # State management (Zustand)
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── config/           # App configuration
│   └── App.tsx           # Root component
├── android/              # Android native code
├── ios/                  # iOS native code
└── package.json
```

## Key Dependencies

- **React Native**: Cross-platform framework
- **React Navigation**: Navigation library
- **TanStack Query**: Data fetching and caching
- **Zustand**: State management
- **Axios**: HTTP client
- **MMKV**: Fast local storage
- **React Native Keychain**: Secure credential storage
- **Notifee**: Local notifications
- **Firebase**: Push notifications

## Development

### Running Tests

```bash
npm test
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Network Switching

The app supports runtime network switching between testnet and mainnet:

1. Go to Settings
2. Tap "Current Network"
3. Select desired network
4. App will clear cache and reconnect

## Offline Mode

The app works offline with cached data:

- Cached data is marked with staleness indicators
- Write operations are queued
- Automatic sync when connection is restored

## Push Notifications

Configure Firebase for push notifications:

1. Add `google-services.json` (Android) to `android/app/`
2. Add `GoogleService-Info.plist` (iOS) to `ios/`
3. Set Firebase credentials in `.env`

## Security

- Tokens stored in platform keychain
- Biometric authentication support
- Certificate pinning (production)
- Secure local storage with encryption

## Building for Production

### iOS

```bash
cd ios
xcodebuild -workspace StellarInsights.xcworkspace -scheme StellarInsights -configuration Release
```

### Android

```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Metro bundler issues

```bash
npm start -- --reset-cache
```

### iOS build issues

```bash
cd ios
pod deintegrate
pod install
```

### Android build issues

```bash
cd android
./gradlew clean
```

## Contributing

See main repository CONTRIBUTING.md

## License

See main repository LICENSE
