//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";

contract ZooV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {

  using StringsUpgradeable for uint256;

  struct Visit{
    uint256 adults;
    uint256 monkeyKids; // Need further testing for validation.
    string timestamp; // tested not possible to change type of variable in struct in upgrades, returns panic code 0x22
  }

  // timestamp => Visit
  mapping (uint256 => Visit) public visits;

  uint256 public camels; // tested!, you can rename public variable in upgrades as long as type remains the same.

  function initialize() public initializer {
     __Ownable_init();
      __UUPSUpgradeable_init();
  }
  
  function recordVisits(uint256 adults, uint256 monkeyKids) public {
    Visit memory vis_;
    vis_.adults = adults;
    vis_.monkeyKids = monkeyKids;
    vis_.timestamp = block.timestamp.toString();
    visits[block.timestamp] = vis_;
  }

  function setZebras(uint _numZebras) public {
    camels = _numZebras;
  }

  function _authorizeUpgrade(address newImplementation) internal view override onlyOwner {
    require(newImplementation != address(0), "Wrong input");
  }

  function thisRevision() public pure returns(string memory version) {
    version = "2.0.0";
  }
}