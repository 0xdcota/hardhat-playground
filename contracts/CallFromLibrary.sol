// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Vault {
  mapping(address => uint ) public udeposits;
  function deposit(uint amount) public {
    udeposits[msg.sender] = amount;
   }
}

library LVault {
  address public constant VAULT_ADDRESS = 0xCfEB869F69431e42cdB54A4F4f105C19C080A601;
  function depositFromLibrary(uint amount) public {
    Vault _vault = Vault(0xCfEB869F69431e42cdB54A4F4f105C19C080A601);
    _vault.deposit(amount);
  }
}