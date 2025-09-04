const adminAuth = require("../../middleware/adminAuth");

// Set the environment variable for the tests
process.env.ADMIN_TOKEN = "secret-admin-token";

describe("Admin Authentication Middleware", () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;

    beforeEach(() => {
        // Reset mocks before each test
        mockRequest = {
            headers: {},
        };
        mockResponse = {
            status: jest.fn(() => mockResponse),
            json: jest.fn(),
        };
        nextFunction = jest.fn();
    });

    test("should call next() if the correct admin token is provided", () => {
        // Arrange
        mockRequest.headers.authorization = "secret-admin-token";

        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).toHaveBeenCalledTimes(1);
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    test("should return 401 Unauthorized if the token is incorrect", () => {
        // Arrange
        mockRequest.headers.authorization = "wrong-token";

        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    test("should return 401 Unauthorized if the authorization header is missing", () => {
        // Act
        adminAuth(mockRequest, mockResponse, nextFunction);

        // Assert
        expect(nextFunction).not.toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: "Unauthorized" });
    });
});
