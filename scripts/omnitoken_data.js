let rinkebyomnitoken = "0xCFa55b534D205f83c564f48bf5AD3598a417a714";
let mumbaiomnitoken = "0x0A414A80CAe2175a7794153A09B46D8574A1672e";
let rinkebychainid = 10001;
let mumbaichainid = 10009;

let romnitoken = await ethers.getContractAt("OmniChainToken", rinkebyomnitoken);
let momnitoken = await ethers.getContractAt("OmniChainToken", mumbaiomnitoken);

let rinkebyendpoint = await ethers.getContractAt("Endpoint", "0x79a63d6d8BBD5c6dfc774dA79bCcD948EAcb53FA");
let mumbaiendpoint = await ethers.getContractAt("Endpoint", "0xf69186dfBa60DdB133E91E9A4B5673624293d8F8");

