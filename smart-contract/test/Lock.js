const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting (Meta Only)", function () {
  let contract;
  let owner;
  let voter1;
  let voterHash;
  const electionId = 1001; // Simulated election ID

  beforeEach(async function () {
    [owner, voter1] = await ethers.getSigners();
    const Voting = await ethers.getContractFactory("Voting");
    contract = await Voting.deploy();
    await contract.waitForDeployment();

    const now = Math.floor(Date.now() / 1000);
    await contract.startElection(now - 10, now + 3600);

    await contract.addCandidate(electionId, 0, "Candidate A");

    voterHash = ethers.keccak256(ethers.toUtf8Bytes("voter1"));

    // ✅ Authorize voter1
    await contract.authorizeVoter(voterHash, voter1.address);
  });

  function signVote(voter, electionId, voterHash, candidateId, assemblyId, nonce, deadline) {
    const messageHash = ethers.solidityPackedKeccak256(
      ["uint256", "bytes32", "uint256", "uint256", "uint256", "uint256"],
      [electionId, voterHash, candidateId, assemblyId, nonce, deadline]
    );
    return voter.signMessage(ethers.getBytes(messageHash));
  }

  it("should allow meta-transaction voting", async function () {
    const assemblyId = 0;
    const candidateId = 0;
    const nonce = await contract.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const signature = await signVote(voter1, electionId, voterHash, candidateId, assemblyId, nonce, deadline);

    await contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature);

    const count = await contract.getVoteCount(electionId, assemblyId, candidateId);
    expect(count).to.equal(1);
  });

  it("should emit VoteCast event", async function () {
    const assemblyId = 0;
    const candidateId = 0;
    const nonce = await contract.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const signature = await signVote(voter1, electionId, voterHash, candidateId, assemblyId, nonce, deadline);

    await expect(contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature))
      .to.emit(contract, "VoteCast")
      .withArgs(electionId, voterHash, candidateId);
  });

  it("should reject reused meta vote (already voted)", async function () {
    const assemblyId = 0;
    const candidateId = 0;
    const nonce = await contract.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const signature = await signVote(voter1, electionId, voterHash, candidateId, assemblyId, nonce, deadline);

    await contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature);

    await expect(
      contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature)
    ).to.be.revertedWith("Already voted in this election");
  });

  it("should reject expired signature", async function () {
    const assemblyId = 0;
    const candidateId = 0;
    const nonce = await contract.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) - 10; // expired
    const signature = await signVote(voter1, electionId, voterHash, candidateId, assemblyId, nonce, deadline);

    await expect(
      contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature)
    ).to.be.revertedWith("Signature expired");
  });

  it("should reject signature from wrong signer", async function () {
    const assemblyId = 0;
    const candidateId = 0;
    const nonce = await contract.getNonce(electionId, voterHash);
    const deadline = Math.floor(Date.now() / 1000) + 600;
    const signature = await signVote(owner, electionId, voterHash, candidateId, assemblyId, nonce, deadline); // signed by wrong person

    await expect(
      contract.castVoteMeta(electionId, voterHash, candidateId, assemblyId, deadline, signature)
    ).to.be.revertedWith("Invalid signer");
  });
});
