import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-config', () => ({
  __esModule: true,
  default: {
    API_BASE_URL: 'http://localhost:8080',
    API_TIMEOUT: '30000',
    STELLAR_NETWORK: 'testnet',
  },
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// react-native 0.87 moved this from Libraries/Animated/ into src/private/animated/.
jest.mock('react-native/src/private/animated/NativeAnimatedHelper');

// AsyncStorage v3's bundled mock is ESM and not built from jest.fn, so tests
// could not stub individual calls. This in-memory mock keeps every method a
// jest.fn.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  const AsyncStorage = {
    getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn(async (key, value) => {
      store.set(key, value);
    }),
    removeItem: jest.fn(async key => {
      store.delete(key);
    }),
    getAllKeys: jest.fn(async () => [...store.keys()]),
    getMany: jest.fn(async keys =>
      Object.fromEntries(keys.map(k => [k, store.has(k) ? store.get(k) : null])),
    ),
    setMany: jest.fn(async entries => {
      Object.entries(entries).forEach(([k, v]) => store.set(k, v));
    }),
    removeMany: jest.fn(async keys => {
      keys.forEach(k => store.delete(k));
    }),
    clear: jest.fn(async () => {
      store.clear();
    }),
  };
  return { __esModule: true, default: AsyncStorage, ...AsyncStorage };
});

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('react-native-keychain', () => {
  let store = null;
  return {
    setGenericPassword: jest.fn((username, password) => {
      store = { username, password };
      return Promise.resolve(true);
    }),
    getGenericPassword: jest.fn(() => Promise.resolve(store ? store : false)),
    resetGenericPassword: jest.fn(() => {
      store = null;
      return Promise.resolve(true);
    }),
    ACCESSIBLE: {},
    ACCESS_CONTROL: {},
    BIOMETRY_TYPE: {
      TOUCH_ID: 'TouchID',
      FACE_ID: 'FaceID',
      FINGERPRINT: 'Fingerprint',
    },
  };
});

jest.mock('react-native-biometrics', () => ({
  __esModule: true,
  BiometryTypes: {
    TouchID: 'TouchID',
    FaceID: 'FaceID',
    Biometrics: 'Biometrics',
  },
  default: jest.fn().mockImplementation(() => ({
    isSensorAvailable: jest.fn(() => Promise.resolve({ available: false })),
    simplePrompt: jest.fn(() => Promise.resolve({ success: false })),
  })),
}));

jest.mock('react-native-mmkv', () => {
  const store = new Map();
  const MockMMKV = jest.fn().mockImplementation(() => ({
    set: jest.fn((key, value) => store.set(key, value)),
    getString: jest.fn(key => store.get(key)),
    getBoolean: jest.fn(key => store.get(key)),
    getNumber: jest.fn(key => store.get(key)),
    delete: jest.fn(key => store.delete(key)),
    clearAll: jest.fn(() => store.clear()),
    contains: jest.fn(key => store.has(key)),
    getAllKeys: jest.fn(() => Array.from(store.keys())),
  }));
  return { MMKV: MockMMKV };
});
