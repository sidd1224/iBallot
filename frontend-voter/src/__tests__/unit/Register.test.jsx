import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Register from "../../pages/user/Register";


const mockSetUsername = vi.fn();
const mockSetPassword = vi.fn();

vi.mock("../../context/VerificationContext", () => ({
  useVerification: () => ({
    username: "testuser",
    setUsername: mockSetUsername,
    password: "pass123",
    setPassword: mockSetPassword,
    phoneNumber: "9999999999",
    verificationData: { name: "Test User" },
    isVerified: false, // not verified by default
  }),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../components/BrandLogo", () => ({
  default: () => <div>BrandLogo</div>,
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ToastContainer: () => null,
}));

describe("Register page", () => {
  it("disables Register button when Digilocker is not verified", () => {
    render(<Register />);

    const registerButton = screen.getByRole("button", { name: /Register/i });

    expect(registerButton).toBeDisabled();
  });
});
