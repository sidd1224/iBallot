// No top-level mocks are needed with this approach. Mocks will be defined per-test.

describe("Blockchain Contract Initialization", () => {
    const originalEnv = process.env;
    const originalExit = process.exit;
    const originalError = console.error;

    beforeEach(() => {
        // This is crucial. It clears the module cache before each test,
        // forcing the module under test to be re-evaluated.
        jest.resetModules();
        // Restore original environment and process functions
        process.env = { ...originalEnv };
        process.exit = originalExit;
        console.error = originalError;
    });

    test("should successfully initialize the contract with valid environment variables", () => {
        // Arrange
        const mockAddress = "0x1234567890123456789012345678901234567890";
        process.env.CONTRACT_ADDRESS = mockAddress;
        process.env.PRIVATE_KEY = "a_valid_private_key";
        process.env.RPC_URL = "http://localhost:8545";

        // Define mocks specifically for this test
        const mockGetAddress = jest.fn(addr => addr);
        const mockWallet = jest.fn();
        const mockContract = jest.fn();

        jest.doMock("ethers", () => ({
            JsonRpcProvider: jest.fn(),
            Contract: mockContract,
            Wallet: mockWallet,
            getAddress: mockGetAddress,
        }));
        jest.doMock("../../blockchain/Voting.json", () => ({
            abi: ["mock-abi-entry"],
        }), { virtual: true });

        // Act: Require the module here. It will be loaded fresh, using the mocks defined above.
        const contractInstance = require("../../blockchain/contract");

        // Assert
        expect(mockGetAddress).toHaveBeenCalledWith(mockAddress);
        expect(mockWallet).toHaveBeenCalledWith("a_valid_private_key", expect.any(Object));
        expect(mockContract).toHaveBeenCalledWith(mockAddress, ["mock-abi-entry"], expect.any(Object));
        expect(contractInstance).toBeDefined();
    });

    test("should exit the process if the contract address is invalid", () => {
        // Arrange
        process.env.CONTRACT_ADDRESS = "invalid-address";
        process.env.PRIVATE_KEY = "a_valid_private_key";
        
        const mockGetAddress = jest.fn(() => { throw new Error("Invalid address"); });
        
        jest.doMock("ethers", () => ({
            JsonRpcProvider: jest.fn(),
            Contract: jest.fn(),
            Wallet: jest.fn(),
            getAddress: mockGetAddress,
        }));
        jest.doMock("../../blockchain/Voting.json", () => ({ abi: [] }), { virtual: true });

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

        // Act
        require("../../blockchain/contract");

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Invalid CONTRACT_ADDRESS or PRIVATE_KEY:", "Invalid address");
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test("should exit the process if the private key is missing", () => {
        // Arrange
        process.env.CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";
        delete process.env.PRIVATE_KEY;

        jest.doMock("ethers", () => ({
            JsonRpcProvider: jest.fn(),
            Contract: jest.fn(),
            Wallet: jest.fn(() => { throw new Error("Missing private key"); }),
            getAddress: jest.fn(addr => addr),
        }));
        jest.doMock("../../blockchain/Voting.json", () => ({ abi: [] }), { virtual: true });

        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const processExitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});

        // Act
        require("../../blockchain/contract");

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Invalid CONTRACT_ADDRESS or PRIVATE_KEY:", "Missing private key");
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
