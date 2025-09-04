const request = require("supertest");
const crypto = require("crypto");
const app = require("../../app");
const pool = require("../../database/db");

// 🔧 Central mock so we can override per test
const mockVerifyIdToken = jest.fn(() =>
  Promise.resolve({ phone_number: "+911234567890" })
);

// ✅ Mock Firebase Admin with shared mock function
jest.mock("../../utils/firebaseAdmin", () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

const phone = "+911234567890";
const phoneHash = crypto.createHash("sha256").update(phone).digest("hex");
const password = "securepassword";

afterAll(async () => {
  await pool.end();
});

describe("POST /login", () => {
  it("✅ should login successfully with correct credentials", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ phone_number: phone });

    const res = await request(app).post("/login").send({
      idToken: "mock_token",
      password,
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "✅ Login successful");
    expect(res.body).toHaveProperty("voterHash");
  });

  it("❌ should fail with incorrect password", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ phone_number: phone });

    const res = await request(app).post("/login").send({
      idToken: "mock_token",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Incorrect password");
  });

  it("❌ should fail with missing fields", async () => {
    const res = await request(app).post("/login").send({
      password,
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing fields");
  });

  it("❌ should fail if voter is not registered", async () => {
    const fakePhone = "+919999999999";
    const fakePhoneHash = crypto.createHash("sha256").update(fakePhone).digest("hex");

    await pool.query("DELETE FROM voter_metadata WHERE phone = $1", [fakePhoneHash]);

    mockVerifyIdToken.mockResolvedValueOnce({ phone_number: fakePhone });

    const res = await request(app).post("/login").send({
      idToken: "mock_token",
      password,
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Voter not registered");
  });
});
