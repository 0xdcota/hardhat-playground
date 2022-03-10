const { inputToConfig } = require("@ethereum-waffle/compiler");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ASSETS, EXCHANGES } = require("./utils.js");

describe("Arbitro System Tests", function () {

  let arbitro;

  before(async () => {
    const Arbitro = await ethers.getContractFactory("Arbitro");
    arbitro = await Arbitro.deploy();
  });

  it("Return two price quotes", async () => {

    let loanedAsset = ASSETS.polygon.wbtc;
    loanedAsset.amount = ethers.utils.parseUnits("1", loanedAsset.decimals);
    const arbitredAsset = ASSETS.polygon.weth;

    const tradeInfo = await arbitro.encodeTradeInfo(
      loanedAsset.address,
      arbitredAsset.address,
      loanedAsset.amount,
    );

    // console.log(tradeInfo);

    const pairAddressSushi = await arbitro.getPairAddress(
      tradeInfo,
      EXCHANGES.polygon.sushi.factory_address
    );

    const pairAddresApeSwap = await arbitro.getPairAddress(
      tradeInfo,
      EXCHANGES.polygon.apeswap.factory_address
    );

    // console.log(pairAddress);

    let response1 = await arbitro.getQuote(
      EXCHANGES.polygon.sushi.router_address,
      pairAddressSushi,
      tradeInfo
    );

    let response2 = await arbitro.getQuote(
      EXCHANGES.polygon.apeswap.router_address,
      pairAddresApeSwap,
      tradeInfo
    );

    response1 = {
      dex: "sushi",
      asset: arbitredAsset.name,
      amountOut: response1 / 10 ** (arbitredAsset.decimals)
    }

    response2 = {
      dex: "apeswap",
      asset: arbitredAsset.name,
      amountOut: response2 / 10 ** (arbitredAsset.decimals)
    }
    
    console.log("Trade", `Loaned ${loanedAsset.name} amount ${loanedAsset.amount / 10 ** loanedAsset.decimals}` );
    console.log(response1);
    console.log(response2);
  });




});