import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import AdminLogin from "../../pages/admin/adminLogin";

// 🔹 Mock react-router-dom's useNavigate so component doesn't need a real Router
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

describe("AdminLogin component", () => {
  it("renders heading, input and button", () => {
    render(<AdminLogin />);

    // Check heading text
    expect(
      screen.getByText(/iBallot Admin Panel/i)
    ).toBeInTheDocument();

    // Check input label
    expect(
      screen.getByLabelText(/Admin Token/i)
    ).toBeInTheDocument();

    // Check Login button
    expect(
      screen.getByRole("button", { name: /login/i })
    ).toBeInTheDocument();
  });

  it("updates token when typing", () => {
    render(<AdminLogin />);

    const input = screen.getByLabelText(/Admin Token/i);

    fireEvent.change(input, { target: { value: "my-token" } });

    expect(input).toHaveValue("my-token");
  });
});
