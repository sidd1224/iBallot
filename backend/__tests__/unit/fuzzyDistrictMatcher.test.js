// Mocks will be configured dynamically inside beforeEach to handle module-level state

describe("Unit Test: Fuzzy District Matcher", () => {
    let matchDistrictToAssembly;
    let mockQuery;

    beforeEach(() => {
        // This is crucial. It clears the module cache before each test,
        // forcing the fuzzyDistrictMatcher to be re-initialized.
        jest.resetModules();

        // Create a mock function that we can control in each test
        mockQuery = jest.fn();

        // Dynamically mock the database module. When the module under test
        // requires the database, it will get this mock instead.
        jest.doMock("../../database/db", () => ({
            query: mockQuery,
        }));

        // Now, require the module under test. It will be loaded fresh
        // and will use the mock we just configured.
        ({ matchDistrictToAssembly } = require("../../utils/fuzzyDistrictMatcher"));
    });

    test("should match an exact district name and return the assembly ID", async () => {
        // Arrange
        const mockDistricts = [{ district_name: "South Delhi" }];
        const mockAssembly = [{ assembly_id: 123 }];
        mockQuery
            .mockResolvedValueOnce({ rows: mockDistricts }) // For initialization
            .mockResolvedValueOnce({ rows: mockAssembly });  // For the final lookup

        // Act
        const result = await matchDistrictToAssembly("Delhi", "South Delhi");

        // Assert
        expect(result).toEqual({ assemblyId: 123, districtMatched: "south delhi" });
        expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test("should find a fuzzy match for a slightly misspelled district name", async () => {
        // Arrange
        const mockDistricts = [{ district_name: "North Goa" }];
        const mockAssembly = [{ assembly_id: 456 }];
        mockQuery
            .mockResolvedValueOnce({ rows: mockDistricts })
            .mockResolvedValueOnce({ rows: mockAssembly });

        // Act
        const result = await matchDistrictToAssembly("Goa", "Noth Goa"); // Misspelled

        // Assert
        expect(result).toEqual({ assemblyId: 456, districtMatched: "north goa" });
    });

    test("should return null if no close match is found", async () => {
        // Arrange
        const mockDistricts = [{ district_name: "Mumbai City" }];
        mockQuery.mockResolvedValueOnce({ rows: mockDistricts });

        // Act
        const result = await matchDistrictToAssembly("Maharashtra", "Completely Unrelated District");

        // Assert
        expect(result).toBeNull();
    });

    test("should return null if a district is matched but not for the specified state", async () => {
        // Arrange
        const mockDistricts = [{ district_name: "Jaipur" }];
        mockQuery
            .mockResolvedValueOnce({ rows: mockDistricts }) // Initialization succeeds
            .mockResolvedValueOnce({ rows: [] });           // Final lookup fails

        // Act
        const result = await matchDistrictToAssembly("Uttar Pradesh", "Jaipur"); // Jaipur is in Rajasthan

        // Assert
        expect(result).toBeNull();
    });

    test("should initialize only once when called multiple times", async () => {
        // Arrange
        const mockDistricts = [{ district_name: "Chennai" }];
        const mockAssembly = [{ assembly_id: 789 }];
        mockQuery
            .mockResolvedValueOnce({ rows: mockDistricts }) // This should only be called once
            .mockResolvedValue({ rows: mockAssembly });    // This will be called for each lookup

        // Act
        await matchDistrictToAssembly("Tamil Nadu", "Chennai");
        await matchDistrictToAssembly("Tamil Nadu", "Chennai");

        // Assert
        // The first query is for initialization, the next two are for lookups.
        expect(mockQuery).toHaveBeenCalledTimes(3);
        expect(mockQuery).toHaveBeenCalledWith("SELECT DISTINCT district_name FROM assembly_constituencies");
    });
});
