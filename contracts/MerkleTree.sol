//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { PoseidonT3 } from "./Poseidon.sol"; //an existing library to perform Poseidon hash on solidity
import "./verifier.sol"; //inherits with the MerkleTreeInclusionProof verifier contract

contract MerkleTree is Verifier {
    uint256[] public hashes; // the Merkle tree in flattened array form
    uint256 public index = 0; // the current index of the first unfilled leaf
    uint256 public root; // the current Merkle root

    constructor() {
        // [assignment] initialize a Merkle tree of 8 with blank leaves
        hashes = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        hashes[8] = PoseidonT3.poseidon([hashes[0], hashes[1]]);
        hashes[9] = PoseidonT3.poseidon([hashes[2], hashes[3]]);
        hashes[10] = PoseidonT3.poseidon([hashes[4], hashes[5]]);
        hashes[11] = PoseidonT3.poseidon([hashes[6], hashes[7]]);
        hashes[12] = PoseidonT3.poseidon([hashes[8], hashes[9]]);
        hashes[13] = PoseidonT3.poseidon([hashes[10], hashes[11]]);
        hashes[14] = PoseidonT3.poseidon([hashes[12], hashes[13]]);
        root = hashes[14];
    }

    function insertLeaf(uint256 hashedLeaf) public returns (uint256) {
        // [assignment] insert a hashed leaf into the Merkle tree
        require(index < 7, "Tree is full");
        hashes[index] = hashedLeaf;

        uint256 hashValue;
        uint256 levelShift = 0;
        uint256 levelIndex = index;
        uint256 shiftedIndex = index;

        for (uint256 level = 3; level > 0; level--) {
            if (shiftedIndex % 2 == 0) {
                hashValue = PoseidonT3.poseidon([hashes[shiftedIndex], hashes[shiftedIndex + 1]]);
            } else {
                hashValue = PoseidonT3.poseidon([hashes[shiftedIndex - 1], hashes[shiftedIndex]]);
            }

            levelShift += 2 ** level;
            levelIndex = levelIndex >> 1;
            shiftedIndex = levelShift + levelIndex;
            hashes[shiftedIndex] = hashValue;
        }

        root = hashes[shiftedIndex];
        index += 1;
        return root;
    }

    function verify(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[1] memory input
        ) public view returns (bool) {

        // [assignment] verify an inclusion proof and check that the proof root matches current root
        return root == input[0] && Verifier.verifyProof(a, b, c, input);
    }
}
