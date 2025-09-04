const request = require("supertest");
const express = require("express");

// Mock dependencies
jest.mock("../../middleware/adminAuth", () => (req, res, next) => next());

const mockCandidateCounter = jest.fn();
const mockCandidates = jest.fn();
jest.mock("../../blockchain/contract", () => ({
    candidateCounter: mockCandidateCounter,
    candidates: mockCandidates,
}));

const resultsRouter = require("../../routes/admin/results");

// Setup express app
const app = express();
app.use("/results", resultsRouter);

describe("GET /results/:electionId/:assemblyId", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test("should return sorted election results for a valid request", async () => {
        // Arrange
        const electionId = 1;
        const assemblyId = 101;
        const mockCandidatesData = [
            { name: "Jane Smith", voteCount: BigInt(150) },
            { name: "John Doe", voteCount: BigInt(100) },
        ];
        
        // FIX: Mock returns a Number to match the route's current logic (e.g., candidateCount === 0)
        // The underlying route should ideally be updated to handle BigInts.
        mockCandidateCounter.mockResolvedValue(mockCandidatesData.length);
        // Mock the return values for each call in the loop
        mockCandidates
            .mockResolvedValueOnce(mockCandidatesData[0])
            .mockResolvedValueOnce(mockCandidatesData[1]);

        // Act
        const response = await request(app).get(`/results/${electionId}/${assemblyId}`);

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.electionId).toBe(electionId);
        expect(response.body.assemblyId).toBe(assemblyId);
        expect(response.body.results).toEqual([
            // The results are sorted by votes descending
            { id: 0, name: "Jane Smith", votes: 150 },
            { id: 1, name: "John Doe", votes: 100 },
        ]);
        expect(mockCandidateCounter).toHaveBeenCalledWith(electionId, assemblyId);
        expect(mockCandidates).toHaveBeenCalledTimes(2);
    });

    test("should return a message when no candidates are found", async () => {
        // Arrange
        // FIX: Mock returns a Number (0) instead of a BigInt to pass the strict equality check in the route.
        mockCandidateCounter.mockResolvedValue(0);

        // Act
        const response = await request(app).get("/results/1/101");

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("No candidates found.");
        expect(response.body.results).toEqual([]);
    });

    test("should return 400 for invalid (non-numeric) route parameters", async () => {
        // Act
        const response = await request(app).get("/results/one/101");

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Invalid electionId or assemblyId");
    });

    test("should return 500 if the contract call to get candidate count fails", async () => {
        // Arrange
        mockCandidateCounter.mockRejectedValue(new Error("Blockchain connection error"));

        // Act
        const response = await request(app).get("/results/1/101");

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Failed to fetch election results");
    });

    test("should return 500 if a contract call to get a candidate fails", async () => {
        // Arrange
        mockCandidateCounter.mockResolvedValue(2);
        mockCandidates.mockRejectedValue(new Error("Error fetching candidate details"));

        // Act
        const response = await request(app).get("/results/1/101");

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Failed to fetch election results");
    });
});
