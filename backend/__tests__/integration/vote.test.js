const request = require("supertest");
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// --- Mocks Setup ---
// Mock dependencies before any other modules are imported

// Mock the database
jest.mock("../../database/db");
const pool = require("../../database/db");

// Mock utility functions
jest.mock("../../utils/aesUtils", () => ({
    decrypt: jest.fn(),
}));
const { decrypt } = require("../../utils/aesUtils");

// Mock blockchain components
const mockCastVoteMeta = jest.fn();
const mockGetNonce = jest.fn();
jest.mock("../../blockchain/contract", () => ({
    connect: jest.fn().mockReturnValue({
        getNonce: mockGetNonce,
        castVoteMeta: mockCastVoteMeta,
    }),
}));

// Mock ethers library
jest.mock("ethers", () => {
    const originalEthers = jest.requireActual("ethers");
    return {
        ...originalEthers,
        Wallet: jest.fn().mockImplementation(() => ({
            signMessage: jest.fn().mockResolvedValue("mock_signature"),
        })),
        JsonRpcProvider: jest.fn(),
    };
});

// Import the router after mocks are set up
const voteRouter = require("../../routes/user/vote");

// Setup express app
const app = express();
app.use(express.json());
app.use("/vote", voteRouter);


describe("POST /vote", () => {
    const mockUser = {
        id: 1,
        username: "testvoter",
        password: "hashedpassword",
        uid_hash: crypto.randomBytes(32).toString('hex'),
    };
    const mockEciData = {
        ac_name: "Test AC",
        pc_name: "Test PC",
        ward_number: "123",
        enc_private_key: "encrypted_private_key_data",
    };
    const mockPrivateKey = "0x" + crypto.randomBytes(32).toString('hex');

    beforeEach(() => {
        // Clear all mock implementations and call history before each test
        jest.clearAllMocks();
    });

    test("should successfully cast a vote with valid credentials and data", async () => {
        // Arrange
        pool.query
            .mockResolvedValueOnce({ rows: [mockUser] }) // Mock user fetch
            .mockResolvedValueOnce({ rows: [mockEciData] }); // Mock ECI data fetch
        
        bcrypt.compare = jest.fn().mockResolvedValue(true);
        decrypt.mockReturnValue(mockPrivateKey);
        mockGetNonce.mockResolvedValue(1); // Mock nonce
        mockCastVoteMeta.mockResolvedValue({
            hash: "0x_mock_tx_hash",
            wait: jest.fn().mockResolvedValue({ status: 1 }),
        });

        // Act
        const response = await request(app)
            .post("/vote")
            .send({
                username: "testvoter",
                password: "password123",
                electionId: 1,
                candidateId: 0,
            });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Vote cast successfully!");
        expect(response.body.txHash).toBe("0x_mock_tx_hash");
        expect(mockCastVoteMeta).toHaveBeenCalled();
    });

    test("should return 401 for invalid password", async () => {
        // Arrange
        pool.query.mockResolvedValueOnce({ rows: [mockUser] });
        bcrypt.compare = jest.fn().mockResolvedValue(false); // Simulate wrong password

        // Act
        const response = await request(app)
            .post("/vote")
            .send({
                username: "testvoter",
                password: "wrongpassword",
                electionId: 1,
                candidateId: 0,
            });

        // Assert
        expect(response.status).toBe(401);
        expect(response.body.error).toBe("Invalid credentials.");
    });
    
    test("should return 404 if ECI data is not found for the user", async () => {
        // Arrange
        pool.query
            .mockResolvedValueOnce({ rows: [mockUser] }) // User found
            .mockResolvedValueOnce({ rows: [] }); // ECI data not found
        bcrypt.compare = jest.fn().mockResolvedValue(true);

        // Act
        const response = await request(app)
            .post("/vote")
            .send({
                username: "testvoter",
                password: "password123",
                electionId: 1,
                candidateId: 0,
            });
            
        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("User data not found in ECI records.");
    });

    test("should return 500 if the blockchain transaction fails", async () => {
        // Arrange
        pool.query
            .mockResolvedValueOnce({ rows: [mockUser] })
            .mockResolvedValueOnce({ rows: [mockEciData] });
        bcrypt.compare = jest.fn().mockResolvedValue(true);
        decrypt.mockReturnValue(mockPrivateKey);
        mockGetNonce.mockResolvedValue(1);
        mockCastVoteMeta.mockRejectedValue(new Error("Blockchain timeout")); // Simulate transaction error

        // Act
        const response = await request(app)
            .post("/vote")
            .send({
                username: "testvoter",
                password: "password123",
                electionId: 1,
                candidateId: 0,
            });
            
        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Blockchain timeout");
    });
});
