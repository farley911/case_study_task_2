module.exports = {
  testEnvironment: 'jsdom',

  setupFiles: [
    '<rootDir>/src/test/polyfills.cjs',
  ],

  setupFilesAfterEnv: [
    '<rootDir>/src/test/setup.ts',
  ],

  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: true,
          },
          transform: {
            react: {
              runtime: 'automatic',
            },
          },
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },

  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$':
      '<rootDir>/src/test/fileMock.cjs',
  },

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  coverageReporters: [
    'text',
    'lcov',
    'json-summary',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/routeTree.gen.ts',
  ],
}