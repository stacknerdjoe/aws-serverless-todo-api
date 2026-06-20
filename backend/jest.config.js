'use strict'

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          noUnusedLocals: false,
          noUnusedParameters: false,
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  resetMocks: true,
}
