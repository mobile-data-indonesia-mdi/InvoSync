/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\.tsx?$': ['ts-jest', {}],
  },
  moduleNameMapper: {
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
  },
};
