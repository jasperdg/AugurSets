const { 
	Web3ProviderEngine, 
	RPCSubprovider 
} = require('0x.js');
const { RINKEBY } = require('../constants');
const { MNEMONIC } = require('../.pvt');
const { MnemonicWalletSubprovider } = require("@0x/subproviders");
const BASE_DERIVATION_PATH = `44'/60'/0'/0`;

const RINKEBY_CONFIGS = {
	rpcUrl: 'https://rinkeby.infura.io/',
	networkId: RINKEBY,
};

const mnemonicWallet = new MnemonicWalletSubprovider({
    mnemonic: MNEMONIC,
    baseDerivationPath: BASE_DERIVATION_PATH,
});

const pe = new Web3ProviderEngine();
pe.addProvider(mnemonicWallet);
pe.addProvider(new RPCSubprovider(RINKEBY_CONFIGS.rpcUrl));
pe.start();

const providerEngine = pe;
module.exports = providerEngine;