const crypto = require("crypto");
const { encrypt, decrypt } = require("../../utils/aesUtils");

describe("AES Encryption/Decryption Utilities", () => {
    // Generate a consistent key for all tests in this suite
    const key = crypto.randomBytes(32); // 256-bit key

    test("should correctly encrypt and then decrypt a string", () => {
        // Arrange
        const originalData = "This is a secret message.";

        // Act
        const encryptedBlob = encrypt(originalData, key);
        const decryptedData = decrypt(encryptedBlob, key);

        // Assert
        // Check that the decrypted data matches the original
        expect(decryptedData.toString("utf8")).toBe(originalData);
        // Check that the encrypted data is a Buffer and not the same as the original
        expect(encryptedBlob).toBeInstanceOf(Buffer);
        expect(encryptedBlob).not.toEqual(Buffer.from(originalData));
    });

    test("should correctly encrypt and then decrypt a JSON object", () => {
        // Arrange
        const originalObject = { id: 123, user: "test", permissions: ["read", "write"] };
        const originalDataString = JSON.stringify(originalObject);

        // Act
        const encryptedBlob = encrypt(originalDataString, key);
        const decryptedData = decrypt(encryptedBlob, key);
        const decryptedObject = JSON.parse(decryptedData.toString("utf8"));

        // Assert
        expect(decryptedObject).toEqual(originalObject);
    });

    test("should fail decryption if the key is incorrect", () => {
        // Arrange
        const originalData = "Another secret.";
        const wrongKey = crypto.randomBytes(32); // A different 256-bit key

        // Act
        const encryptedBlob = encrypt(originalData, key);

        // Assert
        // Expect the decrypt function to throw an error when using the wrong key
        expect(() => {
            decrypt(encryptedBlob, wrongKey);
        }).toThrow("Unsupported state or unable to authenticate data");
    });

    test("should fail decryption if the encrypted blob is tampered with", () => {
        // Arrange
        const originalData = "Do not tamper with this data.";
        const encryptedBlob = encrypt(originalData, key);

        // Act: Tamper with the encrypted data by flipping a bit
        encryptedBlob[15] = encryptedBlob[15] ^ 1; 

        // Assert
        expect(() => {
            decrypt(encryptedBlob, key);
        }).toThrow("Unsupported state or unable to authenticate data");
    });
});
