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

// TODO: simulate market resolving into a winner and winner getting the profit
// TODO: create 2 scenario's: 1. WTA, 2. WTM

contract('multiMarketIndexToken', (accounts) => {
	const accountOne = accounts[0];
	let shortOTI;
	let longOTI;
	let longIndexAddresses;
	let shortIndexAddresses;
	let completeIndexSet; 
	let marketIndex;
	const weights = [20, 40, 40];
	const results = [1, 1, 1] // Long wins;

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
		const shortOTIAddress = await completeIndexSet.outcomeIndexTokens("0");
		const longOTIAddress = await completeIndexSet.outcomeIndexTokens("1");
		shortOTI = new web3.eth.Contract(abi, shortOTIAddress);
		longOTI = new web3.eth.Contract(abi, longOTIAddress);
	});

	it('Balance of indexTokens should be increased for each market in the index', async () => {
		const shortPromArr = shortIndexAddresses.map(address => {
			return shortOTI.methods.getIndexBalance(address).call();
		});

		const longPromArr = longIndexAddresses.map(address => {
			return longOTI.methods.getIndexBalance(address).call();
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
		const accountOneShortBalance = await shortOTI.methods.balanceOf(accountOne).call();
		const accountOneLongBalance = await longOTI.methods.balanceOf(accountOne).call();

		console.log("Short balance:", accountOneShortBalance.toString());
		assert.equal(accountOneShortBalance.toString(), oneEthInWei.toString());
		console.log("Long balance:", accountOneLongBalance.toString());
		assert.equal(accountOneLongBalance.toString(), oneEthInWei.toString());
	})

	it('Should be able to check if the indexes are finalized', async () => {
		const shortMarketsFinalized = await shortOTI.methods.indexMarketsFinalized().call();
		const longMarketsFinalized = await longOTI.methods.indexMarketsFinalized().call();

		assert.equal(shortMarketsFinalized, true);
		assert.equal(longMarketsFinalized, true);
	});

	it('Should be able to withdraw the IndexToken their eth in exchange for tokens in each outcome token.', async () => {	

		const finalizeShortIndexToken = await shortOTI.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });
		const finalizeLongIndexToken = await longOTI.methods.finalize().send({ from: accountOne, gas: "6000000", gasPrice: "1" });

		assert.equal(finalizeLongIndexToken.status, true);
		assert.equal(finalizeShortIndexToken.status, true);

		const shortOTIEtherBalance = await web3.eth.getBalance(shortOTI.address);
		assert.equal(shortOTIEtherBalance.toString(), "0");

		const longOTIEtherBalance = await web3.eth.getBalance(longOTI.address);
		assert.equal(longOTIEtherBalance.toString(), oneEthInWei.toString());
	});

	it('If everything is finalized the user should be able to withdraw his winnings from the index token', async () => {
		const beforeBalance = await web3.eth.getBalance(accountOne);
		console.log("balance before claim: ", beforeBalance);
		await longOTI.methods.claim().send({ from: accountOne });
		const afterBalance = await web3.eth.getBalance(accountOne);
		console.log("balance after withdrawl: ", afterBalance)
	})

})