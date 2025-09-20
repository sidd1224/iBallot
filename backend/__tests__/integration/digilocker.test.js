const request = require("supertest");

// Mock database pool
jest.mock("../../database/db", () => ({
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}));

let app;
let pool;

describe("Digilocker Routes", () => {
  beforeEach(() => {
    jest.resetModules();
    pool = require("../../database/db");
    app = require("../../app"); // import your Express app after mocking
  });

  describe("POST /digilocker/verify-phone", () => {
    it("verifies a registered phone number successfully", async () => {
      const mockClient = await pool.connect();
      mockClient.query.mockResolvedValueOnce({
        rows: [
          { phone_number: "9876543210", uid: "uid123", dob: "2000-01-01", full_name: "Test User" },
        ],
      });

      const res = await request(app)
        .post("/digilocker/verify-phone")
        .send({ phoneNumber: "9876543210" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveProperty("verified", true);
      expect(res.body.data).toHaveProperty("age");
    });

    it("returns 400 if phone number is missing", async () => {
      const res = await request(app)
        .post("/digilocker/verify-phone")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Phone number is required");
    });

    it("returns 400 if phone number format is invalid", async () => {
      const res = await request(app)
        .post("/digilocker/verify-phone")
        .send({ phoneNumber: "12345" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "error",
        "Invalid phone number format. Please enter a valid 10-digit Indian mobile number."
      );
    });

    it("returns 404 if phone number not found", async () => {
      const mockClient = await pool.connect();
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post("/digilocker/verify-phone")
        .send({ phoneNumber: "9876543210" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty(
        "error",
        "Phone number not found in our records. Please ensure you're using a registered test phone number."
      );
    });

    it("returns 403 if user is under 18", async () => {
      const mockClient = await pool.connect();
      mockClient.query.mockResolvedValueOnce({
        rows: [
          { phone_number: "9876543210", uid: "uid123", dob: "2010-01-01", full_name: "Young User" },
        ],
      });

      const res = await request(app)
        .post("/digilocker/verify-phone")
        .send({ phoneNumber: "9876543210" });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/User must be at least 18 years old/);
    });
  });

  describe("GET /digilocker/test-users", () => {
    it("retrieves all test users", async () => {
      const mockClient = await pool.connect();
      mockClient.query.mockResolvedValueOnce({
        rows: [
          { phone_number: "9876543210", uid: "uid123", dob: "2000-01-01", full_name: "Test User" },
          { phone_number: "9876543211", uid: "uid124", dob: "1995-05-05", full_name: "Another User" },
        ],
      });

      const res = await request(app).get("/digilocker/test-users");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("success", true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty("uid", "uid123");
    });
  });
});
