const request = require("supertest");
const { Contract } = require("ethers");

// Mock database
const mockQuery = jest.fn();
const mockRelease = jest.fn();
jest.mock("../../database/db", () => ({
  connect: jest.fn().mockResolvedValue({
    query: mockQuery,
    release: mockRelease,
  }),
}));
const pool = require("../../database/db");

// Mock ethers Contract
const mockHasVoted = jest.fn();
jest.mock("ethers", () => {
  const original = jest.requireActual("ethers");
  return {
    ...original,
    Contract: jest.fn().mockImplementation(() => ({
      hasVoted: mockHasVoted,
    })),
  };
});

let app;

describe("POST /status", () => {
  beforeEach(() => {
    jest.resetModules();
    app = require("../../app"); // Import app after mocks

    // Reset mocks
    mockQuery.mockReset();
    mockRelease.mockReset();
    mockHasVoted.mockReset();
  });

  it("returns voting status successfully", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ uid_hash: "abcd1234" }] }) // user query
      .mockResolvedValueOnce({
        rows: [
          {
            ac_name: "AC-1",
            pc_name: "PC-1",
            ward_number: 5,
            wallet_address: "0xWalletAddress",
          },
        ],
      }); // ECI data query
    mockHasVoted.mockResolvedValueOnce(true);

    const res = await request(app)
      .post("/status")
      .send({ username: "user1" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("voterHash", "0xabcd1234");
    expect(res.body).toHaveProperty("hasVoted", true);
    expect(res.body.constituency).toHaveProperty("assembly", "AC-1");
    expect(res.body.constituency).toHaveProperty("parliament", "PC-1");
    expect(res.body.constituency).toHaveProperty("ward", 5);
    expect(res.body).toHaveProperty("walletAddress", "0xWalletAddress");
  });

  it("returns 404 if user not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // user not found

    const res = await request(app)
      .post("/status")
      .send({ username: "nouser" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Voter not found.");
  });

  it("returns 400 if username missing", async () => {
    const res = await request(app).post("/status").send({}); // no username

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Username is required.");
  });

  it("handles smart contract errors gracefully", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ uid_hash: "abcd1234" }] });
    mockHasVoted.mockRejectedValueOnce(new Error("Contract failure"));

    const res = await request(app)
      .post("/status")
      .send({ username: "user1" });

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to check voter status");
    expect(res.body).toHaveProperty("details", "Contract failure");
  });
});
