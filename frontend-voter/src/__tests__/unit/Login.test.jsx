import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../../pages/user/Login";


const mockSetUsername = vi.fn();
const mockSetPassword = vi.fn();

vi.mock("../../context/VerificationContext", () => ({
  useVerification: () => ({
    username: "",
    setUsername: mockSetUsername,
    password: "",
    setPassword: mockSetPassword,
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ToastContainer: () => null,
}));

vi.mock("../../components/BrandLogo", () => ({
  default: () => <div>BrandLogo</div>,
}));

describe("Login page", () => {
  it("renders login form with username and password", () => {
    render(<Login />);

    expect(screen.getByText(/Voter Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Log In/i })
    ).toBeInTheDocument();
  });

  it("updates username and password using context setters", () => {
    render(<Login />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    expect(mockSetUsername).toHaveBeenCalledWith("testuser");
    expect(mockSetPassword).toHaveBeenCalledWith("secret123");
  });
});
