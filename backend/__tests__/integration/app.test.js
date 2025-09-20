const request = require("supertest");
const app = require("../../app");

// Mock all route handlers to isolate the app's setup for testing
jest.mock("../../routes/user/register", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/user/login", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/user/status", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/user/vote", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/user/candidateList", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/user/digilocker", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/admin/auth", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/admin/elections", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/admin/candidates", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/admin/results", () => (req, res) => res.sendStatus(200));
jest.mock("../../routes/admin/eciData", () => (req, res) => res.sendStatus(200));


describe("Express App Configuration (app.js)", () => {

    test("should use helmet for security headers", async () => {
        // Act
        const response = await request(app).get("/");
        // Assert
        // helmet sets a variety of headers, x-powered-by is a common one to check for its removal
        expect(response.headers["x-powered-by"]).toBeUndefined();
    });

    test("should correctly parse JSON request bodies", async () => {
        // Act
        const response = await request(app)
            .post("/login") // Using a mocked route
            .send({ user: "test" });
        // Assert
        // If express.json() is working, the mocked route will be reached and return 200
        expect(response.statusCode).toBe(200);
    });

    // Test suite for all mounted routes
    describe("Route Mounting", () => {
        // A helper array of routes to test
        const routes = [
            "/register",
            "/login",
            "/status",
            "/vote",
            "/candidates",
            "/digilocker",
            "/admin/auth",
            "/admin/elections",
            "/admin/candidates",
            "/admin/results",
            "/admin/eci-data",
        ];

        // Dynamically create a test for each route
        routes.forEach(route => {
            test(`should have the ${route} route mounted`, async () => {
                const response = await request(app).post(route); // Using POST as a default for most routes
                // We expect a 200 OK from our mock, not a 404 Not Found
                expect(response.statusCode).not.toBe(404);
                expect(response.statusCode).toBe(200);
            });
        });
    });

    test("should return a 404 for a non-existent route", async () => {
        // Act
        const response = await request(app).get("/a/non/existent/route");
        // Assert
        expect(response.statusCode).toBe(404);
    });
});
