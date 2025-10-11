/* eslint-env jest */
// Define React Native globals expected by expo modules
global.__DEV__ = true;

// Mock react-native-uuid
jest.mock("react-native-uuid", () => ({
  v4: jest.fn(() => "mock-uuid-" + Math.random().toString(36).substr(2, 9)),
}));

// Mock expo-file-system
jest.mock("expo-file-system", () => ({
  copyAsync: jest.fn(() => Promise.resolve()),
  createAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  documentDirectory: "file://mock-directory/",
  cacheDirectory: "file://mock-cache-directory/",
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readAsStringAsync: jest.fn(() => Promise.resolve("mock-file-content")),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

// Mock specific React Native modules that don't conflict with component tests
jest.mock("react-native", () => ({
  ...jest.requireActual("react-native-web"),
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: "web",
    select: jest.fn(options => options.web || options.default),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

// Global test utilities
global.mockZustandStore = initialState => {
  return {
    getState: jest.fn(() => initialState),
    setState: jest.fn(),
    subscribe: jest.fn(),
  };
};
