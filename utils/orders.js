const { 
	BigNumber, 
	assetDataUtils, 
	generatePseudoRandomSalt, 
	orderHashUtils,
	signatureUtils,
	ContractWrappers,
} = require('0x.js');
const { Web3Wrapper } =  require('@0x/web3-wrapper');
const providerEngine = require('./providerEngine');

const {
	FETH_ADDRESS_RINKEBY,
	EXCHANGE_ADDRESS_RINKEBY,
	OWNER,
	WRAPPED_NO_TOKEN,
	WRAPPED_YES_TOKEN,
	NULL_ADDRESS,
	NUM_TICKS,
	RINKEBY,
} = require('./../constants');

const zero = new BigNumber(0);
const web3Wrapper = new Web3Wrapper(providerEngine);
const contractWrappers = new ContractWrappers(providerEngine, { networkId: RINKEBY});
const makerAssetData = assetDataUtils.encodeERC20AssetData(FETH_ADDRESS_RINKEBY);
const takerAssetDataYes = assetDataUtils.encodeERC20AssetData(WRAPPED_YES_TOKEN);
const takerAssetDataNo = assetDataUtils.encodeERC20AssetData(WRAPPED_NO_TOKEN);

const createOrder = (outcome, makerAssetAmount) => {
	
	return new Promise(async(resolve, reject) => {
		let takerAssetData;

		if (outcome === 0) {
			takerAssetData = takerAssetDataNo;
		} else if (outcome === 1) {
			takerAssetData = takerAssetDataYes;
		} else {
			throw "No possible outcome selected"
		}

		makerAssetAmount = new BigNumber(makerAssetAmount);
		const takerAssetAmount = new BigNumber("1e12").div(10000);

		const order = {
			exchangeAddress: EXCHANGE_ADDRESS_RINKEBY,
			makerAddress: OWNER.toLowerCase(),
			takerAddress: NULL_ADDRESS,
			senderAddress: NULL_ADDRESS,
			feeRecipientAddress: NULL_ADDRESS,
			expirationTimeSeconds: (1561939200).toString(),
			salt: generatePseudoRandomSalt().toString(),
			makerAssetAmount: makerAssetAmount.toString(),
			takerAssetAmount: takerAssetAmount.toString(),
			makerAssetData,
			takerAssetData,
			makerFee: zero.toString(),
			takerFee: zero.toString(),
		}

		const orderHashHex = orderHashUtils.getOrderHashHex(order);
		signature = await signatureUtils.ecSignHashAsync(providerEngine, orderHashHex, OWNER);
		signedOrder = {...order, signature};

		const FETHApprovalTxHash = await contractWrappers.erc20Token.setUnlimitedProxyAllowanceAsync(
			FETH_ADDRESS_RINKEBY,
			OWNER,
		);
		
		await web3Wrapper.awaitTransactionSuccessAsync(FETHApprovalTxHash);

		const FETHDepositTxHash = await contractWrappers.etherToken.depositAsync(
			FETH_ADDRESS_RINKEBY,
			new BigNumber(makerAssetAmount),
			OWNER,
		);

		await web3Wrapper.awaitTransactionSuccessAsync(FETHDepositTxHash);

		resolve(signedOrder);
	});
}

module.exports = createOrder;