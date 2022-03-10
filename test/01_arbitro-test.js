const { expect } = require("chai");
const { ethers } = require("hardhat");
const { ASSETS, EXCHANGES } = require("./utils.js");

describe("Arbitro System Tests", function () {

  let arbitro;

  before(async () => {
    const Arbitro = await ethers.getContractFactory("Arbitro");
    arbitro = await Arbitro.deploy();
  });

  


});