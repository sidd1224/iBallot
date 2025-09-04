// Mocks will be configured dynamically inside each test

describe("Unit Test: Firebase Admin SDK Initialization", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // This is crucial. It clears the module cache before each test,
        // forcing the firebaseAdmin.js file to be re-evaluated.
        jest.resetModules();
        // Restore original env variables
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Clean up: restore original env
        process.env = originalEnv;
    });

    test("should initialize with credentials from environment variables if they exist", () => {
        // Arrange
        process.env.FIREBASE_PROJECT_ID = "env-project-id";
        process.env.FIREBASE_CLIENT_EMAIL = "env@example.com";
        process.env.FIREBASE_PRIVATE_KEY = "env-private-key";

        const mockInitializeApp = jest.fn();
        const mockCert = jest.fn(cred => cred);
        const mockAuth = jest.fn(() => ({ app: { options: {} } }));

        jest.doMock("firebase-admin", () => ({
            initializeApp: mockInitializeApp,
            credential: { cert: mockCert },
            auth: mockAuth,
        }));

        // Act: Require the module to trigger initialization
        require("../../utils/firebaseAdmin");

        // Assert
        expect(mockInitializeApp).toHaveBeenCalledTimes(1);
        expect(mockCert).toHaveBeenCalledWith({
            projectId: "env-project-id",
            clientEmail: "env@example.com",
            privateKey: "env-private-key",
        });
    });

    test("should initialize with credentials from serviceAccountKey.json as a fallback", () => {
        // Arrange: Ensure environment variables are not set
        delete process.env.FIREBASE_PROJECT_ID;
        delete process.env.FIREBASE_CLIENT_EMAIL;
        delete process.env.FIREBASE_PRIVATE_KEY;

        const mockInitializeApp = jest.fn();
        const mockCert = jest.fn(cred => cred);
        const mockAuth = jest.fn(() => ({ app: { options: {} } }));

        jest.doMock("firebase-admin", () => ({
            initializeApp: mockInitializeApp,
            credential: { cert: mockCert },
            auth: mockAuth,
        }));
        jest.doMock("../../serviceAccountKey.json", () => ({
            projectId: "fallback-project-id",
        }), { virtual: true });

        // Act
        require("../../utils/firebaseAdmin");

        // Assert
        expect(mockInitializeApp).toHaveBeenCalledTimes(1);
        expect(mockCert).toHaveBeenCalledWith({
            projectId: "fallback-project-id",
        });
    });

    test("should configure the auth emulator if FIREBASE_AUTH_EMULATOR_HOST is set", () => {
        // Arrange
        process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";

        const mockInitializeApp = jest.fn();
        const mockCert = jest.fn(cred => cred);
        const mockAppObject = { options: {} };
        const mockAuth = jest.fn(() => ({
            app: mockAppObject,
        }));

        jest.doMock("firebase-admin", () => ({
            initializeApp: mockInitializeApp,
            credential: { cert: mockCert },
            auth: mockAuth,
        }));

        // Act
        require("../../utils/firebaseAdmin");

        // Assert
        expect(mockAppObject.options.credential).toBeDefined();
        expect(typeof mockAppObject.options.credential.getAccessToken).toBe("function");
    });
});
