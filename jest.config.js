module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.js"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testMatch: ["**/__tests__/**/*.(ts|tsx|js)", "**/*.(test|spec).(ts|tsx|js)"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
        },
      },
    ],
  },
  // Focus coverage on testable business logic, not UI/JSX
  collectCoverageFrom: [
    "logic/**/*.{ts,tsx}", // Pure business logic
    "store/**/*.{ts,tsx}", // State management
    "utils/**/*.{ts,tsx}", // Utility functions
    "types/**/*.{ts,tsx}", // Type definitions
    "!app/**/*", // UI screens - test with integration tests
    "!components/**/*", // UI components - test with component tests
    "!utils/gameCountAudit.ts", // Complex utility - test separately
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "logic/**/*.ts": {
      branches: 95,
      functions: 100,
      lines: 95,
      statements: 95,
    },
    "store/**/*.ts": {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|gif|svg|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/$1",
    "^react-native$": "react-native-web",
    "^expo-sharing$": "<rootDir>/__mocks__/expo-sharing.js",
    "^expo-file-system/legacy$": "<rootDir>/__mocks__/expo-file-system.js",
    "^expo-file-system$": "<rootDir>/__mocks__/expo-file-system.js",
    "^react-native-view-shot$": "<rootDir>/__mocks__/react-native-view-shot.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|react-native-web|expo|@expo|expo-.*|react-native-uuid|react-native-reanimated|react-native-view-shot)/)",
  ],
};
