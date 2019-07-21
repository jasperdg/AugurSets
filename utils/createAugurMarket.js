const Web3 = require('web3');
const universeAbi = require("./../build/contracts/Universe").abi;
const erc20Abi = require("./../build/contracts/ERC20").abi;
const augurAbi = require("./../build/contracts/Augur").abi;
const sendSignedTransaction = require("./sendSignedTransaction");
const { PUB_KEY } = require("../.pvt");
const {	PARITY_PORT, PARITY_PORT_WS } = require("../constants.js");
const {
	UNIVERSE,
	AUGUR,
	CASH,
} = require("../constants.js")[0];

const { toWei, hexToNumberString } = require("web3-utils");

const web3 = new Web3(`http://localhost:${PARITY_PORT}`);
const web3Ws = new Web3(`ws://localhost:${PARITY_PORT_WS}`);

const universe = new web3.eth.Contract(universeAbi, UNIVERSE);
const cash = new web3.eth.Contract(erc20Abi, CASH);
const augur = new web3Ws.eth.Contract(augurAbi, AUGUR);

const inOneMonth = Math.round(new Date().getTime()) + 60 * 60 * 24 * 30;
const oneEth = toWei("1", "ether");

const watchForMarketCreated = (description, resolve, fromBlock) => {
	augur.events.MarketCreated({
    fromBlock
	}).on('data', (data) => {
		if (data.returnValues.description === description) {
			resolve(data.returnValues.market);
		} 
	});
}

const createAugurMarket = (description, index) => new Promise( async (resolve, reject) => {
	const currentBlock = await web3.eth.getBlockNumber();
	watchForMarketCreated(description, resolve, currentBlock);
	const marketCreationFee = await getMarketCreationFee(index);
	await approveCashTransfer(index);
	const nonce = (await web3.eth.getTransactionCount(PUB_KEY)) + index;
	
	const data = universe.methods.createYesNoMarket(
		inOneMonth.toString(),
		"0",
		CASH,
		PUB_KEY,
		web3.utils.asciiToHex("test"),
		description,
		""
	).encodeABI();

	const receipt = await sendSignedTransaction(UNIVERSE, nonce, data, hexToNumberString(marketCreationFee));

	if (!receipt.status) console.log("Market creation failed");
	else console.log("Market created");
});


const approveCashTransfer = (index) => new Promise(async (resolve, reject) => {
	const nonce = (await web3.eth.getTransactionCount(PUB_KEY)) + index;	
	const data = await cash.methods.approve(AUGUR, oneEth).encodeABI();
	const approved = await sendSignedTransaction(CASH, nonce, data, "0x0");
	resolve(approved.status);
});

const getMarketCreationFee = (index) => new Promise(async (resolve, reject) => {
	const nonce = (await web3.eth.getTransactionCount(PUB_KEY)) + index;
	const data = await universe.methods.getOrCacheValidityBond().encodeABI();
	const gotOrCachedValidityBond = await sendSignedTransaction(UNIVERSE, nonce, data, "0x0");
	if (gotOrCachedValidityBond.status == false) resolve(false);
	const marketCreationFee = await web3.eth.call({data, to: universe.address});
	resolve(marketCreationFee);
});

module.exports = createAugurMarket;