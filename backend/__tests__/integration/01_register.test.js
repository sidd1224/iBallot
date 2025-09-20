const request = require("supertest");
const pool = require("../../database/db");

// --- Mocks Setup ---

// 1. Mock the smart contract module first
jest.mock("../../blockchain/contract", () => {
  const mockAuthorizeVoter = jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue(true),
  });
  return {
    connect: jest.fn().mockReturnValue({
      authorizeVoter: mockAuthorizeVoter,
    }),
  };
});

// 2. Mock ethers Wallet as a class
jest.mock("ethers", () => {
  const originalEthers = jest.requireActual("ethers");
  return {
    ...originalEthers,
    Wallet: class {
      static createRandom() {
        return {
          address: "0xMockAddress",
          privateKey: "0xMockPrivateKey",
        };
      }
    },
  };
});

// 3. Import app AFTER all mocks
const app = require("../../app");

// Helper to access mockAuthorizeVoter for assertions
const { connect } = require("../../blockchain/contract");
const mockAuthorizeVoter = connect().authorizeVoter;

// --- Test Suite ---
describe("POST /register", () => {
  const mockPhoneNumber = "9876543210";
  const mockUid = "123456789012";
  const anotherMockPhone = "9999999999";
  const anotherMockUid = "987654321098";

  beforeAll(async () => {
    // Clean and seed the mock database before all tests
    await pool.query(
      "TRUNCATE TABLE users, eci_admin_data, digilocker_mock_data RESTART IDENTITY CASCADE"
    );
    await pool.query(
      `INSERT INTO digilocker_mock_data (phone_number, uid, dob, full_name) VALUES
       ($1, $2, '1990-01-01', 'Test User'),
       ($3, $4, '1991-01-01', 'Another User')`,
      [mockPhoneNumber, mockUid, anotherMockPhone, anotherMockUid]
    );
  });

  beforeEach(() => {
    // Clear mock history before each test
    mockAuthorizeVoter.mockClear();
  });

  afterAll(async () => {
    await pool.end();
  });

  it("should register a new user successfully with valid data", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        username: "testuser",
        password: "password123",
        phoneNumber: mockPhoneNumber,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "✅ Registration complete");
    expect(res.body).toHaveProperty("walletAddress");
    expect(mockAuthorizeVoter).toHaveBeenCalled();
  });

  it("should not allow registration with a duplicate username", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        username: "testuser", // duplicate
        password: "password123",
        phoneNumber: anotherMockPhone,
      });

    expect(res.statusCode).toBe(409);
    expect(res.body).toHaveProperty("error", "This username is already taken.");
  });

  it("should fail when required fields are missing", async () => {
    const res = await request(app)
      .post("/register")
      .send({
        username: "newuser", // missing password and phoneNumber
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing required fields.");
  });
});
