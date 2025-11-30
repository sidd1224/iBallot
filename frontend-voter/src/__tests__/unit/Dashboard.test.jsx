import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Dashboard from "../../pages/user/Dashboard";


vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: { elections: [] },
    }),
  },
}));

describe("Dashboard page", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("greets user with username from sessionStorage", () => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({ username: "sangam", hasVoted: false })
    );
    sessionStorage.setItem(
      "constituency",
      JSON.stringify({ ac_id: 1, pc_id: 2 })
    );
    sessionStorage.setItem("token", "test-token");

    render(<Dashboard />);

    expect(
      screen.getByText(/Welcome, sangam!/i)
    ).toBeInTheDocument();
  });

  it("shows thank you message if user has already voted", () => {
    sessionStorage.setItem(
      "user",
      JSON.stringify({ username: "sangam", hasVoted: true })
    );
    sessionStorage.setItem(
      "constituency",
      JSON.stringify({ ac_id: 1, pc_id: 2 })
    );
    sessionStorage.setItem("token", "test-token");

    render(<Dashboard />);

    expect(
      screen.getByText(/Thank you for voting!/i)
    ).toBeInTheDocument();
  });
});
