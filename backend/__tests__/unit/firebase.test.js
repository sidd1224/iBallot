// Use virtual mocks to prevent Jest from trying to resolve the actual modules.
// This is the key to avoiding the "Cannot find module" error.
jest.mock("firebase/app", () => ({
    initializeApp: jest.fn(),
}), { virtual: true });

jest.mock("firebase/auth", () => ({
    getAuth: jest.fn(),
    connectAuthEmulator: jest.fn(),
}), { virtual: true });


describe("Unit Test: Firebase Client SDK Initialization", () => {

    beforeEach(() => {
        // This is crucial. It clears the module cache, forcing 'firebase.js'
        // to be re-evaluated in each test, ensuring it uses fresh mocks.
        jest.resetModules();
    });

    test("should initialize Firebase app and connect to the auth emulator", () => {
        // Arrange: After resetting modules, we can import the mocked versions.
        const { initializeApp } = require("firebase/app");
        const { getAuth, connectAuthEmulator } = require("firebase/auth");

        const mockApp = { name: "mockApp" };
        const mockAuth = { name: "mockAuth" };

        // Set up the return values for the mocked functions for this specific test
        initializeApp.mockReturnValue(mockApp);
        getAuth.mockReturnValue(mockAuth);

        // Act: Now, we require the module we want to test. Because we reset
        // the cache, it will load fresh and use the mocks we just configured.
        const auth = require("../../utils/firebase");

        // Assert
        expect(initializeApp).toHaveBeenCalledTimes(1);
        expect(initializeApp).toHaveBeenCalledWith(expect.any(Object));

        expect(getAuth).toHaveBeenCalledTimes(1);
        expect(getAuth).toHaveBeenCalledWith(mockApp);

        expect(connectAuthEmulator).toHaveBeenCalledTimes(1);
        expect(connectAuthEmulator).toHaveBeenCalledWith(mockAuth, "http://localhost:9099");

        expect(auth).toBe(mockAuth);
    });
});
