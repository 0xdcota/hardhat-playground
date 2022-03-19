//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IQuoter.sol";
import "./interfaces/ISwapRouter.sol";
import "./interfaces/IUniswapV3Factory.sol";
import "./interfaces/IBalancerVault.sol";
import "./interfaces/IFlashLoanRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract Arbitro is Ownable, IFlashLoanRecipient {
    struct TradeInfo {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 poolFee;
    }

    struct FlashLoanOps {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint24 poolFee;
        address sellRouter;
        address buyRouter;
        address buyPair;
    }

    address private constant _BALANCERVAULT =
        0xBA12222222228d8Ba445958a75a0704d566BF2C8;
    ISwapRouter private constant _IUNISWAPV3SWAPPER =
        ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IQuoter private constant _IUNISWAPV3QUOTER =
        IQuoter(0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6);
    IUniswapV3Factory private constant _IUNISWAPV3FACTORY =
        IUniswapV3Factory(0x1F98431c8aD98523631AE4a59f267346ea31F984);

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
    ) public returns (uint256 amountOut) {
        if (exchangeRouter == address(_IUNISWAPV3SWAPPER)) {
            amountOut = _getQuoteUniswapV3(info);
        } else {
            (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(
                exchangePair
            ).getReserves();
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
    }

    function _getQuoteUniswapV3(TradeInfo memory info)
        internal
        returns (uint256 amountOut)
    {
        amountOut = _IUNISWAPV3QUOTER.quoteExactInputSingle(
            info.tokenIn,
            info.tokenOut,
            info.poolFee,
            info.amountIn,
            0
        );
    }

    function getPairAddress(TradeInfo calldata info, address exchangefactory)
        public
        view
        returns (address pair)
    {
        if (exchangefactory == address(_IUNISWAPV3FACTORY)) {
            pair = _getPairAddressUniswapV3(info);
        } else {
            pair = IUniswapV2Factory(exchangefactory).getPair(
                info.tokenIn,
                info.tokenOut
            );
        }
    }

    function _getPairAddressUniswapV3(TradeInfo calldata info)
        internal
        view
        returns (address pair)
    {
        pair = _IUNISWAPV3FACTORY.getPool(
            info.tokenIn,
            info.tokenOut,
            info.poolFee
        );
    }

    function encodeTradeInfo(
        address tokenIn_,
        address tokenOut_,
        uint128 amountIn_,
        uint24 poolFee_
    ) public pure returns (TradeInfo memory info) {
        info.tokenIn = tokenIn_;
        info.tokenOut = tokenOut_;
        info.amountIn = amountIn_;
        info.poolFee = poolFee_;
    }

    function _simpleTrade(
        address exchangeRouter,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint24 poolFee
    ) internal returns (uint256 amount) {
        if (exchangeRouter == address(_IUNISWAPV3SWAPPER)) {
            amount = _simpleTradeUniswapV3(
                tokenIn,
                tokenOut,
                amountIn,
                amountOutMin,
                poolFee
            );
        } else {
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
            console.log("regular trade complete");
        }
    }

    function _simpleTradeUniswapV3(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        uint24 poolFee
    ) internal returns (uint256 amount) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(this),
                // solhint-disable-next-line
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: amountOutMin,
                sqrtPriceLimitX96: 0
            });
        amount = _IUNISWAPV3SWAPPER.exactInputSingle(params);
        console.log("uniswapv3 trade complete");
    }

    function initiateFlashLoan(FlashLoanOps calldata flashinfo)
        external
        onlyOwner
    {
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
        FlashLoanOps memory flashinfo = abi.decode(userData, (FlashLoanOps));
        require(_dataHash == keccak256(abi.encode(flashinfo)), "002");
        delete _dataHash;
        require(msg.sender == _BALANCERVAULT, "003");

        console.log("flashinfo.amountIn", flashinfo.amountIn);

        IERC20(flashinfo.tokenIn).approve(
            flashinfo.sellRouter,
            flashinfo.amountIn
        );

        uint256 receivedAmount = _simpleTrade(
            flashinfo.sellRouter,
            flashinfo.tokenIn,
            flashinfo.tokenOut,
            flashinfo.amountIn,
            flashinfo.amountOut,
            flashinfo.poolFee
        );
        console.log("First trade done");
        console.log("receivedAmount", receivedAmount);
        uint bal1 = IERC20(flashinfo.tokenOut).balanceOf(address(this));
        console.log("bal1",bal1);

        uint256 tradeExpected = getQuote(
            flashinfo.buyRouter,
            flashinfo.buyPair,
            encodeTradeInfo(
                flashinfo.tokenOut,
                flashinfo.tokenIn,
                uint128(receivedAmount),
                flashinfo.poolFee
            )
        );

        console.log("tradeExpected", tradeExpected);

        IERC20(flashinfo.tokenOut).approve(
            flashinfo.buyRouter,
            receivedAmount
        );

        uint256 tokenBack = _simpleTrade(
            flashinfo.buyRouter,
            flashinfo.tokenOut,
            flashinfo.tokenIn,
            receivedAmount,
            0,
            flashinfo.poolFee
        );
        console.log("tokenBack", tokenBack);
        uint bal2 = IERC20(flashinfo.tokenIn).balanceOf(address(this));
        console.log("bal2",bal2);

        console.log("feeAmounts[0]", feeAmounts[0]);

        require(bal2 > flashinfo.amountIn + feeAmounts[0], "004");
    }
}
