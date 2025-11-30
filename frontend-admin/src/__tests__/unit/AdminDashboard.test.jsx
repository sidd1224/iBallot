import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminDashboard from "../../pages/admin/adminDashboard";


// Clear sessionStorage before each test
beforeEach(() => {
  sessionStorage.clear();
});

describe("AdminDashboard component", () => {
  it("renders nothing when there is no adminToken", () => {
    const { container } = render(<AdminDashboard />);

    // When there is no adminToken, your component returns null
    expect(
      screen.queryByText(/Dashboard Summary/i)
    ).not.toBeInTheDocument();

    expect(container.firstChild).toBeNull();
  });
});
