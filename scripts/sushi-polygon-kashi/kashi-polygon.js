const hre = require('hardhat');
const fs = require('fs');
const { request, gql } = require('graphql-request');

const POLYGON_KASHI_ADDR = require('./kashi-polygon-addresses.json');
const ERC20_ABI = require('./abi-erc20.json');

const WBTC = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6';
const WETH = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';
const DAI = '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063';
const WMATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
const USDC = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

const networkTest = async () => {
    let wallet = await hre.ethers.getSigners();
    wallet = wallet[0].address;
    console.log(`Network Test: signer wallet is: ${wallet}`);
}

const extractGraphQLInfo = async () => {

    await networkTest();

    let symbols = [];

    let query;
    for (let index = 0; index < POLYGON_KASHI_ADDR.length; index++) {
        let query = `
        {
            kashiPair(id: "${POLYGON_KASHI_ADDR[index]}" ) {
                id
              symbol
              collateral{
                id
              }
              asset{
                id
              }
            }
          }
        `
        const serverresponse = await request('https://api.thegraph.com/subgraphs/name/sushiswap/matic-bentobox', query);
        symbols.push(serverresponse);
        console.log(serverresponse.kashiPair.symbol);
    }
    fs.writeFileSync("./scripts/sushi-polygon-kashi/output/kashi-polygon-symbols.json", JSON.stringify(symbols));
    console.log("complete!");
    return symbols;
}

const main = async () => {

  console.log("Filetering Data!");

  const kashiPairsPolygon = require('./output/kashi-polygon-symbols.json');
  console.log(kashiPairsPolygon.length);

  const pairsOfInterest_ = kashiPairsPolygon.filter( element => 
      element.kashiPair.collateral.id == WBTC.toLowerCase()
  );

  const pairsOfInterest = pairsOfInterest_.filter( element =>
      element.kashiPair.asset.id == DAI.toLowerCase()    
  );

  console.log(pairsOfInterest);
}

main();
// extractGraphQLInfo();

const kmWETHDAI ="0x12d7906b1c9a2e0f73d251bafdbd369fed6f8c64";
const kmWETHUSDC = '0xd51b929792cfcde30f2619e50e91513dcec89b23';
const kmWETHUSDT = '0xef7f30c8f0763b83d8779fb90df99cb5e70425e8';

const kmWBTCDAI = '0x99D6659207a7B0f4D906DFa3ff61f0F50E343555';
const kmWBTCUSDC = '0x684575df2d01523fafcbf6768a4549d4309c7ea6';
const kmWBTCUSDT = '0x0e55c1D982B65C489f699720133de8f83F4adC3b';


const kmWMATICDAI = '0x13fdda9d4a0f009e6795ed3e7b8d0974f7baaa6b';
const kmWMATICUSDC = '0xe4b3c431e29b15978556f55b2cd046be614f558d';










