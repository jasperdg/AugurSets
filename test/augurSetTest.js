const CompleteSetOfOutcomeIndexTokens = artifacts.require("CompleteSetOfOutcomeIndexTokens.sol");
const Market = artifacts.require("Market.sol");
const { abi } = require("./../build/contracts/CompleteSetOfOutcomeIndexTokens");
const utils = require("web3-utils");
const { fromWei, toWei, toBN } = utils;
const { mineTx } = require("./../utils/transactionMinedAsync");
const Web3 = require('web3');
const oneEthInWei = toBN(toWei("1", "ether"));
const NUM_TICKS = 10000;
const { INFURA_KEY } = require("./../.pvt.js");

const web3 = new Web3(`https://rinkeby.infura.io/v3/${INFURA_KEY}`)

contract('multiMarketIndexToken', (accounts) => {
	const accountOne = accounts[0];
	let shortOIT;
	let longOIT;
	let longIndexAddresses;
	let shortIndexAddresses;
	let completeIndexSet; 
	const weights = [15, 60, 10, 15];
	const markets = [
		'0xde3bf3afedd3cdad61c3ad1cd5ee790842ddce03',
		'0x187a939515f7685caf435411489d433392e2fac3',
		'0x0fd62a2ce2523bae2d392a7ddc07dbd887fd60a2',
		'0xaa54585976ae5be545b0b10ff524e0b2da340a0e'
	]
	const outcomes = 2; // Just two outcomes in this index

	it('Create all contracts that are used for the test', async () => {
		completeIndexSet = await CompleteSetOfOutcomeIndexTokens.new(markets, weights, outcomes);
	});

	it('Should be able to purchase a complete set of OutcomeIndexTokens', async () => {
		const { receipt } = await completeIndexSet.buyCompleteSet(oneEthInWei.div(toBN(100)), {from: accountOne, value: oneEthInWei.div(toBN(100)), gas: 6000000});
		assert.equal(receipt.status, true);
	});

	it('Should be able to get both instances of the index tokens', async () => {
		const shortOITAddress = await completeIndexSet.outcomeIndexTokens("0");
		const longOITAddress = await completeIndexSet.outcomeIndexTokens("1");
		shortOIT = new web3.eth.Contract(abi, shortOITAddress);
		longOIT = new web3.eth.Contract(abi, longOITAddress);
	});

	it('Balance of indexTokens should be increased for each market in the index', async () => {
		const shortIndexBalancePromArr = markets.map(address => completeIndexSet.getMarketBalance(0, address));
		const longIndexBalancePromArr = markets.map(address => completeIndexSet.getMarketBalance(1, address));
		
		const shortBalances = await Promise.all(shortIndexBalancePromArr);
		const longBalances = await Promise.all(longIndexBalancePromArr);

		shortBalances.forEach((balance, i) => {
			const weightedBalance = oneEthInWei.mul(toBN(weights[i])).div(toBN(NUM_TICKS * 10000));
			assert.equal(balance.toString(), weightedBalance.toString());
		});

		longBalances.forEach((balance, i) => {
			const weightedBalance = oneEthInWei.mul(toBN(weights[i])).div(toBN(NUM_TICKS * 10000));
			assert.equal(balance.toString(), weightedBalance.toString());
		});
	});

	it('Balance of accountOne should be equal to 1 for each index token', async () => {
		const accountOneShortBalance = await shortOIT.methods.balanceOf(accountOne).call();
		const accountOneLongBalance = await longOIT.methods.balanceOf(accountOne).call();

		console.log("Short OutcomeIndexToken balance:", accountOneShortBalance.toString());
		assert.equal(accountOneShortBalance.toString(), oneEthInWei.div(toBN(100)).toString());
		console.log("Long OutcomeIndexToken balance:", accountOneLongBalance.toString());
		assert.equal(accountOneLongBalance.toString(), oneEthInWei.div(toBN(100)).toString());
	});

	it('Should be able to check if the indexes are finalized', async () => {
		const marketsFinalized = await completeIndexSet.indexMarketsFinalized();

		assert.equal(marketsFinalized, false);
	});

	// it('Should be able to withdraw the IndexToken their eth in exchange for tokens in each outcome token.', async () => {	

	// 	const finalizeShortIndexToken = await shortOIT.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });
	// 	const finalizeLongIndexToken = await longOIT.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });

	// 	assert.equal(finalizeLongIndexToken.status, true);
	// 	assert.equal(finalizeShortIndexToken.status, true);

	// 	const shortOITEtherBalance = await web3.eth.getBalance(shortOIT.address);
	// 	console.log("Wei wrapped in short OutcomeIndexToken:", shortOITEtherBalance);
	// 	const longOITEtherBalance = await web3.eth.getBalance(longOIT.address);
	// 	console.log("Wei wrapped in long OutcomeIndexToken:", longOITEtherBalance);

	// });

	// it('Long winnings should be equal to weight * winnings / 100', async () => {
	// 	const beforeBalance = await web3.eth.getBalance(accountOne);
	// 	console.log("balance before long owner claim: ", beforeBalance);

	// 	await longOIT.methods.claim().send({ from: accountOne });

	// 	const afterBalance = await web3.eth.getBalance(accountOne);
	// 	console.log("balance after long owner claim: ", afterBalance)
	// });

	// it('Short winnings should be equal to weight * winnings / 100', async () => {
	// 	const beforeBalance = await web3.eth.getBalance(accountOne);
	// 	console.log("balance before short owner claim: ", beforeBalance);

	// 	await shortOIT.methods.claim().send({ from: accountOne });

	// 	const afterBalance = await web3.eth.getBalance(accountOne);
	// 	console.log("balance after short owner claim: ", afterBalance)
	// });

});