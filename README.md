# PayRaider Mobile

**PayRaider in your pocket: Stellar corridor and anchor health on iOS and Android.**

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
![React Native](https://img.shields.io/badge/React%20Native-0.87-61dafb)
![Status](https://img.shields.io/badge/status-early%20stage-orange)

Part of [PayRaider](https://github.com/Pay-Raider): [backend](https://github.com/Pay-Raider/payraider-backend) · [web app](https://github.com/Pay-Raider/payraider-app) · [plugin & SDKs](https://github.com/Pay-Raider/payraider-plugin) · [contracts](https://github.com/Pay-Raider/payraider-contracts)

---

> **Early stage.** The app type-checks cleanly, but it has not yet been built or run on a device, the native `ios/` and `android/` projects are not generated yet, and part of the test suite still fails for lack of native-module mocks. For production use, use the [web app](https://github.com/Pay-Raider/payraider-app) or the [API](https://github.com/Pay-Raider/payraider-backend). Details: [docs/STATUS.md](docs/STATUS.md).

## What it does

| Screen | What it shows |
| --- | --- |
| **Corridors** | Success rate, liquidity and health of Stellar payment corridors |
| **Anchors** | Anchor directory and reliability |
| **Settings** | Network (mainnet / testnet), notifications, security |

Built for mobile: offline caching of the last data seen, push notifications for corridor alerts, biometric unlock, and wallet sign-in.

## Quick start

Requires Node.js 20+, the React Native toolchain, and Xcode or Android Studio.

```bash
npm install
cp .env.example .env          # set API_BASE_URL to your PayRaider backend
npx react-native start
```

To run on a device or simulator, generate the native projects first (they are not committed yet), then:

```bash
npm run ios        # or: npm run android
```

## Development

```bash
npm run type-check   # TypeScript, passes
npm test             # Jest, partly failing pending native mocks (see docs/STATUS.md)
```

## Project layout

| Path | Contents |
| --- | --- |
| `src/screens/` | App screens |
| `src/navigation/` | Auth and main navigators |
| `src/services/` | API, notifications, storage |
| `src/hooks/`, `src/store/` | Data hooks and app state (Zustand) |
| `src/components/` | Shared UI |

## Roadmap

1. Generate and commit the native projects; build on both platforms.
2. Mock native modules so the full test suite runs in CI.
3. Add the pre-payment check screen to match the web app.

## License

[Apache 2.0](LICENSE)
