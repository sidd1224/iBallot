import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CandidateList from "../../pages/user/CandidateList";


const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useParams: () => ({ electionId: "1", assemblyId: "10" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        candidates: [
          {
            id: 101,
            name: "Alice",
            party_name: "Test Party",
            symbol: "symbol.png",
          },
        ],
      },
    }),
    post: vi.fn(),
  },
}));

describe("CandidateList page", () => {
  beforeEach(() => {
    sessionStorage.clear();
    mockNavigate.mockClear();
    sessionStorage.setItem(
      "user",
      JSON.stringify({ username: "sangam" })
    );
    sessionStorage.setItem("token", "test-token");
  });

  it("shows loading state initially", () => {
    render(<CandidateList />);
    expect(
      screen.getByText(/Loading Candidates.../i)
    ).toBeInTheDocument();
  });

  it("renders candidate and allows selection", async () => {
  render(<CandidateList />);

  await waitFor(() => {
    expect(screen.getAllByText(/Alice/i).length).toBeGreaterThan(0);
  });

  const [nameEl] = screen.getAllByText(/Alice/i);
  const candidateCard = nameEl.closest("div");
  if (!candidateCard) {
    throw new Error("Candidate card not found");
  }

  fireEvent.click(candidateCard);

  // There may be multiple password inputs due to double render.
  const passwordInputs = screen.getAllByPlaceholderText(
    /Enter your password to confirm vote/i
  );

  // At least one of them should now be enabled
  const hasEnabled = passwordInputs.some((input) => !input.disabled);
  expect(hasEnabled).toBe(true);
});

});
