// function deployFunc() {
//   console.log("Hi");
//   hre.getNamedAccounts()
//   hre.deployments
// }

const { network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();
// module.exports.default = deployFunc;
// module.exports = async(hre) => {
//     //等价于hre.getNamedAccounts
//     const { getNamedAccounts, deployments} = hre
// }
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let ethUsdPriceFeedAddress;
  console.log(deployer);
  //在模拟链上
  if (chainId == 31337) {
    const ethUsdAggregator = await deployments.get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  if (chainId != 31337 && ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }
  log("--------------------------------------------------");
};
module.exports.tags = ["all", "fundme"];
