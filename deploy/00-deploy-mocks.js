const { network } = require("hardhat");

const DECIMAL = "8";
const INITIAL_ANSWER = "200000000000"; // 2000
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log("Local network detected! Deploying mocks...");
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMAL, INITIAL_ANSWER],
    });
    log("Mocks deployed!");
    log("------------------------------------------------------");
  }
};
module.exports.tags = ["all", "mocks"];
