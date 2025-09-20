const request = require("supertest");

// Mock the database pool
jest.mock("../../database/db", () => ({
  connect: jest.fn().mockResolvedValue({
    query: jest.fn(),
    release: jest.fn(),
  }),
}));

let app;
let pool;

describe("ECI Admin Data Routes", () => {
  beforeEach(() => {
    jest.resetModules();
    pool = require("../../database/db");
    app = require("../../app"); // import your Express app after mocking
  });

  it("GET /admin/eci-data returns all ECI admin data", async () => {
    const mockClient = await pool.connect();
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { uid_hash: "abcd1234", ac_name: "AC-1", pc_name: "PC-1", ward_number: "W1", wallet_address: "0xWallet", created_at: new Date(), updated_at: new Date(), username: "user1", full_name: "User One", phone_number: "1234567890" },
      ],
    });

    const res = await request(app).get("/admin/eci-data");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty("uid_hash", "abcd1234");
  });

  it("GET /admin/eci-data/:uid_hash returns specific voter data", async () => {
    const mockClient = await pool.connect();
    mockClient.query.mockResolvedValueOnce({
      rows: [
        { uid_hash: "abcd1234", ac_name: "AC-1", pc_name: "PC-1", ward_number: "W1", wallet_address: "0xWallet", created_at: new Date(), updated_at: new Date(), username: "user1", full_name: "User One", phone_number: "1234567890" },
      ],
    });

    const res = await request(app).get("/admin/eci-data/abcd1234");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("uid_hash", "abcd1234");
  });

  it("GET /admin/eci-data/:uid_hash returns 404 if voter not found", async () => {
    const mockClient = await pool.connect();
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/admin/eci-data/unknownHash");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Voter data not found");
  });

  it("GET /admin/eci-data/stats/summary returns summary statistics", async () => {
    const mockClient = await pool.connect();

    mockClient.query
      .mockResolvedValueOnce({ rows: [{ count: "100" }] }) // total voters
      .mockResolvedValueOnce({ rows: [{ ac_name: "AC-1", count: 60 }, { ac_name: "AC-2", count: 40 }] }) // voters by AC
      .mockResolvedValueOnce({ rows: [{ pc_name: "PC-1", count: 70 }, { pc_name: "PC-2", count: 30 }] }); // voters by PC

    const res = await request(app).get("/admin/eci-data/stats/summary");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("totalVoters", 100);
    expect(res.body.data.votersByAssembly).toHaveLength(2);
    expect(res.body.data.votersByParliament).toHaveLength(2);
  });
});
