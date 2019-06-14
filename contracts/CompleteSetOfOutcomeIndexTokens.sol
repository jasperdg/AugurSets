pragma solidity >= 0.4.22;
pragma experimental ABIEncoderV2;
import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./OutcomeIndexToken.sol";
import "./MarketOutcomeToken.sol";
import "./Market.sol";

/* 
	TODO: 
	- Make more readible by adding in comments and temp variables
*/

contract CompleteSetOfOutcomeIndexTokens is MintableERC20Token {
	using SafeMathLib for uint256;

	OutcomeIndexToken[] public outcomeIndexTokens;
	Market[] markets;
	mapping(address => uint256) marketsToWeight;

	constructor (
		Market[] _markets,
		address[][] _indexes,
		uint256[] _weights
	)  
	public 
	{
		require(_markets.length == _weights.length);

		for (uint256 i = 0; i < _indexes.length; i++) {
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
			markets[i].buyCompleteSet.value(weightedAmount)();

			for (uint256 x = 0; x < outcomeIndexTokens.length; x++){
				MarketOutcomeToken(markets[i].outcomeTokens(x)).transfer(address(outcomeIndexTokens[x]), weightedAmount.div(markets[x].numTicks()));
			}
		}
		for (uint256 y = 0; y < outcomeIndexTokens.length; y++){
			outcomeIndexTokens[y].mint(msg.sender, msg.value);
		}
	}
}