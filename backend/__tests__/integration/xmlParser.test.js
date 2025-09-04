const fs = require('fs');
const { SignedXml } = require("xml-crypto");
const forge = require("node-forge");
const { parseAadhaarXML } = require("../../utils/xmlParser");

// Mock the entire fs module
jest.mock("fs");

// FIX: Create a persistent mock function for checkSignature
const mockCheckSignature = jest.fn();

// Mock the dependencies for signature validation and certificate parsing
jest.mock("xml-crypto", () => ({
    // Use the persistent mock function here
    SignedXml: jest.fn().mockImplementation(() => ({
        loadSignature: jest.fn(),
        checkSignature: mockCheckSignature,
        keyInfoProvider: {},
        validationErrors: [],
    })),
}));

jest.mock("node-forge", () => ({
    util: { decode64: jest.fn() },
    asn1: { fromDer: jest.fn() },
    pki: {
        certificateFromAsn1: jest.fn(),
        certificateFromPem: jest.fn(),
    },
}));

const mockGetElementsByTagName = jest.fn();
jest.mock("@xmldom/xmldom", () => ({
    DOMParser: jest.fn().mockImplementation(() => ({
        parseFromString: jest.fn().mockReturnValue({
            getElementsByTagName: mockGetElementsByTagName,
        }),
    })),
}));


describe("Aadhaar XML Parser", () => {
    // FIX: Changed attributes from `_code` to `code` to match the parser's expected format.
    const mockValidXml = `
        <KycRes code="123456789012">
            <UidData>
                <Poi phone="9876543210" dob="01-01-1990" />
            </UidData>
            <Signature>
                <KeyInfo>
                    <X509Data>
                        <X509Certificate>dGVzdGNlcnQ=</X509Certificate>
                    </X509Data>
                </KeyInfo>
            </Signature>
        </KycRes>
    `;

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock behavior for a valid signature node
        mockGetElementsByTagName.mockImplementation((tag) => {
            if (tag === "Signature") {
                return [{
                    getElementsByTagName: jest.fn(() => ([{
                        firstChild: { nodeValue: "dGVzdGNlcnQ=" } // base64 for "testcert"
                    }]))
                }];
            }
            return [];
        });
    });

    test("should successfully parse a valid and signed Aadhaar XML", () => {
        // Arrange
        fs.readFileSync.mockReturnValue(mockValidXml);
        mockCheckSignature.mockReturnValue(true);

        const mockCert = {
            issuer: { attributes: [{ name: "CN", value: "UIDAI" }] },
            subject: { attributes: [{ name: "CN", value: "Test User" }] },
        };
        forge.pki.certificateFromAsn1.mockReturnValue(mockCert);
        forge.pki.certificateFromPem.mockReturnValue({
            verify: jest.fn().mockReturnValue(true),
        });

        // Act
        const result = parseAadhaarXML("valid.xml");

        // Assert
        expect(result).toEqual({
            reference_id: "123456789012",
            phone: "9876543210",
            dob: "01-01-1990",
            certificate_issuer: "CN=UIDAI",
            certificate_subject: "CN=Test User",
            issuer_verified: true,
        });
    });

    test("should throw an error if the XML signature is invalid", () => {
        // Arrange
        fs.readFileSync.mockReturnValue(mockValidXml);
        mockCheckSignature.mockReturnValue(false);

        // Act & Assert
        expect(() => parseAadhaarXML("invalid_signature.xml")).toThrow(
            "Invalid or tampered Aadhaar XML"
        );
    });

    test("should throw an error if the signature node is missing", () => {
        // Arrange
        mockGetElementsByTagName.mockReturnValue([]); // Configure mock to find no signature
        const xmlWithoutSignature = `<KycRes code="123"></KycRes>`;
        fs.readFileSync.mockReturnValue(xmlWithoutSignature);

        // Act & Assert
        expect(() => parseAadhaarXML("no_signature.xml")).toThrow(
            "Invalid or tampered Aadhaar XML"
        );
    });

    test("should throw an error if the file is not an XML", () => {
        // Act & Assert
        expect(() => parseAadhaarXML("test.txt")).toThrow(
            "Invalid or tampered Aadhaar XML"
        );
    });
});
