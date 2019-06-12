pragma solidity >= 0.4.22;

import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./MarketOutcomeToken.sol";
import "./OutcomeIndexToken.sol";

contract Market {
	using SafeMathLib for uint256;

	MarketOutcomeToken[] public outcomeTokens;
	uint256 winner;
	bool public isFinalized = true;
	uint256 public numTicks = 10000;

	constructor(uint256 _winningOutcome) {
		for (uint256 i = 0; i < 1; i++) {
			outcomeTokens.push(new MarketOutcomeToken(this));
		}
		winner = _winningOutcome;
	}

	function buyCompleteSet(OutcomeIndexToken[] _to) 
	public 
	payable
	{
		require(msg.value > 0 && msg.value % 2 == 0);
		for (uint i = 0; i < outcomeTokens.length; i++) {
			outcomeTokens[i].mint(address(_to[i]), msg.value.div(2 * numTicks));
		}
	}

	function claim(
		uint256 _outcome
	)
	public
	{
		require(isFinalized);
		require(_outcome == winner);
		uint256 balance = outcomeTokens[_outcome].balanceOf(msg.sender);
		require(balance > 0);
		OutcomeIndexToken(msg.sender).deposit.value(balance.mul(2 * numTicks))();
		outcomeTokens[_outcome].burn(msg.sender, balance);
	}

	function isWinningToken(
		address _sender
	)
	view
	returns(bool)
	{
		if (address(outcomeTokens[winner]) == _sender) {
			return true;
		} else {
			return false;
		}
	}
}