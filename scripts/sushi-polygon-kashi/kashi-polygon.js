const hre = require('hardhat');
const fs = require('fs');
const { request, gql } = require('graphql-request');

const POLYGON_KASHI_ADDR = require('./kashi-polygon-addresses.json');
const ERC20_ABI = require('./abi-erc20.json');

const WBTC = '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6';
const WETH = '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619';
const DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
const MATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';

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

    let pairsOfInterest = kashiPairsPolygon.filter( element => 
        element.kashiPair.collateral.id === WETH
    );
    pairsOfInterest = pairsOfInterest.filter( element =>
        element.kashiPair.asset.id === DAI    
    );

    console.log(pairsOfInterest);
}

 main();
//extractGraphQLInfo();

const kmWETHDAI ="0x12d7906b1c9a2e0f73d251bafdbd369fed6f8c64";









