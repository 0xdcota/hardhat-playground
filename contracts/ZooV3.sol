//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract ZooV3 is Initializable, OwnableUpgradeable, UUPSUpgradeable {

  struct Visit{
    uint256 adults;
    uint256 monkeyKids; // tested!, you can rename struct name in upgrades as long as type remains the same.
    uint256 timestamp;
  }

  // timestamp => Visit
  mapping (uint256 => Visit) public visits;

  uint256 public zebras;

  function initialize() public initializer {
     __Ownable_init();
      __UUPSUpgradeable_init();
  }
  
  function recordVisits(uint256 adults, uint256 monkeyKids) public {
    Visit memory vis_;
    vis_.adults = adults;
    vis_.monkeyKids = monkeyKids; // tested not possible to rename variable in struct in upgrades.
    vis_.timestamp = block.timestamp;
    visits[block.timestamp] = vis_;
  }

  function setZebras(uint _numZebras) public {
    zebras = _numZebras;
  }

  function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {
    require(newImplementation != address(0), "Wrong input");
  }

  function thisRevision() public pure returns(string memory version) {
    version = "3.0.0";
  }
}