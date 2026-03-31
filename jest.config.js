module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    testPathIgnorePatterns: ["/node_modules/", "\\.backup/tests/e2e/"],
};
