pragma solidity >= 0.4.22;
pragma experimental ABIEncoderV2;

import "./OutcomeIndexToken.sol";

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";

import "./../libraries/augur/source/contracts/reporting/IMarket.sol";
import "./../libraries/augur/source/contracts/trading/IShareToken.sol";
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
	OutcomeIndexToken[] public outcomeIndexTokens;
	IMarket[] markets;
	IShareToken[][] indexes;
	
	uint256[] internal payoutDistribution;
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
		require(_markets.length == _weights.length);
		// Make sure all weights add up to 100
		require(validateWeights(_weights));
		// Make sure all markets are within the same universe
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

	// Needs to have a payable function to receive Ether on payouts, checks if the sender is the Cash contract.
	function () public payable {
		require(msg.sender == address(cash));
	}

	function buyCompleteSet()
	public
	payable {
		require(msg.value > NUM_TICKS);
		require(indexMarketsFinalized() == false);

		// Because NUM_TICKS are into play there sometimes is dust leftover after purchasing shares, keep track of the actual ether spend so that the dust can be returned to the sender. 
		uint256 totalSharesBought = 0;
		// Buy a complete set of shares for each market
		for (uint256 i = 0; i < markets.length; i++) {
			// Calculate the weighted amount of shares that need to be bought by the 
			uint256 weightedAmountInEth = msg.value.mul(marketsToWeight[markets[i]]).div(100);
			uint256 weightedAmountInAttoEth = weightedAmountInEth.div(markets[i].getNumTicks());
			totalSharesBought = totalSharesBought.add(weightedAmountInAttoEth);
			require(weightedAmountInEth >= markets[i].getNumTicks());
			completeSets.publicBuyCompleteSets.value(weightedAmountInEth)(markets[i], weightedAmountInAttoEth);
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

	// Calculates weighted payout distribution
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

	// Calculate a flat fee per outcome
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

	// Distributes a users proceeds.
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

	// Returns an array representing the payout distribution
	function getPayoutDistribution() 
	public
	view 
	returns(uint256[])
	{
		return payoutDistribution;
	}

	// Returns true if an array of markets are all active in the same universe.
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

	// Returns true if an array of integers adds up to 100
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
		
	// Returns the set's balance of a certain outcome within a market
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