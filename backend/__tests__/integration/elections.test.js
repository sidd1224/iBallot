const request = require("supertest");
const express = require("express");

// Mock dependencies
jest.mock("../../middleware/adminAuth", () => (req, res, next) => next());
jest.mock("../../database/db");

const pool = require("../../database/db");
const electionsRouter = require("../../routes/admin/elections");

// Setup express app
const app = express();
app.use(express.json());
app.use("/elections", electionsRouter);

describe("Admin Elections Routes", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe("POST /elections", () => {
        const validElectionData = {
            electionId: 101,
            name: "State Assembly Election 2024",
            type: "ac",
            startTime: "2024-10-01T00:00:00Z",
            endTime: "2024-10-30T23:59:59Z",
            statesEnabled: ["StateA", "StateB"],
        };

        test("should create an election successfully", async () => {
            // Arrange
            pool.query.mockResolvedValue({ rowCount: 1 });

            // Act
            const response = await request(app)
                .post("/elections")
                .send(validElectionData);

            // Assert
            expect(response.status).toBe(201);
            expect(response.body.message).toBe("✅ Election created successfully");
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        test("should return 400 if required fields are missing", async () => {
            // Arrange
            const { name, ...incompleteData } = validElectionData;

            // Act
            const response = await request(app)
                .post("/elections")
                .send(incompleteData);

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Missing required fields");
        });

        test("should return 400 for an invalid election type", async () => {
            // Act
            const response = await request(app)
                .post("/elections")
                .send({ ...validElectionData, type: "invalid_type" });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Invalid election type. Must be 'ac' or 'pc'");
        });

        test("should return 400 if end time is less than 1 day after start time", async () => {
            // Act
            const response = await request(app)
                .post("/elections")
                .send({ ...validElectionData, endTime: validElectionData.startTime });

            // Assert
            expect(response.status).toBe(400);
            expect(response.body.error).toBe("End time must be at least 1 day after start time");
        });

        test("should return 500 if the database query fails", async () => {
            // Arrange
            pool.query.mockRejectedValue(new Error("DB insert failed"));

            // Act
            const response = await request(app)
                .post("/elections")
                .send(validElectionData);

            // Assert
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Failed to create election");
        });
    });

    describe("GET /elections", () => {
        test("should return a list of all elections", async () => {
            // Arrange
            const mockElections = [
                { id: 1, name: "Election A" },
                { id: 2, name: "Election B" },
            ];
            pool.query.mockResolvedValue({ rows: mockElections });

            // Act
            const response = await request(app).get("/elections");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.elections).toEqual(mockElections);
        });

        test("should return an empty list if no elections are found", async () => {
            // Arrange
            pool.query.mockResolvedValue({ rows: [] });

            // Act
            const response = await request(app).get("/elections");

            // Assert
            expect(response.status).toBe(200);
            expect(response.body.elections).toEqual([]);
        });

        test("should return 500 if the database query fails", async () => {
            // Arrange
            pool.query.mockRejectedValue(new Error("DB select failed"));

            // Act
            const response = await request(app).get("/elections");

            // Assert
            expect(response.status).toBe(500);
            expect(response.body.error).toBe("Failed to fetch elections");
        });
    });
});
