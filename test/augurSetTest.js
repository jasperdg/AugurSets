const Web3 = require("web3");
const augurSetAbi = require("./../build/contracts/AugurSet").abi;
const augurSetBytecode = require("./../build/contracts/AugurSet").bytecode;
const erc20Abi = require("./../build/contracts/ERC20").abi;
const marketAbi = require("./../build/contracts/Market").abi;
const feeWindowAbi = require("./../build/contracts/FeeWindow").abi;

const createAugurMarket = require("../utils/createAugurMarket");
const sendSignedTransaction = require("../utils/sendSignedTransaction")
const { fromWei, toWei, toBN } = require('web3-utils');
const {	PARITY_PORT, NUM_TICKS, NULL_ADDRESS } = require("../constants");
const {
	COMPLETE_SETS,
	CASH,
	CLAIM_TRADING_PROCEEDS,
	AUGUR,
} = require("../constants")[0]
const {	PUB_KEY } = require("../.pvt");
const web3 = new Web3(`http://localhost:${PARITY_PORT}`);
const ReportingUtils = require("../utils/ReportingUtils");
const reportingUtils = new ReportingUtils(web3);

contract('AugurSets', () => {
	let marketAddresses;
	let marketContracts;
	let augurSet;

	const oneEthInWei = toWei("1", "ether");
														 
	const marketDescriptions = [
		"Will the We Company have more than 14000 employees by 2020, according do LinkedIn?",
		"Will the We Company launch We Live outside of the U.S. by 2020?",
		"Will CEO, Adam Neumann retain his position by 2020?",
		"Will CEO, Adam Neumann retain his position by 2021?"

	];
	const weights = [60, 20, 10, 10];
	const outcomes = 2;

	// TODO: set timeStamp to now
	it('resets timestamp to current day and time', async () => {
		await reportingUtils.setTimestamp(toBN(Math.round(new Date().getTime() / 1000)));
	});

	it('is able to create an x amount of markets', async () => {
		const marketPromises = marketDescriptions.map((description, i) => createAugurMarket(description, i));
		marketAddresses = await Promise.all(marketPromises);
	});

	it('is able to deploy an AugurSet contract consisting of positions in these markets', async () => {
		const nonce = await web3.eth.getTransactionCount(PUB_KEY);
		const data = new web3.eth.Contract(augurSetAbi).deploy({
			data: augurSetBytecode,
			arguments: [
				marketAddresses,
				weights,
				outcomes,
				COMPLETE_SETS,
				CASH,
				CLAIM_TRADING_PROCEEDS,
				AUGUR
			]
		}).encodeABI()

		const { contractAddress } = await sendSignedTransaction(false, nonce, data, "0");
		assert(contractAddress);

		augurSet = new web3.eth.Contract(augurSetAbi, contractAddress);
	});

	it('is able to purchase a complete set of the Augur index', async () => {
		const nonce = await web3.eth.getTransactionCount(PUB_KEY);
		const data = augurSet.methods.buyCompleteSet().encodeABI();

		const receipt = await sendSignedTransaction(augurSet.address, nonce, data, oneEthInWei);
		assert(receipt.status);
	});

	it('the AugurSet should hold the weighted amount of all Augur markets and outcomes in escrow', async () => {
		for (let i = 0; i < outcomes; i ++) {
			const outcomeTokenBalanceProms = marketAddresses.map(market => augurSet.methods.getMarketBalance(i, market).call());
			const outcomeTokenBalances = await Promise.all(outcomeTokenBalanceProms);
			outcomeTokenBalances.forEach((balance, i) => {
				const weightedBalance = toBN(oneEthInWei).mul(toBN(weights[i])).div(toBN(NUM_TICKS * 100));
				assert.equal(weightedBalance.toString(), balance.toString());
			});
		}
	});

	it('the purchaser of the complete set should own one token representing each outcome', async () => {
		for (let i = 0; i < outcomes; i ++) {
			const outcomeIndexTokenAddress = await augurSet.methods.outcomeIndexTokens(i).call();
			const outcomeIndexToken = new web3.eth.Contract(erc20Abi, outcomeIndexTokenAddress);
			const balance = await outcomeIndexToken.methods.balanceOf(PUB_KEY).call();
		}
	});

	it('set timestamp to market end', async () => {
		marketContracts = marketAddresses.map(market => new web3.eth.Contract(marketAbi, market));
		const marketEndTime = await marketContracts[marketAddresses.length - 1].methods.getDesignatedReportingEndTime.call();
		await reportingUtils.setTimestamp(marketEndTime.add(1));
	});

	it('commits initial reports', async () => {
		const commitInitialReports = marketContracts.map((market, i) => reportingUtils.commitInitialReport(market, i));
		await Promise.all(commitInitialReports);
	});

	it('changes timestamp to after reporting phase', async () => {
		const feeWindow = await reportingUtils.getFeeWindow(marketContracts[0]);
		const feeWindowContract = new web3.eth.Contract(feeWindowAbi, feeWindow);
		const feeWindowEndTime = await feeWindowContract.methods.getEndTime.call();
		await reportingUtils.setTimestamp(feeWindowEndTime.add(1));
	});

	it('finalizes the markets', async () => {
		const finalizationPromises = marketContracts.map((market, i) => reportingUtils.finalizeMarket(market, i));
		await Promise.all(finalizationPromises);
		const marketsFinalizedPromises = marketContracts.map(market => market.methods.isFinalized.call());
		const marketsFinalized = await Promise.all(marketsFinalizedPromises) ;

		assert.equal(marketsFinalized.indexOf(false), -1);
	});

	it('AugurSet returns that all markets are finalized', async () => {
		const augurSetMarketsFinalized = await augurSet.methods.indexMarketsFinalized.call();
		assert.equal(augurSetMarketsFinalized, true);
	});

	it('Claims all AugurSet winnings', async () => {
		const threeDaysAndOneSecond = 60 * 60 * 24 * 3 + 1;
		const reportingEndTime = await marketContracts[marketContracts.length - 1].methods.getFinalizationTime.call()
		const setTime = await reportingUtils.setTimestamp(reportingEndTime.add(threeDaysAndOneSecond));
		assert.equal(setTime.status, true);

		const balanceBeforeClaim = fromWei((await web3.eth.getBalance(augurSet.address)));
		const nonce = await web3.eth.getTransactionCount(PUB_KEY);
		const data = augurSet.methods.finalize.encodeABI();
		const finalize = await sendSignedTransaction(augurSet.address, nonce, data, "0");
		const balanceAfterClaim = fromWei((await web3.eth.getBalance(augurSet.address)));
		assert.equal(finalize.status, true);
		assert(balanceBeforeClaim < balanceAfterClaim);
	});

	it('payout distribution is calculated correctly according to the weighed amounts', async () => {
		const payoutNumerators = await augurSet.methods.getPayoutDistribution.call();
		assert.equal(payoutNumerators[0].toString(), NUM_TICKS);
		assert.equal(payoutNumerators[1].toString(), 0);
	});

	it('user is able to claim his his earnings in exchange for his index token', async () => {
		const nonce = await web3.eth.getTransactionCount(PUB_KEY);
		const claimData = augurSet.methods.claimProceeds.encodeABI();
		await sendSignedTransaction(augurSet.address, nonce, claimData, "0");
	});

	it('the contract should not have any balance left', async () => {
		const balanceAfterClaim = await web3.eth.getBalance(augurSet.address);
		assert.equal(balanceAfterClaim, 0);
	});

	it('All index should be burned after the user claimed his proceeds', async () => {
		for (let i = 0; i < outcomes; i ++) {
			const outcomeIndexTokenAddress = await augurSet.methods.outcomeIndexTokens(i).call();
			const outcomeIndexToken = new web3.eth.Contract(erc20Abi, outcomeIndexTokenAddress);
			const balance = await outcomeIndexToken.methods.balanceOf(PUB_KEY).call();
			assert.equal(balance.toString(), 0);
		}
	});
});
