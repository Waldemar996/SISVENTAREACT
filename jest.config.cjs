module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/resources/js/test-setup.js'],
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle specific file extensions if necessary
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/resources/js/__mocks__/fileMock.js',
        // Alias mapping matching vite.config.js usually (assuming @ -> resources/js)
        '^@/(.*)$': '<rootDir>/resources/js/$1',
    },
    testMatch: [
        '<rootDir>/resources/js/**/*.test.{js,jsx,ts,tsx}'
    ],
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest',
    },
};
