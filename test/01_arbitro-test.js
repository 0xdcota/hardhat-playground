const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ASSETS, EXCHANGES } = require("./utils.js");

describe("Arbitro System Tests", function () {

  let arbitro;

  const amountToFlashLoan = 1;
  let loanedAsset = ASSETS.polygon.weth;
  loanedAsset.amount = ethers.utils.parseUnits(amountToFlashLoan.toString(), loanedAsset.decimals);
  const arbitredAsset = ASSETS.polygon.aave;
  const Router1 = EXCHANGES.polygon.sushi;
  const Router2 = EXCHANGES.polygon.quickswap;

  before(async () => {
    const Arbitro = await ethers.getContractFactory("Arbitro");
    arbitro = await Arbitro.deploy();
  });

  it("Return two price quotes", async () => {

    const tradeInfo = await arbitro.encodeTradeInfo(
      loanedAsset.address,
      arbitredAsset.address,
      loanedAsset.amount,
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

    let response1 = await arbitro.getQuote(
      Router1.router_address,
      pairAddressRouter1,
      tradeInfo
    );

    let response2 = await arbitro.getQuote(
      Router2.router_address,
      pairAddressRouter2,
      tradeInfo
    );

    response1 = {
      dex: Router1.name,
      asset: arbitredAsset.name,
      amountOut: response1 / 10 ** (arbitredAsset.decimals)
    }

    response2 = {
      dex: Router2.name,
      asset: arbitredAsset.name,
      amountOut: response2 / 10 ** (arbitredAsset.decimals)
    }

    const smaller = response1.amountOut < response2.amountOut ? response1: response2;
    const bigger = response1 == smaller ? response2 : response1;

    console.log("Trade", `Loaned ${loanedAsset.name} amount ${loanedAsset.amount / 10 ** loanedAsset.decimals}`);
    console.log(response1);
    console.log(response2);
    console.log(`Percent price difference ${ ((bigger.amountOut - smaller.amountOut) * 100 / smaller.amountOut).toFixed(4) }`);
  });

  it("Do arbitrage", async () => {

    const tradeInfo = await arbitro.encodeTradeInfo(
      loanedAsset.address,
      arbitredAsset.address,
      loanedAsset.amount,
    );

    const pairAddressRouter1 = await arbitro.getPairAddress(
      tradeInfo,
      Router1.factory_address
    );

    const pairAddressRouter2 = await arbitro.getPairAddress(
      tradeInfo,
      Router2.factory_address
    );

    let response1 = await arbitro.getQuote(
      Router1.router_address,
      pairAddressRouter1,
      tradeInfo
    );

    let response2 = await arbitro.getQuote(
      Router2.router_address,
      pairAddressRouter2,
      tradeInfo
    );

    let buyExchange;
    let sellExchange;
    let firstTradeAmountOut;
    let sellingPairAddr;

    if (response1 < response2) {
      buyExchange = Router2;
      sellExchange = Router1;
      firstTradeAmountOut = response2;
      sellingPairAddr = pairAddressRouter1;
    } else {
      buyExchange = Router1;
      sellExchange = Router2;
      firstTradeAmountOut = response1;
      sellingPairAddr = pairAddressRouter2;
    }

    console.log("buyExchange", buyExchange.name, "sellExchange", sellExchange.name);

    await arbitro.initiateFlashLoan(
      {
        tokenIn: loanedAsset.address,
        tokenOut: arbitredAsset.address,
        amountIn: loanedAsset.amount,
        amountOut: firstTradeAmountOut,
        buyRouter: buyExchange.router_address,
        sellRouter: sellExchange.router_address,
        sellPair: sellingPairAddr
      }
    );

    const arbToken = new ethers.getContractAt("IERC20", arbitredAsset.address);

    expect(await arbToken.balanceOf(arbitro.address)).to.be.gt(0);
  });
});