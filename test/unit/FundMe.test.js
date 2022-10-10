const { assert, expect } = require('chai');
const { deployments, ethers, getNamedAccounts, network } = require('hardhat');
const { developmentChains } = require('../../helper-hardhat-config');

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('FundMe', async function () {
          let fundMe, deployer, mockV3Aggregator;
          const sendValue = ethers.utils.parseEther('1'); // 1eth to wei
          // const sendValue = '1000000000000000000';
          beforeEach(async function () {
              //deploy FundMe contract using hardhat

              deployer = (await getNamedAccounts()).deployer;

              // deploy contract having all tag
              await deployments.fixture(['all']);
              // get contract from block chain after deployement
              fundMe = await ethers.getContract('FundMe', deployer);
              mockV3Aggregator = await ethers.getContract(
                  'MockV3Aggregator',
                  deployer
              );
          });

          describe('constructor', async function () {
              it('will set aggregator address correctly', async function () {
                  const response = await fundMe.priceFeed();

                  assert(response, mockV3Aggregator.address);
              });
          });

          describe('fund', async function () {
              it('should fail if we provide less eth than min usd', async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      'You need to spend more ETH!'
                  );
              });

              it('update the funders to amount data structure', async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.addressToAmountFunded(deployer);

                  assert.equal(response.toString(), sendValue.toString());
              });

              it('add funder to funders array', async function () {
                  await fundMe.fund({ value: sendValue });

                  const funder = await fundMe.funders(0);
                  assert.equal(funder, deployer);
              });
          });

          describe('withdraw', async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });
              it('withdraw ETH from a single funder', async function () {
                  //ARRANGE
                  const startingFundeMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //ACT
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);
                  const { effectiveGasPrice, gasUsed } = transactionReciept;
                  const gasCost = effectiveGasPrice.mul(gasUsed);

                  //ARRANGE
                  const endingFundeMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //ASSERT
                  assert.equal(endingFundeMeBalance, 0);
                  assert.equal(
                      startingFundeMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it('allows us to withdraw with multiple funders', async function () {
                  //ARRANGE
                  //gives different account address
                  const accounts = await ethers.getSigners();

                  for (let i = 1; i < 6; i++) {
                      //connect contract with different account address
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );

                      await fundMeConnectedContract.fund({ value: sendValue });
                  }

                  //ACT
                  const startingFundeMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReciept = await transactionResponse.wait(1);

                  const { effectiveGasPrice, gasUsed } = transactionReciept;

                  const gasCost = effectiveGasPrice.mul(gasUsed);

                  const endingFundeMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //ASSERT
                  assert.equal(endingFundeMeBalance, 0);
                  assert.equal(
                      startingFundeMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );

                  await expect(fundMe.funders(0)).to.be.reverted;

                  //make sure funders are reset properly
                  for (let i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it('only owner can withdraw', async function () {
                  const accounts = await ethers.getSigners();
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  );
                  await expect(fundMeConnectedContract.withdraw()).to.be
                      .reverted;
              });
          });
      });
