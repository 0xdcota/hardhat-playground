const { ethers } = require("hardhat");
const { expect } = require('chai');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const DEBUG = false;

const abiCoder = ethers.utils.defaultAbiCoder;

const remove0xFromHexString = function (hexString) {
  if (!(hexString === null || hexString === void 0 ? void 0 : hexString.toLowerCase().startsWith("0x"))) {
    return hexString;
  }
  return hexString.substr(2);
}

const appendMerkleProof = function (unsignedTransaction, merkletree, unhashedleaf) {
  let utx = unsignedTransaction;
  let proof = merkletree.getHexProof(keccak256(unhashedleaf));
  if (DEBUG) {
    console.log("proof from js", proof);
  }
  proof = abiCoder.encode(['bytes32[]'], [proof]);
  proof = remove0xFromHexString(proof);
  utx.data = utx.data + proof;
  return utx;
}

describe("Test Proof Extraction", function () {

  let accounts;
  let userEligible;
  let userEligibleIndex;
  let userNONeligible;
  let userNONeligibleIndex;

  let ProofReader;
  let leaves;
  let merkletree;
  let merkleroot;
  let proofreader;

  before(async () => {
    accounts = await ethers.getSigners();
    userEligibleIndex = 0;
    userEligible = accounts[userEligibleIndex];
    userNONeligibleIndex = 19;
    userNONeligible = accounts[userNONeligibleIndex];

    ProofReader = await ethers.getContractFactory('ProofReader');
    leaves = require('./sample-merkle-leaves.json');
    merkletree = new MerkleTree(leaves, keccak256, { hashLeaves: true, sortPairs: true });
    merkleroot = merkletree.getHexRoot();
    proofreader = await ProofReader.deploy(merkleroot);
  });

  it('Should revert if no passed proof', async () => {
    await expect(proofreader.connect(userEligible).dummyEntryFunction(100)).to.be.revertedWith("No proof detected!");
  });

  it('Should revert if eligible user passes wrong proof', async () => {
    let utx = await proofreader.connect(userEligible).populateTransaction.dummyEntryFunction(100);
    utx = appendMerkleProof(utx, merkletree, leaves[userEligibleIndex]);

    // Modify proof to be wrong.
    function setCharAt(str, index, chr) {
      if (index > str.length - 1) return str;
      return str.substring(0, index) + chr + str.substring(index + 1);
    }
    const dataLength = (utx.data).length;
    utx.data = setCharAt(utx.data, dataLength - 10, 'f');

    if (DEBUG) {
      console.log("modified-utx-proof", utx);
    }

    await expect(userEligible.sendTransaction(utx)).to.be.revertedWith("cannot verify proof!");
  });

  it('Should revert if NON-eligible user passes a pretended proof', async () => {
    let utx = await proofreader.connect(userNONeligible).populateTransaction.dummyEntryFunction(100);

    // Passes the proof of an eligible user
    utx = appendMerkleProof(utx, merkletree, leaves[userEligibleIndex]);

    if (DEBUG) {
      console.log("utx-proof", utx);
    }

    await expect(userNONeligible.sendTransaction(utx)).to.be.revertedWith("cannot verify proof!");
  });

  it("Should return true for 'givePoints' mapping, if eligible user passes correct proof", async () => {
    let utx = await proofreader.connect(userEligible).populateTransaction.dummyEntryFunction(100);
    utx = appendMerkleProof(utx, merkletree, leaves[0]);

    if (DEBUG) {
      console.log("utx+proof", utx);
    }
    await userEligible.sendTransaction(utx);

    const check = await proofreader.givePoints(userEligible.address);
    expect(check).to.eq(true);
  });

});

