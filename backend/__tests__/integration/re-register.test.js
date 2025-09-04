const request = require("supertest");
const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

// Mock dependencies
jest.mock("../../database/db");
jest.mock("../../utils/firebaseAdmin");
jest.mock("../../utils/fuzzyDistrictMatcher", () => jest.fn());
jest.mock("../../utils/xmlParser", () => ({
    parseAadhaarXML: jest.fn(),
}));


const pool = require("../../database/db");
const admin = require("../../utils/firebaseAdmin");
const matchDistrictToAssembly = require("../../utils/fuzzyDistrictMatcher");
const { parseAadhaarXML } = require("../../utils/xmlParser");

// Import the router to be tested
const reRegisterRouter = require("../../routes/user/re-register");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", reRegisterRouter);

describe("POST / (Re-registration Route)", () => {
    // A sample Aadhaar XML file will be created for tests
    const aadhaarDir = path.join(__dirname, "../../adhaar");
    const testAadhaarFile = "test_aadhaar_re_register.xml";
    const testXmlPath = path.join(aadhaarDir, testAadhaarFile);

    // Mock data
    const mockPhoneNumber = "+919876543210";
    const mockIdToken = "mock-firebase-id-token";
    const mockPassword = "newSecurePassword123";
    const mockRefId = "123456789012";
    const mockRefIdHash = crypto.createHash("sha256").update(mockRefId).digest("hex");
    const mockPhoneHash = crypto.createHash("sha256").update(mockPhoneNumber).digest("hex");

    beforeAll(() => {
        // Create a directory for Aadhaar files if it doesn't exist
        if (!fs.existsSync(aadhaarDir)) {
            fs.mkdirSync(aadhaarDir, { recursive: true });
        }
    });

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();

        // Mock Firebase Admin SDK
        admin.auth = jest.fn().mockReturnValue({
            verifyIdToken: jest.fn().mockResolvedValue({ phone_number: mockPhoneNumber }),
        });

        // Mock bcrypt hashing
        bcrypt.hash = jest.fn().mockResolvedValue("mockHashedPassword");
    });

    afterAll(() => {
        // Clean up the created test file
        if (fs.existsSync(testXmlPath)) {
            fs.unlinkSync(testXmlPath);
        }
    });

    test("should successfully re-register a user with valid data", async () => {
        // Arrange
        parseAadhaarXML.mockReturnValue({
            reference_id: mockRefId,
            dob: "01-01-1995", // Age > 18
            district_name: "Test District",
            state_name: "Test State",
        });
        pool.query
            // 1. Check if user exists (SELECT)
            .mockResolvedValueOnce({ rows: [{ phone: "some_old_phone_hash" }] })
            // 2. Update user data (UPDATE)
            .mockResolvedValueOnce({ rowCount: 1 });
        matchDistrictToAssembly.mockResolvedValue("ASSEMBLY_123");

        // Act
        const response = await request(app)
            .post("/")
            .send({
                idToken: mockIdToken,
                password: mockPassword,
                aadhaarFilePath: testAadhaarFile,
            });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("✅ Re-registration successful");
        expect(pool.query).toHaveBeenCalledTimes(2);
        expect(pool.query).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE voter_metadata"),
            expect.arrayContaining([mockPhoneHash, mockRefIdHash])
        );
    });

    test("should return 400 if required fields are missing", async () => {
        // Act
        const response = await request(app)
            .post("/")
            .send({ idToken: mockIdToken }); // Missing password and aadhaarFilePath

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing fields");
    });

    test("should return 403 if user is under 18", async () => {
        // Arrange
        parseAadhaarXML.mockReturnValue({
            reference_id: mockRefId,
            dob: "01-01-2015", // Makes user < 18
            district_name: "Test District",
            state_name: "Test State",
        });

        // Act
        const response = await request(app)
            .post("/")
            .send({
                idToken: mockIdToken,
                password: mockPassword,
                aadhaarFilePath: testAadhaarFile,
            });

        // Assert
        expect(response.status).toBe(403);
        expect(response.body.error).toBe("Must be 18+ to re-register");
    });

    test("should return 404 if no existing registration is found for the Aadhaar", async () => {
        // Arrange
        parseAadhaarXML.mockReturnValue({
            reference_id: mockRefId,
            dob: "01-01-1995",
            district_name: "Test District",
            state_name: "Test State",
        });
        pool.query.mockResolvedValueOnce({ rows: [] }); // Simulate no user found

        // Act
        const response = await request(app)
            .post("/")
            .send({
                idToken: mockIdToken,
                password: mockPassword,
                aadhaarFilePath: testAadhaarFile,
            });

        // Assert
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("No existing registration found for this Aadhaar");
    });

    test("should return 400 if district cannot be matched to an assembly", async () => {
        // Arrange
        parseAadhaarXML.mockReturnValue({
            reference_id: mockRefId,
            dob: "01-01-1995",
            district_name: "Unknown District",
            state_name: "Test State",
        });
        pool.query.mockResolvedValueOnce({ rows: [{ phone: "some_old_phone_hash" }] });
        matchDistrictToAssembly.mockResolvedValue(null); // Simulate match failure

        // Act
        const response = await request(app)
            .post("/")
            .send({
                idToken: mockIdToken,
                password: mockPassword,
                aadhaarFilePath: testAadhaarFile,
            });

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Could not match your district to any assembly");
    });

    test("should return 500 if there is a database error during SELECT", async () => {
        // Arrange
        parseAadhaarXML.mockReturnValue({
            reference_id: mockRefId,
            dob: "01-01-1995",
            district_name: "Test District",
            state_name: "Test State",
        });
        pool.query.mockRejectedValueOnce(new Error("DB Connection Error"));

        // Act
        const response = await request(app)
            .post("/")
            .send({
                idToken: mockIdToken,
                password: mockPassword,
                aadhaarFilePath: testAadhaarFile,
            });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Re-registration failed");
        expect(response.body.details).toBe("DB Connection Error");
    });
});
