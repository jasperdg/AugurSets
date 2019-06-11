pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./OutcomeTokenIndex.sol";

// Make mintable unlimited allowance token.
contract CompleteSetOfOutcomeTokenIndexes is MintableERC20Token {
	using SafeMathLib for uint256;

	OutcomeTokenIndex shortOutcomeToken;
	OutcomeTokenIndex longOutcomeToken;

	constructor (
		OutcomeTokenIndex _shortOutcomeToken,
		OutcomeTokenIndex _longOutcomeToken
	) 
	public 
	{
		shortOutcomeToken = _shortOutcomeToken;
		longOutcomeToken = _longOutcomeToken;
	}

	function buyCompleteSet(
		uint256 _amountOfShares
	)
	public
	payable {
		require(msg.value > 0);
		shortOutcomeToken.purchaseIndex.value(msg.value.div(2))(msg.sender, _amountOfShares);
		longOutcomeToken.purchaseIndex.value(msg.value.div(2))(msg.sender, _amountOfShares);
	}
}