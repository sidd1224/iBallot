const crypto = require("crypto");
const { generateVoterHash } = require("../../utils/hashUtils");

describe("Unit Test: Hashing Utilities (generateVoterHash)", () => {
    const referenceId = "1234567890123456";
    const secret = "a-super-secret-salt-for-testing";

    test("should produce a deterministic hash for the same inputs", () => {
        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(referenceId, secret);

        // Assert
        expect(hash1).toBe(hash2);
        // A SHA-256 hash, when hex-encoded, is always 64 characters long.
        expect(hash1).toHaveLength(64);
    });

    test("should produce the correct and expected SHA-256 hash value", () => {
        // Arrange
        // This creates a known-good hash to compare against. It ensures the
        // underlying hashing logic doesn't change unexpectedly.
        const expectedInput = `${referenceId}${secret}`;
        const expectedHash = crypto.createHash("sha256").update(expectedInput).digest("hex");

        // Act
        const actualHash = generateVoterHash(referenceId, secret);

        // Assert
        expect(actualHash).toBe(expectedHash);
    });

    test("should produce a different hash if the reference ID changes", () => {
        // Arrange
        const differentReferenceId = "6543210987654321";

        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(differentReferenceId, secret);

        // Assert
        expect(hash1).not.toBe(hash2);
    });

    test("should produce a different hash if the secret salt changes", () => {
        // Arrange
        const differentSecret = "another-different-secret-salt";

        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(referenceId, differentSecret);

        // Assert
        expect(hash1).not.toBe(hash2);
    });
});
