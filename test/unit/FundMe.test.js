const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
describe("FundMe", async function () {
  let fundMe;
  let deployer;
  let mockV3Aggregator;
  //表示1个ETH
  const sendValue = ethers.utils.parseEther("1");
  beforeEach(async function () {
    //获得deployer的地址并赋给deployer
    //getNamedAccounts:获取账户的公钥
    deployer = (await getNamedAccounts()).deployer;
    //部署所有合约
    await deployments.fixture(["all"]);
    //从已部署合约中获取指定合约
    fundMe = await ethers.getContract("FundMe", deployer);
    mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
  });
  describe("constructor", async function () {
    //验证priceFeed地址正确
    it("sets the aggregator address correctly", async function () {
      const response = await fundMe.getPriceFeed();
      assert.equal(response, mockV3Aggregator.address);
    });
  });
  describe("fund", async function () {
    //验证没发送足够ETH的错误是否符合预期
    it("Fails if you don't send enough ETH", async function () {
      await expect(fundMe.fund()).to.be.revertedWith(
        "You need to spend more ETH!"
      );
    });
    it("updated the amount funded data stucture", async function () {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.getAddressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });
    it("Adds funder to array of funders", async function () {
      await fundMe.fund({ value: sendValue });
      //从合约中拿第一个funder看是不是当前合约的发布者
      const funder = await fundMe.getFunder(0);
      assert.equal(funder, deployer);
    });
  });
  describe("withdraw", async function () {
    beforeEach(async function () {
      await fundMe.fund({ value: sendValue });
    });
    it("Withdraw ETH from a single founder", async function () {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });
    it("Withdraw ETH from multiple funders", async function () {
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        const fundMeConnectedContract = await fundMe.connect(accounts[i]);
        await fundMeConnectedContract.fund({ value: sendValue });
      }
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingDeployerBalance.add(startingFundMeBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
      await expect(fundMe.getFunder(0)).to.be.reverted;
      for (i = 1; i < 6; i++) {
        assert.equal(
          await fundMe.getAddressToAmountFunded(accounts[i].address),
          0
        );
      }
    });
    it("Only allows the owner to withdraw", async function () {
      const accounts = await ethers.getSigners();
      const fundMeConnectedContract = await fundMe.connect(accounts[1]);

      await expect(
        fundMeConnectedContract.withdraw()
      ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
    });
  });
});
