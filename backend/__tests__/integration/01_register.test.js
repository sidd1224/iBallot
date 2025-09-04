const request = require("supertest");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = require("../../app");
const pool = require("../../database/db");

// 🔐 Generate dynamic reference ID
const mockRefId = "ABC" + Math.floor(Math.random() * 1e9).toString().padStart(9, "0");

// ✅ Mock Aadhaar XML parser
jest.mock("../../utils/xmlParser", () => ({
  parseAadhaarXML: jest.fn(() => ({
    reference_id: mockRefId,
    phone: null,
    dob: "01-01-2000",
    state_name: "Karnataka",
    district_name: "Bengaluru Urban",
    certificate_issuer: "CN=NIC, O=Gov",
    certificate_subject: "CN=UIDAI, OU=Aadhaar",
    issuer_verified: true,
  })),
}));

// ✅ Mock Firebase Admin
jest.mock("../../utils/firebaseAdmin", () => ({
  auth: () => ({
    verifyIdToken: jest.fn(() =>
      Promise.resolve({ phone_number: "+911234567890" })
    ),
  }),
}));

// ✅ Create mock Aadhaar XML file path
// In __tests__/integration/01_register.test.js
const mockAadhaarPath = path.join(__dirname, "../../adhaar/mock.xml");

beforeAll(async () => {
  // ⛔ Clean DB before test
  await pool.query("TRUNCATE TABLE voter_control, voter_metadata RESTART IDENTITY CASCADE");

  // 📄 Write mock Aadhaar XML
  const mockXml = `
    <PrintLetterBarcodeData uid="123456789012" name="Test User" dob="01-01-2000" gender="M"
      state="Karnataka" dist="Bengaluru Urban" pc="123" reference_id="${mockRefId}" />
  `;
  fs.writeFileSync(mockAadhaarPath, mockXml);
});

afterAll(async () => {
  // 🧹 Clean up mock file and DB connection
  if (fs.existsSync(mockAadhaarPath)) fs.unlinkSync(mockAadhaarPath);
  await pool.end();
});

describe("POST /register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app).post("/register").send({
      idToken: "mock_id_token",
      password: "securepassword",
      aadhaarFilePath: "mock.xml",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "✅ Registration successful");
    expect(res.body).toHaveProperty("voterHash");
  });

  it("should not allow duplicate Aadhaar registration", async () => {
    const res = await request(app).post("/register").send({
      idToken: "mock_id_token",
      password: "securepassword",
      aadhaarFilePath: "mock.xml",
    });

    expect([409, 400]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("error");
  });

  it("should fail when required fields are missing", async () => {
    const res = await request(app).post("/register").send({
      password: "securepassword",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Missing fields");
  });
});
