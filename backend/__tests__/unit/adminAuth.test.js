const adminAuth = require("../../middleware/adminAuth");

// Set a consistent admin token for the test environment
process.env.ADMIN_TOKEN = "a-very-secret-test-token";

describe("Unit Test: Admin Authentication Middleware", () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;

    beforeEach(() => {
        // Reset mocks before each test to ensure a clean, isolated state
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            // Mock the status function to return the response object, allowing for chaining (e.g., res.status().json())
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });

    test("should call the next function if the correct admin token is provided", () => {
        // Arrange
        mockRequest.headers.authorization = "a-very-secret-test-token";

        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should return a 401 Unauthorized error if the token is incorrect", () => {
        // Arrange
        mockRequest.headers.authorization = "an-incorrect-token";

        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("should return a 401 Unauthorized error if the authorization header is missing", () => {
        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
