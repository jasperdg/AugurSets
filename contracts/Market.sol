pragma solidity >= 0.4.22;

import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./MarketOutcomeToken.sol";
import "./OutcomeIndexToken.sol";

contract Market {
	using SafeMathLib for uint256;

	MarketOutcomeToken[] public outcomeTokens;
	uint256 public outcome;
	bool public isFinalized = true;
	uint256 public numTicks = 10000;

	constructor(uint256 _winningOutcome) {
		for (uint256 i = 0; i < 2; i++) {
			MarketOutcomeToken marketOutcomeToken = new MarketOutcomeToken(this);
			outcomeTokens.push(marketOutcomeToken);
		}
		outcome = _winningOutcome;
	}

	function buyCompleteSet(OutcomeIndexToken[] _to) 
	public 
	payable
	{
		require(msg.value > 0 && msg.value % 2 == 0);
		for (uint i = 0; i < outcomeTokens.length; i++) {
			outcomeTokens[i].mint(address(_to[i]), msg.value.div(numTicks));
		}
	}

	function claim(
		uint256 _outcome
	)
	public
	{
		require(isFinalized);
		require(_outcome == outcome);
		uint256 balance = outcomeTokens[_outcome].balanceOf(msg.sender);
		require(balance > 0);
		outcomeTokens[_outcome].burn(address(msg.sender), balance); 
		OutcomeIndexToken(msg.sender).deposit.value(balance.mul(numTicks))();
	}
}