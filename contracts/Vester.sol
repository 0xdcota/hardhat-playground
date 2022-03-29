// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

// Contract based on Uniswap TreasuryVester.
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Vester {
    address public vestedUnderlying;
    address public recipient;

    uint256 public vestingAmount;
    uint256 public vestingBegin;
    uint256 public vestingCliff;
    uint256 public vestingEnd;

    uint256 public lastUpdate;

    constructor(
        address vestedUnderlying_,
        address recipient_,
        uint256 vestingAmount_,
        uint256 vestingBegin_,
        uint256 vestingCliff_,
        uint256 vestingEnd_
    ) {
        require(vestingBegin_ >= block.timestamp, "Vesting begin too early");
        require(vestingCliff_ >= vestingBegin_, "Cliff is too early");
        require(vestingEnd_ > vestingCliff_, "End is too early");

        vestedUnderlying = vestedUnderlying_;
        recipient = recipient_;

        vestingAmount = vestingAmount_;
        vestingBegin = vestingBegin_;
        vestingCliff = vestingCliff_;
        vestingEnd = vestingEnd_;

        lastUpdate = vestingBegin;
    }

    function setRecipient(address recipient_) public {
        require(msg.sender == recipient, "unauthorized");
        recipient = recipient_;
    }

    function claim() public {
        uint256 timestamp = block.timestamp;
        require(timestamp >= vestingCliff, "Not time yet");
        uint256 amount;
        if (timestamp >= vestingEnd) {
            amount = IERC20(vestedUnderlying).balanceOf(address(this));
        } else {
            amount =
                (vestingAmount * (timestamp - lastUpdate)) /
                (vestingEnd - vestingBegin);
            lastUpdate = timestamp;
        }
        IERC20(vestedUnderlying).transfer(recipient, amount);
    }
}
