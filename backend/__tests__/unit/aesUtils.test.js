const crypto = require("crypto");
const { encrypt, decrypt } = require("../../utils/aesUtils");

describe("Unit Test: AES Encryption/Decryption Utilities", () => {
    // Generate a consistent 32-byte (256-bit) key for all tests in this suite
    const key = crypto.randomBytes(32);

    test("should correctly encrypt and then decrypt a simple string", () => {
        // Arrange
        const originalData = "This is a secret message for the unit test.";

        // Act
        const encryptedBlob = encrypt(originalData, key);
        const decryptedData = decrypt(encryptedBlob, key);

        // Assert
        // Check that the decrypted data matches the original
        expect(decryptedData.toString("utf8")).toBe(originalData);
        // Check that the encrypted data is a Buffer and is not the same as the original
        expect(encryptedBlob).toBeInstanceOf(Buffer);
        expect(encryptedBlob).not.toEqual(Buffer.from(originalData));
    });

    test("should correctly encrypt and then decrypt a JSON object", () => {
        // Arrange
        const originalObject = { userId: 5, role: "admin", permissions: ["create", "read", "update"] };
        const originalDataString = JSON.stringify(originalObject);

        // Act
        const encryptedBlob = encrypt(originalDataString, key);
        const decryptedData = decrypt(encryptedBlob, key);
        const decryptedObject = JSON.parse(decryptedData.toString("utf8"));

        // Assert
        expect(decryptedObject).toEqual(originalObject);
    });

    test("should throw an error if the decryption key is incorrect", () => {
        // Arrange
        const originalData = "This data is sensitive.";
        const wrongKey = crypto.randomBytes(32); // A different 256-bit key

        // Act
        const encryptedBlob = encrypt(originalData, key);

        // Assert
        // Expect the decrypt function to throw an error when using the wrong key.
        // The specific error message comes from the underlying crypto library.
        expect(() => {
            decrypt(encryptedBlob, wrongKey);
        }).toThrow("Unsupported state or unable to authenticate data");
    });

    test("should throw an error if the encrypted data is tampered with", () => {
        // Arrange
        const originalData = "This data must not be altered.";
        const encryptedBlob = encrypt(originalData, key);

        // Act: Tamper with the encrypted data by flipping a bit in the middle.
        // This should invalidate the GCM authentication tag.
        encryptedBlob[15] = encryptedBlob[15] ^ 1; 

        // Assert
        expect(() => {
            decrypt(encryptedBlob, key);
        }).toThrow("Unsupported state or unable to authenticate data");
    });
});
