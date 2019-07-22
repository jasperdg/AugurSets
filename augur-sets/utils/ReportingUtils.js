const sendSignedTransaction = require("./sendSignedTransaction");
const timeControlledAbi = require("../build/contracts/TimeControlled").abi;
const {	PUB_KEY } = require("../.pvt");
const {	NUM_TICKS } = require("../constants");
const { TIME_CONTROLLED } = require("../constants")[0];

class ReportingUtils {
	constructor(web3) {
		this.web3 = web3;
	}

	commitInitialReport(market, index) {
		return new Promise( async (resolve, reject) => {
			const nonce = await this.web3.eth.getTransactionCount(PUB_KEY) + index;
			let payOutNumerators = new Array(2).fill("0");
			payOutNumerators[0] = NUM_TICKS;
			const data = market.methods.doInitialReport(payOutNumerators, false).encodeABI();
			const receipt = await sendSignedTransaction(market.address, nonce, data, "0");
			resolve(receipt);
		});
	} 

	getFeeWindow(market) {
		return new Promise( async (resolve, reject) => {
			const feeWindow = await market.methods.getFeeWindow.call();
			resolve(feeWindow);
		});
	}

	setTimestamp(timeInSeconds) {
		return new Promise( async (resolve, reject) => {
			const timeControlled = new this.web3.eth.Contract(timeControlledAbi, TIME_CONTROLLED);
			const nonce = await web3.eth.getTransactionCount(PUB_KEY);
			const data = timeControlled.methods.setTimestamp(timeInSeconds.toString()).encodeABI();
			const receipt = await sendSignedTransaction(TIME_CONTROLLED, nonce, data, "0");
			resolve(receipt);
		});
	}

	getTimestamp() {
		return new Promise( async (resolve, reject) => {
			const timeControlled = new this.web3.eth.Contract(timeControlledAbi, TIME_CONTROLLED);
		
			const timeStamp = await timeControlled.methods.getTimestamp().call();
			resolve(timeStamp.toString());
		});
	}

	finalizeMarket(market, i) {
		return new Promise( async (resolve, reject) => {
			const nonce = await web3.eth.getTransactionCount(PUB_KEY) + i;
			const data = market.methods.finalize.encodeABI();
			const receipt = await sendSignedTransaction(market.address, nonce, data, "0");
			resolve(receipt)
		});
	}
}

module.exports = ReportingUtils;