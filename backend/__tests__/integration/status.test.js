const request = require("supertest");
const express = require("express");
const crypto = require("crypto");

// Create a persistent mock for the contract's method before other mocks
const mockHasVoted = jest.fn();

// Mock dependencies
jest.mock("../../database/db");
jest.mock("../../utils/aesUtils", () => ({
    decrypt: jest.fn(),
}));
jest.mock("../../utils/hashUtils", () => ({
    generateVoterHash: jest.fn(),
}));
jest.mock("ethers", () => {
    const originalEthers = jest.requireActual("ethers");
    // Mock the Contract constructor to return an object with our mock function
    return {
        ...originalEthers,
        Contract: jest.fn().mockImplementation(() => ({
            hasVoted: mockHasVoted,
        })),
    };
});

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");
// This require needs to come AFTER the mocks are configured
const statusRouter = require("../../routes/user/status");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", statusRouter);

describe("POST / (Voter Status Route)", () => {
    beforeEach(() => {
        // Clear all mocks before each test to ensure isolation
        jest.clearAllMocks();
        mockHasVoted.mockClear();
    });

    test("should return 200 with hasVoted: false for a valid, non-voted user", async () => {
        // Arrange
        const mockPhone = "1234567890";
        const mockSalt = "a1b2c3d4";
        const mockEncryptedBlob = "encryptedData";
        const mockDecryptedData = JSON.stringify({ reference_id: "ref123", phone: mockPhone });
        const mockVoterHash = "0xabc123";

        pool.query.mockResolvedValueOnce({
            rows: [{ encrypted_blob: mockEncryptedBlob, salt: mockSalt }],
        });
        decrypt.mockReturnValue(mockDecryptedData);
        generateVoterHash.mockReturnValue("abc123");
        mockHasVoted.mockResolvedValue(false);

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: mockPhone });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ voterHash: mockVoterHash, hasVoted: false });
    });

    test("should return 200 with hasVoted: true for a user who has already voted", async () => {
        // Arrange
        pool.query.mockResolvedValueOnce({
            rows: [{ encrypted_blob: "data", salt: "salt" }],
        });
        decrypt.mockReturnValue(JSON.stringify({ reference_id: "ref456" }));
        generateVoterHash.mockReturnValue("def456");
        mockHasVoted.mockResolvedValue(true);

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "0987654321" });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.hasVoted).toBe(true);
    });

    test("should return 400 if phone number is not provided", async () => {
        // Act
        const response = await request(app)
            .post("/")
            .send({});

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Phone required");
    });

    test("should return 404 if voter is not found in the database", async () => {
        // Arrange
        pool.query.mockResolvedValueOnce({ rows: [] });

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1112223333" });

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Voter not found");
    });

    test("should return 500 if the database query fails", async () => {
        // Arrange
        pool.query.mockRejectedValueOnce(new Error("DB Error"));

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1234567890" });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Status check failed");
        expect(response.body.details).toBe("DB Error");
    });

    test("should return 500 if the smart contract call fails", async () => {
        // Arrange
        pool.query.mockResolvedValueOnce({
            rows: [{ encrypted_blob: "data", salt: "salt" }],
        });
        decrypt.mockReturnValue(JSON.stringify({ reference_id: "ref789" }));
        generateVoterHash.mockReturnValue("ghi789");
        mockHasVoted.mockRejectedValue(new Error("Blockchain Error"));

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "4445556666" });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Status check failed");
        expect(response.body.details).toBe("Blockchain Error");
    });
});
