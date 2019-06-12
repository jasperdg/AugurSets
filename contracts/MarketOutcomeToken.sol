pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./OutcomeIndexToken.sol";
import "./Market.sol";
/* 
	For this implementation of MultiMarketIndexToken we're assuming that all markets are conmnected
	and that the user will choose to take one particulair position in these markets. 
*/

contract MarketOutcomeToken is MintableERC20Token {
	using SafeMathLib for uint256;
	
	Market public market; // This only for the simulations
	
	constructor(Market _market) 
	public
	{
		market = _market;
	}

	function mint(
		address _to,
		uint256 _amount
	) 
	public 
	{
		require(msg.sender == address(market));
		_mint(_to, _amount);
	}

	function burn(
		address _to,
		uint256 _amount
	) 
	public 
	{
		require(msg.sender == address(market));
		_burn(_to, _amount);
	}
}