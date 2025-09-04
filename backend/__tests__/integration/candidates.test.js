const request = require("supertest");
const express = require("express");
const fs = require("fs");
const path = require("path");

// Mock dependencies before any other imports
const mockAddCandidate = jest.fn();
const mockConnect = jest.fn(() => ({
    addCandidate: mockAddCandidate,
}));

jest.mock("../../middleware/adminAuth", () => (req, res, next) => next());
jest.mock("../../blockchain/contract", () => ({
    connect: mockConnect,
}));
jest.mock("ethers", () => {
    const originalEthers = jest.requireActual("ethers");
    return {
        ...originalEthers,
        Wallet: jest.fn(),
        JsonRpcProvider: jest.fn(),
    };
});

// Import the router after mocks are set up
const candidatesRouter = require("../../routes/admin/candidates");

// Setup express app
const app = express();
app.use("/candidates", candidatesRouter);

describe("POST /candidates/upload", () => {
    const uploadsDir = path.join(__dirname, "../../../uploads");
    const testCsvPath = path.join(uploadsDir, "test_candidates.csv");

    beforeAll(() => {
        // Create an uploads directory if it doesn't exist
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
        // Create a fresh CSV for each test
        const csvContent = "assemblyId,candidateName\n101,John Doe\n102,Jane Smith";
        fs.writeFileSync(testCsvPath, csvContent);
    });

    afterEach(() => {
        // Clean up the created test file if it exists
        if (fs.existsSync(testCsvPath)) {
            fs.unlinkSync(testCsvPath);
        }
    });

    test("should upload candidates successfully for an assembly election", async () => {
        // Arrange
        mockAddCandidate.mockResolvedValue({
            wait: jest.fn().mockResolvedValue({ status: 1 }),
        });

        // Act
        const response = await request(app)
            .post("/candidates/upload")
            .field("electionId", "1")
            .field("electionType", "ac")
            .attach("file", testCsvPath);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "✅ Upload complete", added: 2, failed: 0 });
        expect(mockAddCandidate).toHaveBeenCalledTimes(2);
        expect(mockAddCandidate).toHaveBeenCalledWith(1, 101, "John Doe");
        expect(mockAddCandidate).toHaveBeenCalledWith(1, 102, "Jane Smith");
    });

    test("should handle partial success when some candidates fail to be added", async () => {
        // Arrange
        // First candidate succeeds, second fails
        mockAddCandidate
            .mockResolvedValueOnce({ wait: jest.fn().mockResolvedValue({ status: 1 }) })
            .mockRejectedValueOnce(new Error("Blockchain transaction failed"));

        // Act
        const response = await request(app)
            .post("/candidates/upload")
            .field("electionId", "1")
            .field("electionType", "ac")
            .attach("file", testCsvPath);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: "✅ Upload complete", added: 1, failed: 1 });
    });
    
    test("should return 400 if electionId or electionType is missing", async () => {
        // Act
        const response = await request(app)
            .post("/candidates/upload")
            .field("electionId", "1")
            .attach("file", testCsvPath); // Missing electionType

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toContain("Missing or invalid");
    });

    test("should return 400 if no file is provided", async () => {
        // Act
        const response = await request(app)
            .post("/candidates/upload")
            .field("electionId", "1")
            .field("electionType", "ac");

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("CSV file not provided");
    });
});
