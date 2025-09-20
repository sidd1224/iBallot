const request = require("supertest");
const bcrypt = require("bcrypt");

// Mock the database pool
jest.mock("../../database/db", () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}));

// Mock ethers Contract for hasVoted
jest.mock("ethers", () => {
  const actual = jest.requireActual("ethers");
  return {
    ...actual,
    Contract: jest.fn().mockImplementation(() => ({
      hasVoted: jest.fn().mockResolvedValue(true), // Mocked blockchain response
    })),
    JsonRpcProvider: jest.fn(),
  };
});

let app;
let pool;
let votingContract;

describe("POST /login", () => {
  beforeEach(() => {
    jest.resetModules();
    pool = require("../../database/db");
    app = require("../../app"); // Import after mocks
    const { Contract } = require("ethers");
    votingContract = new Contract();
  });

  it("logs in successfully with correct credentials", async () => {
    // Mock DB responses
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 1, username: "user1", uid_hash: "abcd1234", password: await bcrypt.hash("password123", 10), full_name: "User One", phone_number: "1234567890" }] }) // user query
      .mockResolvedValueOnce({ rows: [{ ac_name: "AC-1", pc_name: "PC-1", ward_number: "W1", wallet_address: "0xWallet" }] }) // eci_admin_data query
      .mockResolvedValueOnce({}); // last login update

    const res = await request(app)
      .post("/login")
      .send({ username: "user1", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message", "✅ Login successful");
    expect(res.body).toHaveProperty("voterHash", "0xabcd1234");
    expect(res.body).toHaveProperty("hasVoted", true);
    expect(res.body.user).toHaveProperty("username", "user1");
    expect(res.body.constituency).toHaveProperty("assembly", "AC-1");
  });

  it("returns 401 for invalid credentials", async () => {
    const mockClient = await pool.connect();
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // user not found

    const res = await request(app)
      .post("/login")
      .send({ username: "wronguser", password: "password123" });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid credentials.");
  });

  it("returns 400 if username or password is missing", async () => {
    const res = await request(app).post("/login").send({ username: "user1" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Username and password are required.");
  });

  it("handles missing ECI data gracefully", async () => {
    const mockClient = await pool.connect();
    mockClient.query
      .mockResolvedValueOnce({ rows: [{ id: 1, username: "user1", uid_hash: "abcd1234", password: await bcrypt.hash("password123", 10), full_name: "User One", phone_number: "1234567890" }] }) // user query
      .mockResolvedValueOnce({ rows: [] }); // ECI data missing

    const res = await request(app)
      .post("/login")
      .send({ username: "user1", password: "password123" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "User data not found in ECI records.");
  });
});
