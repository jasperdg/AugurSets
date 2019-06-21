pragma solidity >= 0.4.22;
pragma experimental ABIEncoderV2;

import "./OutcomeIndexToken.sol";

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";

import "./../libraries/augur/source/contracts/trading/IShareToken.sol";
import "./../libraries/augur/source/contracts/reporting/IMarket.sol";
import "./../libraries/augur/source/contracts/trading/CompleteSets.sol";
import "./../libraries/augur/source/contracts/trading/ICash.sol";
import "./../libraries/augur/source/contracts/trading/ClaimTradingProceeds.sol";

/* 
	TODO: 
	- Make more readible by adding in comments and temp variables
*/

contract CompleteSetOfOutcomeIndexTokens is MintableERC20Token {
	using SafeMathLib for uint256;

	CompleteSets constant private completeSets = CompleteSets(0x48FCc9d538B9C86bA9D35b3eB0e7f64EE2B4664f);
	ICash constant private cash = ICash(0x2Da4d465978981BD75BbaC4C9f3bdA10bE0B465c);
	ClaimTradingProceeds constant private claimTradingProceeds = ClaimTradingProceeds(0x9e94fdea4aace8c61eeb1dc2d3c55bfc7b7e8739);
	address constant private augur = 0x990B2D2aF7e87cd015A607c3A95d7622c9bBeDe1;

	mapping(address => uint256) marketsToWeight;

	OutcomeIndexToken[] public outcomeIndexTokens;
	IMarket[] markets;
	IShareToken[][] indexes;
	bool marketsFinalized = false;

	constructor (
		IMarket[] _markets,
		uint256[] _weights,
		uint256 _numOutcomes
	)  
	public 
	{
		// For each market there needs to be a decision on how weight it carries
		require(_markets.length == _weights.length);

		for (uint256 outcome = 0; outcome < _numOutcomes; outcome++) {
			// Create ERC20 token representing an index of outcomes
			outcomeIndexTokens.push(new OutcomeIndexToken());

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
		
		// Approve augur to trade Cash for this contract
		cash.approve(augur, uint256(-1));

		markets = _markets;
	}

	function buyCompleteSet(
		uint256 _amountOfShares
	)
	public
	payable {
		require(msg.value > 0);
		// Buy a complete set of shares for each market
		for (uint256 i = 0; i < markets.length; i++) {
			// Calculate the amount of shares that have to be bought 
			uint256 weightedAmount = msg.value.mul(marketsToWeight[markets[i]]).div(100);
			require(weightedAmount >= markets[i].getNumTicks());
			completeSets.publicBuyCompleteSets.value(weightedAmount)(markets[i], weightedAmount);
		}
		// For each existing index token mint the amount in eth for the sender
		for (uint256 y = 0; y < outcomeIndexTokens.length; y++){
			outcomeIndexTokens[y].mint(msg.sender, msg.value);
		}
	}

	// Returns the contract's ShareToken balance of a certain market
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
		require(!marketsFinalized);

		for (uint x = 0; x < markets.length; x++) {
			claimTradingProceeds.claimTradingProceeds(markets[x], address(this));
		}

		marketsFinalized = true;
	}


	// function claim() 
	// public 
	// {
	// 	require(outcomeIndexTokenFinalized);
	// 	if (winningsByWeight > 0) {
	// 		uint256 weightedEarnings = winningsByWeight.mul(balances[msg.sender]).div(100);
	// 		msg.sender.transfer(weightedEarnings);
	// 	}
	// 	_burn(msg.sender, balances[msg.sender]);
	// }

}