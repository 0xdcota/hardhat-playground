//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./interfaces/IBalancerVault.sol";
import "./interfaces/IFlashLoanRecipient.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract Arbitro is Ownable, IFlashLoanRecipient {

    struct TradeInfo {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
    }

    address private _balancerVault;

    function withdraw(address receiver, address token) external onlyOwner {
        IERC20(token).transfer(
            receiver,
            IERC20(token).balanceOf(address(this))
        );
    }

    function getQuote(
      address exchangeRouter,
      address exchangePair,
      TradeInfo memory info
    ) public view returns(TradeInfo memory updatedInfo) {
      require(info.tokenIn == IUniswapV2Pair(exchangePair).token0(), "001");
      (uint256 reserve0, uint256 reserve1, )= IUniswapV2Pair(exchangePair).getReserves();
      info.amountOut = IUniswapV2Router01(exchangeRouter).getAmountOut(
        info.amountIn,
        reserve0,
        reserve1
      );
      updatedInfo = info;
    }

    function encodeInfo(
      address tokenIn_,
      address tokenOut_,
      uint128 amountIn_,
      uint128 amountOut_
    ) public pure returns(TradeInfo memory info) {
      info.tokenIn = tokenIn_;
      info.tokenOut = tokenOut_;
      info.amountIn = amountIn_;
      info.amountOut = amountOut_;
    }

    // function initiateFlashLoan(bytes memory data) external {
    //     data;
    //     IBalancerVault(_balancerVault).flashLoan(
    //         recipient,
    //         tokens,
    //         amounts,
    //         userData
    //     );
    // }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
      tokens;
      amounts;
      feeAmounts;
      userData;
        require(msg.sender == _balancerVault, "002");
    }
}
