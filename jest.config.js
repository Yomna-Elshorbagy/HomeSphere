module.exports = {
  projects: [
    '<rootDir>/apps/*',
    '<rootDir>/packages/*'
  ],
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
};
