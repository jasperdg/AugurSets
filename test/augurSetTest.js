const CompleteSetOfOutcomeIndexTokens = artifacts.require("CompleteSetOfOutcomeIndexTokens.sol");
const Market = artifacts.require("Market.sol");
const { abi } = require("./../build/contracts/OutcomeIndexToken");
const utils = require("web3-utils");
const { fromWei, toWei, toBN } = utils;
const { mineTx } = require("./../utils/transactionMinedAsync");
const Web3 = require('web3');
const oneEthInWei = toBN(toWei("1", "ether"));
const NUM_TICKS = 10000;
const web3 = new Web3("http://localhost:8545")

contract('multiMarketIndexToken', (accounts) => {
	const accountOne = accounts[0];
	let shortOIT;
	let longOIT;
	let longIndexAddresses;
	let shortIndexAddresses;
	let completeIndexSet; 
	let marketIndex;
	const weights = [20, 40, 40];
	// const results = [1, 1, 1] // Long wins;
	const results = [0, 1, 0] // Split winnings;

	it('Create all contracts that are used for the test', async () => {
		const marketPromises = weights.map((d, i) => Market.new(results[i].toString()));
		marketIndex = await Promise.all(marketPromises);
		const marketIndexAddresses = marketIndex.map(market => market.address);

		
		const shortPromiseIndex = marketIndex.map(market => market.outcomeTokens("0"));
		shortIndexAddresses = await Promise.all(shortPromiseIndex);

		const longPromiseIndex = marketIndex.map(market => market.outcomeTokens("1"));
		longIndexAddresses = await Promise.all(longPromiseIndex);

		completeIndexSet = await CompleteSetOfOutcomeIndexTokens.new(marketIndexAddresses, [shortIndexAddresses, longIndexAddresses], weights);
	});

	it('Should be able to purchase a complete set of OutcomeIndexTokens', async () => {
		const { receipt } = await completeIndexSet.buyCompleteSet(oneEthInWei, {from: accountOne, value: oneEthInWei});
		assert.equal(receipt.status, true);
	});

	it('Should be able to get both instances of the index tokens', async () => {
		const shortOITAddress = await completeIndexSet.outcomeIndexTokens("0");
		const longOITAddress = await completeIndexSet.outcomeIndexTokens("1");
		shortOIT = new web3.eth.Contract(abi, shortOITAddress);
		longOIT = new web3.eth.Contract(abi, longOITAddress);
	});

	it('Balance of indexTokens should be increased for each market in the index', async () => {
		const shortPromArr = shortIndexAddresses.map(address => {
			return shortOIT.methods.getIndexBalance(address).call();
		});

		const longPromArr = longIndexAddresses.map(address => {
			return longOIT.methods.getIndexBalance(address).call();
		});
		
		const shortBalances = await Promise.all(shortPromArr);
		const longBalances = await Promise.all(longPromArr);

		shortBalances.forEach((balance, i) => {
			const weightedBalance = oneEthInWei.mul(toBN(weights[i])).div(toBN(NUM_TICKS * 100));
			assert.equal(balance.toString(), weightedBalance.toString());
		});

		longBalances.forEach((balance, i) => {
			const weightedBalance = oneEthInWei.mul(toBN(weights[i])).div(toBN(NUM_TICKS * 100));
			assert.equal(balance.toString(), weightedBalance.toString());
		});
	});

	it('Balance of accountOne should be equal to 1 of each index tokens', async () => {
		const accountOneShortBalance = await shortOIT.methods.balanceOf(accountOne).call();
		const accountOneLongBalance = await longOIT.methods.balanceOf(accountOne).call();

		console.log("Short OutcomeIndexToken balance:", accountOneShortBalance.toString());
		assert.equal(accountOneShortBalance.toString(), oneEthInWei.toString());
		console.log("Long OutcomeIndexToken balance:", accountOneLongBalance.toString());
		assert.equal(accountOneLongBalance.toString(), oneEthInWei.toString());
	});

	it('Should be able to check if the indexes are finalized', async () => {
		const shortMarketsFinalized = await shortOIT.methods.indexMarketsFinalized().call();
		const longMarketsFinalized = await longOIT.methods.indexMarketsFinalized().call();

		assert.equal(shortMarketsFinalized, true);
		assert.equal(longMarketsFinalized, true);
	});

	it('Should be able to withdraw the IndexToken their eth in exchange for tokens in each outcome token.', async () => {	

		const finalizeShortIndexToken = await shortOIT.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });
		const finalizeLongIndexToken = await longOIT.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });

		assert.equal(finalizeLongIndexToken.status, true);
		assert.equal(finalizeShortIndexToken.status, true);

		const shortOITEtherBalance = await web3.eth.getBalance(shortOIT.address);
		console.log("Wei wrapped in short OutcomeIndexToken:", shortOITEtherBalance);
		const longOITEtherBalance = await web3.eth.getBalance(longOIT.address);
		console.log("Wei wrapped in long OutcomeIndexToken:", longOITEtherBalance);

	});

	it('Long winnings should be equal to weight * winnings / 100', async () => {
		const beforeBalance = await web3.eth.getBalance(accountOne);
		console.log("balance before long owner claim: ", beforeBalance);

		await longOIT.methods.claim().send({ from: accountOne });

		const afterBalance = await web3.eth.getBalance(accountOne);
		console.log("balance after long owner claim: ", afterBalance)
	});

	it('Short winnings should be equal to weight * winnings / 100', async () => {
		const beforeBalance = await web3.eth.getBalance(accountOne);
		console.log("balance before short owner claim: ", beforeBalance);

		await shortOIT.methods.claim().send({ from: accountOne });

		const afterBalance = await web3.eth.getBalance(accountOne);
		console.log("balance after short owner claim: ", afterBalance)
	});

});