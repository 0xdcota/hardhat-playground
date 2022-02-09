// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ProofReader {
  bytes32 public merkleRoot;

  mapping(address => bool) public givePoints;

  constructor(bytes32 _merkleroot) {
    merkleRoot = _merkleroot;
  }

  function dummyEntryFunction(uint256 _aDummyNumber) external {
    _aDummyNumber; // Function should do something here ...
    _tryGetthePoints();
  }

  // Internal functions to extract proof

  function _tryGetthePoints() internal {
    (bool successGetProof, bytes32[] memory proof) = _getProofFromMessage();
    require(successGetProof, "Cannot extract proof!");
    require(_verify(msg.sender, proof), "cannot verify proof!");
    givePoints[msg.sender] = true;
  }

  function _verify(address userAddress, bytes32[] memory proof) internal view returns (bool) {
    bytes32 leaf = keccak256(abi.encodePacked(userAddress));
    return MerkleProof.verify(proof, merkleRoot, leaf);
  }

  function _getProofFromMessage() internal pure returns (bool success, bytes32[] memory proof) {
    uint8 dataSize;
    uint8 bytes32slots;
    uint8 proofcontent;
    assembly {
      dataSize := calldatasize()
      bytes32slots := div(sub(dataSize, 36), 32)
      proofcontent := sub(bytes32slots, 2)
    }
    require(dataSize > 100, "No proof detected!");

    bytes memory data = msg.data[100:dataSize];
    proof = _bytesToBytes32Array(data);

    require(proof.length == proofcontent, "build proof failed!");

    success = true;
  }

  function _bytesToBytes32Array(bytes memory data) private pure returns (bytes32[] memory) {
    // Find 32 bytes segments nb
    uint256 dataNb = data.length / 32;
    // Create an array of dataNb elements
    bytes32[] memory dataList = new bytes32[](dataNb);
    // Start array index at 0
    uint256 index = 0;
    // Loop all 32 bytes segments
    for (uint256 i = 32; i <= data.length; i = i + 32) {
      bytes32 temp;
      // Get 32 bytes from data
      assembly {
        temp := mload(add(data, i))
      }
      // Add extracted 32 bytes to list
      dataList[index] = temp;
      index++;
    }
    // Return data list
    return (dataList);
  }
}
