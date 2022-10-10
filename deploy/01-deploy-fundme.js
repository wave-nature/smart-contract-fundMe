const { network } = require('hardhat');
const {
    networkConfig,
    developmentChains,
} = require('../helper-hardhat-config');
const { verify } = require('../utils/verify');
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deployer } = await getNamedAccounts(); //first account from our metamask or specified network in hardhat config
    const { deploy, log } = deployments;

    const chainId = network.config.chainId;
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get('MockV3Aggregator');
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]['ethUsdPriceFeed'];
    }

    // when we are working with hardhat or localhost we use mocks
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy('FundMe', {
        from: deployer,
        args: args, //arguments that pass on constructor of fund me contract
        logs: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    )
        await verify(fundMe.address, args);

    log('ethusdaddress', ethUsdPriceFeedAddress);
    log('Deployed Fund Me contract');
    log('.'.repeat(40));
};

module.exports.tags = ['all', 'fundMe'];
