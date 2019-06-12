pragma solidity >= 0.4.22;

import "./MarketOutcomeToken.sol";

contract Market {
	MarketOutcomeToken[] public outcomeTokens;
	uint16 winner;

	constructor(uint16 _winningOutcome) {
		for (uint16 i = 0; i < 1; i++) {
			outcomeTokens.push(new MarketOutcomeToken(this));
		}
		winner = _winningOutcome;
	}

	function deposit() 
	public 
	payable
	{
		require(isOutcomeToken(msg.sender));
	}

	function withdrawTo(
		uint256 _amount, 
		address _to
	)
	internal
	{
		require(isWinningToken());
		_to.transfer(_amount);
	}

	function isOutcomeToken(
		address _sender
	)
	view
	returns(bool)
	{
		for (uint i = 0; i < outcomeTokens.length; i++) {
			if (address(outcomeTokens[i]) == _sender) return true;
		}
		return false;
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