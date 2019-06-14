pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./OutcomeIndexToken.sol";
import "./Market.sol";

/* 
	NOTICE: This is a dummy contract that simulates some of the behaviour of Augur outcome token contracts.
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
		address _from,
		uint256 _amount
	) 
	public 
	{
		require(msg.sender == address(market));
		_burn(_from, _amount);
	}
}