const MarketOutcomeToken = artifacts.require("MarketOutcomeToken.sol");
const OutcomeIndexToken = artifacts.require("OutcomeIndexToken.sol");
const CompleteSetOfOutcomeIndexToken = artifacts.require("CompleteSetOfOutcomeIndexToken.sol");
const utils = require("web3-utils");
const { fromWei, toWei, toBN } = utils;
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
	let longIndex;
	let shortIndex;
	let completeIndexSet; 
	const weights = [20, 40, 40];

	it('Create all contracts that are used for the test', async () => {

		const longIndexPromises = weights.map(() => MarketOutcomeToken.new()); // Augur OutcomeToken simulations
		const shortIndexPromises = weights.map(() => MarketOutcomeToken.new()); // Augur OutcomeToken simulations
		
		longIndex = await Promise.all(longIndexPromises);
		shortIndex = await Promise.all(shortIndexPromises);

		const longIndexAddresses = longIndex.map(i => i.address);
		const shortIndexAddresses = shortIndex.map(i => i.address);

		shortOTI = await OutcomeIndexToken.new(shortIndexAddresses, weights);
		longOTI = await OutcomeIndexToken.new(longIndexAddresses, weights);

		completeIndexSet = await CompleteSetOfOutcomeIndexToken.new(shortOTI.address, longOTI.address);
	});

	it('Should be able to purchase a complete set of OutcomeIndexTokens', async () => {
		const { receipt } = await completeIndexSet.buyCompleteSet(oneEthInWei, {from: accountOne, value: oneEthInWei.toString()});
		assert.equal(receipt.status, true);
	})

	it('Balance of indexTokens should be increased for each market in the index', async () => {
		const shortPromArr = shortIndex.map(indexToken => {
			return shortOTI.getIndexBalance(indexToken.address);
		})

		const longPromArr = longIndex.map(indexToken => {
			return longOTI.getIndexBalance(indexToken.address);
		})
		
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
		const accountOneShortBalance = await shortOTI.balanceOf(accountOne);
		const accountOneLongBalance = await longOTI.balanceOf(accountOne);

		console.log("Short balance:", accountOneShortBalance.toString());
		assert.equal(accountOneShortBalance.toString(), oneEthInWei.toString());
		console.log("Long balance:", accountOneLongBalance.toString());
		assert.equal(accountOneLongBalance.toString(), oneEthInWei.toString());
	})

	it('Should be able to check if the indexes are finalized', async () => {
		const shortMarketsFinalized = await shortOTI.indexMarketsFinalized();
		const longMarketsFinalized = await longOTI.indexMarketsFinalized();

		assert.equal(shortMarketsFinalized, true);
		assert.equal(longMarketsFinalized, true);
	});

	it('Should be able to withdraw the IndexToken their eth in exchange for tokens in each outcome token.', async () => {
		const finalizeShortIndexToken = await shortOTI.finalize({ from: accountOne });
		const finalizeLongIndexToken = await longOTI.finalize({ from: accountOne });

		assert.equal(finalizeLongIndexToken.receipt.status, true);
		assert.equal(finalizeShortIndexToken.receipt.status, true);

		const shortOTIEtherBalance = await web3.eth.getBalance(shortOTI.address);
		assert.equal(shortOTIEtherBalance.toString(), oneEthInWei.div(toBN(2)).toString());

		const longOTIEtherBalance = await web3.eth.getBalance(longOTI.address);
		assert.equal(longOTIEtherBalance.toString(), oneEthInWei.div(toBN(2)).toString());
	});

	it('If everything is finalized the user should be able to withdraw his winnings from the index token', async () => {
		const beforeBalance = await web3.eth.getBalance(accountOne);
		await shortOTI.withdraw({ from: accountOne });
		await longOTI.withdraw({ from: accountOne });
		const afterBalance = await web3.eth.getBalance(accountOne);
		console.log("balance before withdrawl: ", beforeBalance);
		console.log("balance after withdrawl: ", afterBalance)
	})

})