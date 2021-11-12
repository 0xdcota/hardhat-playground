const hre = require('hardhat');
const fs = require('fs');

const POLYGON_KASHI_ADDR = require('./kashi-polygon-addresses.json');
const ERC20_ABI = require('./abi-erc20.json');

const networkTest = async () => {
    let wallet = await hre.ethers.getSigners();
    wallet = wallet[0].address;
    console.log(`Network Test: signer wallet is: ${wallet}`);
}

const main = async () => {

    let kashiContracts = [];
    const contract = await hre.ethers.getContractAt(ERC20_ABI, POLYGON_KASHI_ADDR[0]);
    const symbol = await contract.symbol();

    console.log(symbol);

    // POLYGON_KASHI_ADDR.forEach(async (element) => {
    //     const contract = await hre.ethers.getContractAt(ERC20_ABI, element);
    //     const symbol = await contract.symbol();
    //     kashiContracts.push(
    //         {
    //             address: element,
    //             symbol: symbol
    //         }
    //     );
    // });

    // fs.writeFileSync("./output/kashi-addr-symbol.json", JSON.stringify(kashiContracts));
}


networkTest();
main();