import hre from "hardhat";
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";

const { ethers } = hre;

describe("SignatureVault", function () {
  let signatureVault: any;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const SignatureVaultFactory = await ethers.getContractFactory("SignatureVault");
    signatureVault = await SignatureVaultFactory.deploy();
    // NO .deployed() in ethers-v6
  });

  it("should set the deployer as the owner", async function () {
    expect(await signatureVault.owner()).to.equal(owner.address);
  });

  it("owner can store a new signature hash", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("my-signature"));
    await signatureVault.storeHash(hash);
    const timestamp = await signatureVault.getSignatureTimestamp(hash);
    expect(Number(timestamp)).to.be.greaterThan(0);
  });

  it("should not allow storing the same hash twice", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("my-signature"));
    await signatureVault.storeHash(hash);

    await expect(signatureVault.storeHash(hash)).to.be.revertedWith(
      "Signature hash already exists"
    );
  });

  it("non-owner cannot store a hash", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("my-signature"));
    await expect(signatureVault.connect(addr1).storeHash(hash)).to.be.revertedWith(
      "Only the owner can perform this action"
    );
  });

  it("getSignatureTimestamp returns 0 for unknown hash", async function () {
    const hash = ethers.sha256(ethers.toUtf8Bytes("unknown"));
    const timestamp = await signatureVault.getSignatureTimestamp(hash);
    expect(Number(timestamp)).to.equal(0);
  });
});
