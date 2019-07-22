pragma solidity >= 0.4.22;

import "./../libraries/0x-tokens/MintableERC20Token.sol";

contract OutcomeIndexToken is MintableERC20Token {

	string public name = "Outcome Index Token";
	string public symbol = "OIT";
	uint256 public decimals = 18;
	
	address minter;

	constructor() 
	public 
	{
		minter = msg.sender;
	}

	function publicMint(
		address _to, 
		uint256 _amount
	)
	public 
	{
		require(msg.sender == minter);
		_mint(_to, _amount);
	}

	function publicBurn(
		address _from, 
		uint256 _amount
	)
	public 
	{
		require(msg.sender == minter);
		_burn(_from, _amount);
	}
}