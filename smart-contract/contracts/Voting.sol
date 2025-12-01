// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Voting is ReentrancyGuard {
    using ECDSA for bytes32;

    address public admin;
    uint public startTime;
    uint public endTime;

    struct Candidate {
        string name;
        uint voteCount;
    }

    // Mapping: electionId => assemblyId => candidateId => Candidate
    mapping(uint => mapping(uint => mapping(uint => Candidate))) public candidates;

    // Mapping: electionId => assemblyId => number of candidates
    mapping(uint => mapping(uint => uint)) public candidateCounter;

    // --- PERFORMANCE FIX: Add a counter for total votes per election ---
    mapping(uint => uint) public totalVotesPerElection;

    // Voter controls per election
    mapping(uint => mapping(bytes32 => bool)) public hasVoted;
    mapping(uint => mapping(bytes32 => uint256)) public voterNonce;
    mapping(bytes32 => address) public authorizedVoter;

    event VoteCast(uint indexed electionId, bytes32 indexed voterHash, uint candidateId);
    event VoterAuthorized(bytes32 indexed voterHash, address indexed voterAddress);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyDuringElection() {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Voting not active");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // Admin starts the election
    function startElection(uint _startTime, uint _endTime) public onlyAdmin {
        startTime = _startTime;
        endTime = _endTime;
    }

    // Admin adds a candidate to an election + assembly
    function addCandidate(uint electionId, uint assemblyId, string memory name) public onlyAdmin {
        uint id = candidateCounter[electionId][assemblyId];
        candidates[electionId][assemblyId][id] = Candidate(name, 0);
        candidateCounter[electionId][assemblyId]++;
    }

    // --- ADDED BACK: Admin adds multiple candidates in bulk ---
    function addCandidates(uint electionId, uint assemblyId, string[] memory names) public onlyAdmin {
         uint currentId = candidateCounter[electionId][assemblyId];
         for (uint i = 0; i < names.length; i++) {
            candidates[electionId][assemblyId][currentId] = Candidate(names[i], 0);
            currentId++;
         }
         candidateCounter[electionId][assemblyId] = currentId;
    }

    // Admin authorizes a voterHash ↔ address
    function authorizeVoter(bytes32 voterHash, address voter) public onlyAdmin {
        authorizedVoter[voterHash] = voter;
        emit VoterAuthorized(voterHash, voter);
    }

    // Meta-transaction voting
    function castVoteMeta(
        uint electionId,
        bytes32 voterHash,
        uint candidateId,
        uint assemblyId,
        uint deadline,
        bytes memory signature
    ) public nonReentrant onlyDuringElection {
        require(!hasVoted[electionId][voterHash], "Already voted in this election");
        require(block.timestamp <= deadline, "Signature expired");

        uint nonce = voterNonce[electionId][voterHash];

        // Create signed message
        bytes32 messageHash = keccak256(
            abi.encodePacked(electionId, voterHash, candidateId, assemblyId, nonce, deadline)
        ).toEthSignedMessageHash();

        // Recover signer from signature
        address signer = messageHash.recover(signature);
        require(signer == authorizedVoter[voterHash], "Invalid signer");

        // Update state
        hasVoted[electionId][voterHash] = true;
        voterNonce[electionId][voterHash]++;
        candidates[electionId][assemblyId][candidateId].voteCount++;

        // --- PERFORMANCE FIX: Increment the total vote counter ---
        totalVotesPerElection[electionId]++;

        emit VoteCast(electionId, voterHash, candidateId);
    }

    // View functions
    function getVoteCount(uint electionId, uint assemblyId, uint candidateId) public view returns (uint) {
        return candidates[electionId][assemblyId][candidateId].voteCount;
    }

    // --- PERFORMANCE FIX: Add a getter for the total vote count ---
    function getTotalVotes(uint electionId) public view returns (uint) {
        return totalVotesPerElection[electionId];
    }

    function getNonce(uint electionId, bytes32 voterHash) public view returns (uint) {
        return voterNonce[electionId][voterHash];
    }

    function isAuthorized(bytes32 voterHash) public view returns (address) {
        return authorizedVoter[voterHash];
    }
}

