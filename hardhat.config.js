require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-gas-reporter');
require('solidity-coverage');
require('hardhat-deploy');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */

const RPC_URL_GOERLI = process.env.RPC_URL_GOERLI || 'https://www.google.com';
const PRIVATE_KEY = process.env.PRIVATE_KEY || 'KEY';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || 'key';
const MARKETCAP_API_KEY = process.env.MARKETCAP_API_KEY || 'key';
module.exports = {
    solidity: {
        compilers: [{ version: '0.8.7' }, { version: '0.6.6' }],
    },
    defaultNetwork: 'hardhat',
    networks: {
        goerli: {
            url: RPC_URL_GOERLI,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
        hardhat: {
            chainId: 31337,
        },
        // localhost: {
        //     url: 'http://127.0.0.1:8545/', //ganache
        //     chainId: 31337,
        // },
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: false,
        outputFile: 'gas-report.txt',
        noColors: true,
        currency: 'USD',
        coinmarketcap: MARKETCAP_API_KEY,
        token: 'MATIC ',
    },
    namedAccounts: {
        deployer: {
            default: 0, //by default it is 0th index account in accounts array
        },
    },
};
