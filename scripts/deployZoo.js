// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const Zoo = await ethers.getContractFactory("ZooV1");
  const zoo = await upgrades.deployProxy(Zoo, {
    timeout: 0,
    kind: 'uups',
  });
  await zoo.deployed();
  console.log("Zoo deployed to:", zoo.address);
  const data = [
    zoo.address
  ];
  fs.writeFileSync("./scripts/deployed.json", JSON.stringify(data, null, 2));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
