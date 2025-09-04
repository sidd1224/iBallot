const request = require("supertest");
const app = require("../../app");

// ✅ Mock the smart contract module
jest.mock("../../blockchain/contract", () => {
  return {
    candidateCounter: jest.fn(),
    candidates: jest.fn()
  };
});

const contract = require("../../blockchain/contract");

describe("GET /candidates/:electionId/:assemblyId", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it("should return a list of candidates", async () => {
    const electionId = "E123";
    const assemblyId = "A456";

    // ✅ Setup mock responses
    contract.candidateCounter.mockResolvedValue(2);
    contract.candidates.mockImplementation((electionId, assemblyId, index) => {
      const mockCandidates = [
        { name: "Alice", voteCount: BigInt(42) },
        { name: "Bob", voteCount: BigInt(18) }
      ];
      return Promise.resolve(mockCandidates[index]);
    });

    const res = await request(app).get(`/candidates/${electionId}/${assemblyId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("candidates");
    expect(res.body.candidates.length).toBe(2);
    expect(res.body.candidates[0]).toEqual({ id: 0, name: "Alice", votes: "42" });
    expect(res.body.candidates[1]).toEqual({ id: 1, name: "Bob", votes: "18" });
  });

  it("should return 500 if contract call fails", async () => {
    // ❌ Simulate failure
    contract.candidateCounter.mockImplementationOnce(() => {
      throw new Error("Contract failure");
    });

    const res = await request(app).get("/candidates/X/Y");

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Failed to fetch candidates");
  });
});
