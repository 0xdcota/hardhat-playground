const ASSETS = {
  polygon: {
    weth: {
      address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      name: "weth",
      decimals: 18
    },
    wbtc: {
      address: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
      name: "wbtc",
      decimals: 8
    },
    wmatic: {
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      name: "wmatic",
      decimals: 18
    }
  }
}

const EXCHANGES = {
  polygon: {
    sushi: {
      router_address: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
      factory_address: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4"
    },
    quickswap: {
      router_address: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
      factory_address: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32"
    },
    uniswap: {
      router_address: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      factory_address: "0x1F98431c8aD98523631AE4a59f267346ea31F984"
    },
    apeswap: {
      router_address: "0xC0788A3aD43d79aa53B09c2EaCc313A787d1d607",
      factory_address: "0xCf083Be4164828f00cAE704EC15a36D711491284"
    }
  }
}

module.exports = {
  ASSETS,
  EXCHANGES
};