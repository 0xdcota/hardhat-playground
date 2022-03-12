//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IBalancerVault.sol";
import "./interfaces/IFlashLoanRecipient.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "hardhat/console.sol";

contract Arbitro is Ownable, IFlashLoanRecipient {
    struct TradeInfo {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
    }

    struct FlashLoanOps {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        address buyRouter;
        address sellRouter;
        address sellPair;
    }

    address private constant _BALANCERVAULT =
        0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    bytes32 private _dataHash;

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
    ) public view returns (uint256 amountOut) {
        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(exchangePair)
            .getReserves();
        uint256 reserveIn;
        uint256 reserveOut;
        if (IUniswapV2Pair(exchangePair).token0() == info.tokenIn) {
            reserveIn = reserve0;
            reserveOut = reserve1;
        } else {
            reserveIn = reserve1;
            reserveOut = reserve0;
        }
        amountOut = IUniswapV2Router02(exchangeRouter).getAmountOut(
            info.amountIn,
            reserveIn,
            reserveOut
        );
    }

    function getPairAddress(TradeInfo memory info, address exchangefactory)
        public
        view
        returns (address pair)
    {
        pair = IUniswapV2Factory(exchangefactory).getPair(
            info.tokenIn,
            info.tokenOut
        );
    }

    function encodeTradeInfo(
        address tokenIn_,
        address tokenOut_,
        uint128 amountIn_
    ) public pure returns (TradeInfo memory info) {
        info.tokenIn = tokenIn_;
        info.tokenOut = tokenOut_;
        info.amountIn = amountIn_;
    }

    function _simpleTrade(
        address exchangeRouter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin
    ) internal returns (uint256 amount) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        console.log("amountOutMin", amountOutMin);
        uint256[] memory amounts = IUniswapV2Router02(exchangeRouter)
            .swapExactTokensForTokens(
                amountIn,
                amountOutMin,
                path,
                address(this),
                // solhint-disable-next-line
                block.timestamp
            );
        amount = amounts[1];
    }

    function initiateFlashLoan(
        FlashLoanOps calldata flashinfo
    ) external onlyOwner {
        require(_dataHash == "", "001");
        _dataHash = keccak256(abi.encode(flashinfo));

        IERC20[] memory tokens = new IERC20[](1);
        uint256[] memory amounts = new uint256[](1);
        tokens[0] = IERC20(flashinfo.tokenIn);
        amounts[0] = flashinfo.amountIn;

        IBalancerVault(_BALANCERVAULT).flashLoan(
            IFlashLoanRecipient(address(this)),
            tokens,
            amounts,
            abi.encode(flashinfo)
        );
    }

    function receiveFlashLoan(
        IERC20[] memory tokens,
        uint256[] memory amounts,
        uint256[] memory feeAmounts,
        bytes memory userData
    ) external override {
        tokens;
        amounts;
        FlashLoanOps memory flashinfo = abi.decode(
            userData,
            (FlashLoanOps)
        );
        require(_dataHash == keccak256(abi.encode(flashinfo)), "002");
        require(msg.sender == _BALANCERVAULT, "003");

        console.log("flashinfo.amountIn", flashinfo.amountIn);

        IERC20(flashinfo.tokenIn).approve(
            flashinfo.buyRouter,
            flashinfo.amountIn
        );
        uint256 receivedAmount = _simpleTrade(
            flashinfo.buyRouter,
            flashinfo.tokenIn,
            flashinfo.tokenOut,
            flashinfo.amountIn,
            flashinfo.amountOut
        );
        console.log("First trade done");
        console.log("receivedAmount", receivedAmount);

        uint256 tradeExpected = getQuote(
            flashinfo.sellRouter,
            flashinfo.sellPair,
            encodeTradeInfo(flashinfo.tokenOut, flashinfo.tokenIn, uint128(receivedAmount))
        );

        console.log("tradeExpected", tradeExpected);

        IERC20(flashinfo.tokenOut).approve(
            flashinfo.sellRouter,
            receivedAmount
        );
        uint256 tokenBack = _simpleTrade(
            flashinfo.sellRouter,
            flashinfo.tokenOut,
            flashinfo.tokenIn,
            receivedAmount,
            tradeExpected
        );
        console.log("tokenBack", tokenBack);
        console.log("feeAmounts[0]",feeAmounts[0]);

        require(tokenBack > flashinfo.amountIn + feeAmounts[0], "004");
    }
}
