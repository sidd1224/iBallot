// Create a persistent mock for the connect function
const mockConnect = jest.fn();

// Mock the 'pg' module to use our mock function
jest.mock("pg", () => ({
    Pool: jest.fn(() => ({
        connect: mockConnect,
    })),
}));

describe("Database Connection (db.js)", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        // Reset modules to ensure the db.js file is re-evaluated for each test
        jest.resetModules();
        // Clear the mock function's call history
        mockConnect.mockClear();
        // Restore the original process.env
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        // Clean up: restore the original process.env after all tests
        process.env = originalEnv;
    });

    test("should attempt to connect and log success when NODE_ENV is not 'test'", async () => {
        // Arrange
        process.env.NODE_ENV = "development";
        const mockClient = { release: jest.fn() };
        mockConnect.mockResolvedValue(mockClient); // Configure the mock to return a resolved promise
        const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        // Act: Require the module to trigger the connection logic
        require("../../database/db");
        // Wait for the promise microtask queue to be empty
        await new Promise(process.nextTick);

        // Assert
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(consoleLogSpy).toHaveBeenCalledWith("✅ Connected to PostgreSQL");
        consoleLogSpy.mockRestore();
    });

    test("should log an error and exit if the connection fails when NODE_ENV is not 'test'", async () => {
        // Arrange
        process.env.NODE_ENV = "production";
        mockConnect.mockRejectedValue(new Error("Connection refused")); // Configure mock to return a rejected promise
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

        // Act
        require("../../database/db");
        await new Promise(process.nextTick);

        // Assert
        expect(mockConnect).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("❌ PostgreSQL connection error:", "Connection refused");
        expect(processExitSpy).toHaveBeenCalledWith(1);
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
    });

    test("should NOT attempt to connect when NODE_ENV is 'test'", () => {
        // Arrange
        process.env.NODE_ENV = "test";

        // Act
        require("../../database/db");

        // Assert
        expect(mockConnect).not.toHaveBeenCalled();
    });
});
