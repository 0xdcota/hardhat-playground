const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ASSETS, EXCHANGES } = require("./utils.js");

describe("Arbitro System Tests", function () {

  let arbitro;

  const amountToFlashLoan = 1;
  let loanedAsset = ASSETS.polygon.wbtc;
  loanedAsset.amount = ethers.utils.parseUnits(amountToFlashLoan.toString(), loanedAsset.decimals);
  const arbitredAsset = ASSETS.polygon.usdc;
  const Router1 = EXCHANGES.polygon.uniswap;
  const Router2 = EXCHANGES.polygon.sushi;
  const poolFee = 3000;

  before(async () => {
    const Arbitro = await ethers.getContractFactory("Arbitro");
    arbitro = await Arbitro.deploy();
  });

  it.only("Return two price quotes", async () => {

    const tradeInfo = await arbitro.encodeTradeInfo(
      loanedAsset.address,
      arbitredAsset.address,
      loanedAsset.amount,
      poolFee
    );

    // console.log(tradeInfo);

    const pairAddressRouter1 = await arbitro.getPairAddress(
      tradeInfo,
      Router1.factory_address
    );

    const pairAddressRouter2 = await arbitro.getPairAddress(
      tradeInfo,
      Router2.factory_address
    );

    // console.log(pairAddress);

    let response1 = await arbitro.callStatic.getQuote(
      Router1.router_address,
      pairAddressRouter1,
      tradeInfo
    );

    let response2 = await arbitro.callStatic.getQuote(
      Router2.router_address,
      pairAddressRouter2,
      tradeInfo
    );

    let response3 = await arbitro.callStatic.getQuote(
      Router2.router_address,
      pairAddressRouter2,
      {
        tokenIn: arbitredAsset.address,
        tokenOut: loanedAsset.address,
        amountIn: response1,
        poolFee: poolFee
      }
    );

    let response4 = await arbitro.callStatic.getQuote(
      Router1.router_address,
      pairAddressRouter1,
      {
        tokenIn: arbitredAsset.address,
        tokenOut: loanedAsset.address,
        amountIn: response2,
        poolFee: poolFee
      }
    );

    response1 = {
      dex: Router1.name,
      asset: arbitredAsset.name,
      amountOut: response1 / 10 ** (arbitredAsset.decimals)
    }
    response3 = {
      dex: Router2.name,
      asset: loanedAsset.name,
      amountOut: response3 / 10 ** (loanedAsset.decimals)
    }
    response2 = {
      dex: Router2.name,
      asset: arbitredAsset.name,
      amountOut: response2 / 10 ** (arbitredAsset.decimals)
    }
    response4 = {
      dex: Router1.name,
      asset: loanedAsset.name,
      amountOut: response4 / 10 ** (loanedAsset.decimals)
    }

    const smaller = response1.amountOut < response2.amountOut ? response1: response2;
    const bigger = response1 == smaller ? response2 : response1;

    console.log("Trade", `Loaned ${loanedAsset.name} amount ${loanedAsset.amount / 10 ** loanedAsset.decimals}`);
    console.log(response1);
    console.log(response3);
    console.log(response2);
    console.log(response4);
  });

  it("Do arbitrage", async () => {

    const tradeInfo = await arbitro.encodeTradeInfo(
      loanedAsset.address,
      arbitredAsset.address,
      loanedAsset.amount,
      poolFee
    );

    const pairAddressRouter1 = await arbitro.getPairAddress(
      tradeInfo,
      Router1.factory_address
    );

    const pairAddressRouter2 = await arbitro.getPairAddress(
      tradeInfo,
      Router2.factory_address
    );

    let response1 = await arbitro.callStatic.getQuote(
      Router1.router_address,
      pairAddressRouter1,
      tradeInfo
    );

    let response2 = await arbitro.callStatic.getQuote(
      Router2.router_address,
      pairAddressRouter2,
      tradeInfo
    );

    let buyExchange;
    let sellExchange;
    let firstTradeAmountOut;
    let buyPairAddr;

    if (response1 > response2) {
      sellExchange = Router1;
      buyExchange = Router2;
      firstTradeAmountOut = response1;
      buyPairAddr = pairAddressRouter2;
    } else {
      sellExchange = Router2;
      buyExchange = Router1;
      firstTradeAmountOut = response2;
      buyPairAddr = pairAddressRouter1;
    }

    console.log("buyExchange", buyExchange.name, "sellExchange", sellExchange.name);

    await arbitro.initiateFlashLoan(
      {
        tokenIn: loanedAsset.address,
        tokenOut: arbitredAsset.address,
        amountIn: loanedAsset.amount,
        amountOut: firstTradeAmountOut,
        poolFee: poolFee,
        sellRouter: sellExchange.router_address,
        buyRouter: buyExchange.router_address,
        buyPair: buyPairAddr,
      }
    );

    const arbToken = new ethers.getContractAt("IERC20", arbitredAsset.address);

    expect(await arbToken.balanceOf(arbitro.address)).to.be.gt(0);
  });
});