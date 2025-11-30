import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { toast } from "react-toastify";
import DigilockerVerify from "../../pages/user/DigilockerVerify";



const mockSetPhoneNumber = vi.fn();
const mockSetVerificationData = vi.fn();
const mockSetIsVerified = vi.fn();

vi.mock("../../context/VerificationContext", () => ({
  useVerification: () => ({
    phoneNumber: "",
    setPhoneNumber: mockSetPhoneNumber,
    setVerificationData: mockSetVerificationData,
    setIsVerified: mockSetIsVerified,
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

vi.mock("axios", () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { success: true, data: { name: "Test User" } },
    }),
  },
}));

describe("DigilockerVerify page", () => {
  beforeEach(() => {
    mockSetPhoneNumber.mockClear();
    mockSetVerificationData.mockClear();
    mockSetIsVerified.mockClear();
  });

  it("keeps page rendered when Verify is clicked with empty phone number", () => {
    render(<DigilockerVerify />);

    const verifyButton = screen.getByRole("button", { name: /Verify/i });
    fireEvent.click(verifyButton);

    // Still on the same page, title visible
    expect(
      screen.getByText(/Verify Your Phone/i)
    ).toBeInTheDocument();
  });

  it("updates phone number through context setter", () => {
    render(<DigilockerVerify />);

    const phoneInput = screen.getByLabelText(/Phone Number/i);
    fireEvent.change(phoneInput, { target: { value: "9999999999" } });

    expect(mockSetPhoneNumber).toHaveBeenCalledWith("9999999999");
  });
});
