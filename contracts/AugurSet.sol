pragma solidity >= 0.4.22;
pragma experimental ABIEncoderV2;

import "./OutcomeIndexToken.sol";

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";

import "./../libraries/augur/source/contracts/trading/IShareToken.sol";
import "./../libraries/augur/source/contracts/reporting/IMarket.sol";

import "./../libraries/augur/source/contracts/TimeControlled.sol";
import "./../libraries/augur/source/contracts/Augur.sol";
import "./../libraries/augur/source/contracts/reporting/Market.sol";
import "./../libraries/augur/source/contracts/reporting/Reporting.sol";
import "./../libraries/augur/source/contracts/reporting/IUniverse.sol";

import "./../libraries/augur/source/contracts/reporting/Universe.sol";
import "./../libraries/augur/source/contracts/reporting/FeeWindow.sol";
import "./../libraries/augur/source/contracts/trading/CompleteSets.sol";
import "./../libraries/augur/source/contracts/trading/ICash.sol";
import "./../libraries/augur/source/contracts/trading/ClaimTradingProceeds.sol";

import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
 
contract AugurSet is MintableERC20Token {
	using SafeMathLib for uint256;

	CompleteSets internal completeSets;
	ICash internal cash;
	ClaimTradingProceeds internal claimTradingProceeds;
	address internal augur;

	uint256 NUM_TICKS = 10000;

	mapping(address => uint256) marketsToWeight;
	uint256[] internal payoutDistribution;

	OutcomeIndexToken[] public outcomeIndexTokens;
	IMarket[] markets;
	IShareToken[][] indexes;
	bool augurSetFinalized = false;

	constructor (
		IMarket[] _markets,
		uint256[] _weights,
		uint256 _numOutcomes,
		address _completeSets,
		address _cash,
		address _claimTradingProceeds,
		address _augur
	)  
	public 
	{
		// For each market there needs to be a decision on how weight it carries
		require(_markets.length == _weights.length);
		require(validateWeights(_weights));
		require(validateMarketUniverses(_markets));

		for (uint256 outcome = 0; outcome < _numOutcomes; outcome++) {
			// Create ERC20 token representing an index of outcomes
			OutcomeIndexToken outcomeIndexToken = new OutcomeIndexToken();
			outcomeIndexTokens.push(outcomeIndexToken);

			// Create an array with all ShareTokens
			IShareToken[] storage index;
			for (uint256 x = 0; x < _markets.length; x++) {
				index.push(_markets[x].getShareToken(outcome));
			}
			// Push the index array to an array containing all indexes
			indexes.push(index);
		}

		// Map weights to market
		for (uint256 y = 0; y < _markets.length; y++) {
			marketsToWeight[_markets[y]] = _weights[y];
		}
		
		// Set contract addresses to network instances
		completeSets = CompleteSets(_completeSets);
		cash = ICash(_cash);
		claimTradingProceeds = ClaimTradingProceeds(_claimTradingProceeds);
		augur = _augur;
		
		// Approve augur to trade Cash for this contract
		cash.approve(augur, uint256(-1));

		markets = _markets;
	}

	function () payable {}

	function buyCompleteSet()
	public
	payable {
		require(msg.value > 0);
		require(indexMarketsFinalized() == false);

		uint256 totalSharesBought = 0;
		// Buy a complete set of shares for each market
		for (uint256 i = 0; i < markets.length; i++) {
		// Calculate the amount of shares that have to be bought 
			uint256 weightedAmount = msg.value.mul(marketsToWeight[markets[i]]).div(100);
			uint256 totalSharesToBuy = weightedAmount.div(markets[i].getNumTicks());
			totalSharesBought = totalSharesBought.add(totalSharesToBuy);
			require(weightedAmount >= markets[i].getNumTicks());
			completeSets.publicBuyCompleteSets.value(weightedAmount)(markets[i], totalSharesToBuy);
		}
		// For each existing index token mint the amount in eth for the sender
		for (uint256 x = 0; x < outcomeIndexTokens.length; x++){

			outcomeIndexTokens[x].mint(msg.sender, totalSharesBought);
		}

		// Transfer back all eth that's left over
		msg.sender.transfer(msg.value - totalSharesBought.mul(NUM_TICKS));
	}

	// Check if each market in the index is finalized
	function indexMarketsFinalized() 
	public 
	view 
	returns (bool resolved) 
	{
		for (uint i = 0; i < markets.length; i++) {
			if (markets[i].isFinalized() == false) {
				return false;
			}
		}
		return true;
	}

	// If each market is finalized, this Index can be finalized, the contract will claim all winnings and distribute to the winning outcome holders
	function finalize() 
	public 
	{
		require(indexMarketsFinalized());
		require(!augurSetFinalized);
		calculatePayoutDistribution();
		for (uint i = 0; i < markets.length; i++) {
			claimTradingProceeds.claimTradingProceeds(markets[i], address(this));
		}		
		augurSetFinalized = true;
	}

	function calculatePayoutDistribution()
	private 
	{
		for (uint256 outcome = 0; outcome < outcomeIndexTokens.length; outcome++) {
			uint256 payoutForOutcome = 0;
			for (uint256 i = 0; i <  markets.length; i++) {
				IMarket market = markets[i];
				uint256 payoutNumerator = market.getWinningPayoutNumerator(outcome);
				if(payoutNumerator != 0) {
						uint256 weightedValue = payoutNumerator.mul(marketsToWeight[address(market)]).div(100);
						payoutForOutcome = payoutForOutcome.add(weightedValue);
				}
			}
			payoutDistribution.push(payoutForOutcome);
		}
	}

	function calculateFees(uint256 proceeds) 
	internal 
	returns(uint256) 
	{
		uint256 flatFee = 0;
		for (uint256 i = 0; i < markets.length; i++) {
			flatFee = flatFee.add(markets[i].deriveMarketCreatorFeeAmount(proceeds));
		}
		uint256 reportingFeeDevisor = markets[0].getUniverse().getOrCacheReportingFeeDivisor();
		flatFee = flatFee.add(proceeds.div(reportingFeeDevisor));
		return flatFee;
	}

	function claimProceeds() 
	public 
	{
		require(augurSetFinalized);
		uint256 totalProceeds = 0;
		
		for (uint256 i = 0; i < outcomeIndexTokens.length; i++) {
			uint256 balance = outcomeIndexTokens[i].balanceOf(msg.sender);
			if (balance > 0) {
				uint256 payoutNumerator = payoutDistribution[i];
				if (payoutNumerator != 0) {
					uint256 totalFee = calculateFees(balance.mul(payoutNumerator));
					totalProceeds = totalProceeds.add(balance.mul(payoutNumerator)).sub(totalFee);
				}
				outcomeIndexTokens[i].burn(msg.sender, balance);
			}
		}
		msg.sender.transfer(totalProceeds);
	}

	function getPayoutDistribution() 
	public
	view 
	returns(uint256[])
	{
		return payoutDistribution;
	}

	function validateMarketUniverses(IMarket[] _markets) 
	private 
	view 
	returns (bool) 
	{
		address universe = address(_markets[0].getUniverse());
		for (uint256 i = 1; i < _markets.length; i++) {
			address marketUniverse = address(_markets[i].getUniverse());
			if (marketUniverse != universe) return false;
		}
		return true;
	}

	function validateWeights(uint256[] _weights) 
	private 
	view 
	returns(bool) 
	{
		uint256 totalWeight = 0;
		for (uint256 i = 0; i < _weights.length; i++) {
			totalWeight = totalWeight.add(_weights[i]);
		}
		return totalWeight == 100;
	}
		

	function getMarketBalance(
		uint256 _outcome,
		IMarket _market
	) 
	public 
	view 
	returns(uint256 balances)
	{
		return _market.getShareToken(_outcome).balanceOf(address(this));
	}


}