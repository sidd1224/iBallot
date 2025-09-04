const crypto = require("crypto");
const { generateVoterHash } = require("../../utils/hashUtils");

describe("Hashing Utilities (generateVoterHash)", () => {
    const referenceId = "123456789012";
    const secret = "a-very-secret-salt";

    test("should produce a deterministic hash for the same inputs", () => {
        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(referenceId, secret);

        // Assert
        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 in hex is 64 chars
    });

    test("should produce the correct SHA-256 hash value", () => {
        // Arrange
        const expectedInput = `${referenceId}${secret}`;
        const expectedHash = crypto.createHash("sha256").update(expectedInput).digest("hex");

        // Act
        const actualHash = generateVoterHash(referenceId, secret);

        // Assert
        expect(actualHash).toBe(expectedHash);
    });

    test("should produce a different hash if the reference ID changes", () => {
        // Arrange
        const differentReferenceId = "987654321098";

        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(differentReferenceId, secret);

        // Assert
        expect(hash1).not.toBe(hash2);
    });

    test("should produce a different hash if the secret salt changes", () => {
        // Arrange
        const differentSecret = "another-secret-salt";

        // Act
        const hash1 = generateVoterHash(referenceId, secret);
        const hash2 = generateVoterHash(referenceId, differentSecret);

        // Assert
        expect(hash1).not.toBe(hash2);
    });
});
