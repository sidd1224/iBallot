const request = require("supertest");
const express = require("express");
const path = require("path");

// Mock the xmlParser utility
jest.mock("../../utils/xmlParser", () => ({
    parseAadhaarXML: jest.fn(),
}));

const { parseAadhaarXML } = require("../../utils/xmlParser");
const extractPhoneRouter = require("../../routes/user/extract-phone");

// Setup express app
const app = express();
app.use(express.json());
app.use("/", extractPhoneRouter);

describe("POST / (Extract Phone Route)", () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    test("should return 200 and the phone number when found in the XML", async () => {
        // Arrange
        const mockPhone = "1234567890";
        parseAadhaarXML.mockReturnValue({ phone: mockPhone });

        // Act
        const response = await request(app)
            .post("/")
            .send({ aadhaarFilePath: "dummy/path.xml" });

        // Assert
        expect(response.status).toBe(200);
        expect(response.body.phone).toBe(mockPhone);
        expect(parseAadhaarXML).toHaveBeenCalledWith(expect.stringContaining("adhaar/dummy/path.xml"));
    });

    test("should return 400 if aadhaarFilePath is missing from the request body", async () => {
        // Act
        const response = await request(app)
            .post("/")
            .send({}); // Empty body

        // Assert
        expect(response.status).toBe(400);
        expect(response.body.error).toBe("Missing Aadhaar file path");
    });

    test("should return 422 if the phone number is not found in the parsed XML", async () => {
        // Arrange
        // Mock returns an object without a 'phone' property
        parseAadhaarXML.mockReturnValue({ reference_id: "1234" });

        // Act
        const response = await request(app)
            .post("/")
            .send({ aadhaarFilePath: "dummy/no_phone.xml" });

        // Assert
        expect(response.status).toBe(422);
        expect(response.body.error).toBe("Phone number not found in Aadhaar XML");
    });

    test("should return 500 if parseAadhaarXML throws an error", async () => {
        // Arrange
        const errorMessage = "Invalid XML format";
        parseAadhaarXML.mockImplementation(() => {
            throw new Error(errorMessage);
        });

        // Act
        const response = await request(app)
            .post("/")
            .send({ aadhaarFilePath: "dummy/invalid.xml" });

        // Assert
        expect(response.status).toBe(500);
        expect(response.body.error).toBe("Failed to extract phone from Aadhaar XML");
    });
});
