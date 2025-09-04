const request = require("supertest");
const express = require("express");
const crypto = require("crypto");

// Mock dependencies before any other imports
const mockCastVoteMeta = jest.fn();
const mockGetNonce = jest.fn();
const mockConnect = jest.fn(() => ({
    getNonce: mockGetNonce,
    castVoteMeta: mockCastVoteMeta,
}));

jest.mock("../../database/db");
jest.mock("../../utils/aesUtils", () => ({ decrypt: jest.fn() }));
jest.mock("../../utils/hashUtils", () => ({ generateVoterHash: jest.fn() }));
jest.mock("../../blockchain/contract", () => ({
    connect: mockConnect,
}));
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

const pool = require("../../database/db");
const { decrypt } = require("../../utils/aesUtils");
const { generateVoterHash } = require("../../utils/hashUtils");
// Import the router after all mocks are set up
const voteRouter = require("../../routes/user/vote");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", voteRouter);

describe("POST / (Vote Casting Route)", () => {
    beforeEach(() => {
        // Clear mocks before each test
        jest.clearAllMocks();
    });

    test("should successfully cast a vote for a valid user", async () => {
        // Arrange
        const mockPhone = "1234567890";
        // FIX: assembly_id must be a number to be converted to a BigInt
        const mockMetadata = { reference_id: "ref123", assembly_id: 1 };
        const mockPrivateKey = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
        const mockVoterHashRaw = crypto.randomBytes(32).toString('hex');

        // Mock DB calls
        pool.query
            .mockResolvedValueOnce({ // Fetch metadata
                rows: [{ encrypted_blob: "enc_blob", salt: "salt" }],
            })
            .mockResolvedValueOnce({ // Fetch private key
                rows: [{ enc_private_key: "enc_key" }],
            });

        // Mock utility functions
        decrypt
            .mockReturnValueOnce(Buffer.from(JSON.stringify(mockMetadata))) // Decrypt metadata
            .mockReturnValueOnce(Buffer.from(mockPrivateKey)); // Decrypt private key
        generateVoterHash.mockReturnValue(mockVoterHashRaw);

        // Mock contract interactions
        mockGetNonce.mockResolvedValue(1);
        mockCastVoteMeta.mockResolvedValue({
            hash: "0x_tx_hash",
            wait: jest.fn().mockResolvedValue({ status: 1 }),
        });

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: mockPhone, electionId: 1, candidateId: 5 });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ success: true, txHash: "0x_tx_hash" });
        expect(mockCastVoteMeta).toHaveBeenCalled();
    });

    test("should return 400 if required fields are missing", async () => {
        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1234567890" }); // Missing electionId and candidateId

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing fields");
    });

    test("should return 404 if voter metadata is not found", async () => {
        // Arrange
        pool.query.mockResolvedValueOnce({ rows: [] });

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1234567890", electionId: 1, candidateId: 5 });

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Voter not found");
    });

    test("should return 404 if voter wallet (private key) is not found", async () => {
        // Arrange
        pool.query
            .mockResolvedValueOnce({ rows: [{ encrypted_blob: "enc_blob", salt: "salt" }] })
            .mockResolvedValueOnce({ rows: [] }); // No private key found
        decrypt.mockReturnValueOnce(Buffer.from(JSON.stringify({ reference_id: "ref123", assembly_id: 1 })));
        generateVoterHash.mockReturnValue(crypto.randomBytes(32).toString('hex'));

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1234567890", electionId: 1, candidateId: 5 });

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Voter wallet not found");
    });

    test("should return 500 if contract transaction fails", async () => {
        // Arrange
        pool.query
            .mockResolvedValueOnce({ rows: [{ encrypted_blob: "enc_blob", salt: "salt" }] })
            .mockResolvedValueOnce({ rows: [{ enc_private_key: "enc_key" }] });
        decrypt
            .mockReturnValueOnce(Buffer.from(JSON.stringify({ reference_id: "ref123", assembly_id: 1 })))
            .mockReturnValueOnce(Buffer.from("priv_key"));
        generateVoterHash.mockReturnValue(crypto.randomBytes(32).toString('hex'));
        mockGetNonce.mockResolvedValue(1);
        mockCastVoteMeta.mockRejectedValue(new Error("Gas fee too low"));

        // Act
        const response = await request(app)
            .post("/")
            .send({ phone: "1234567890", electionId: 1, candidateId: 5 });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe("Gas fee too low");
    });
});
