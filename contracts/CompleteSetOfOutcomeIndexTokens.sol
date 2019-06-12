pragma solidity >= 0.4.22;
pragma experimental ABIEncoderV2;
import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./OutcomeIndexToken.sol";
import "./Market.sol";

// Make mintable unlimited allowance token.
contract CompleteSetOfOutcomeIndexTokens is MintableERC20Token {
	using SafeMathLib for uint256;

	OutcomeIndexToken[] outcomeIndexTokens;
	Market[] markets;
	mapping(address => uint256) marketsToWeight;

	constructor (
		Market[] _markets,
		address[][] _index,
		uint256[] _weights
	)  
	public 
	{
		require(_markets.length == _weights.length);
		for (uint256 i = 0; i < _index.length; i++) {
			outcomeIndexTokens.push(new OutcomeIndexToken(_markets, _index[i], _weights, i));
		}
		for (uint256 x = 0; x < _markets.length; x++) {
			marketsToWeight[_markets[x]] = _weights[x];
		}
		markets = _markets;
	}

	function buyCompleteSet(
		uint256 _amountOfShares
	)
	public
	payable {
		require(msg.value > 0);
		for (uint256 i = 0; i < markets.length; i++) {
			uint256 weightedAmount = msg.value.mul(marketsToWeight[markets[i]]).div(100);
			markets[i].buyCompleteSet.value(weightedAmount)(outcomeIndexTokens);
		}
		for (uint256 x = 0; x < outcomeIndexTokens.length; x++){
			outcomeIndexTokens[x].mint(msg.sender, msg.value);
		}
	}
}