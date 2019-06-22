pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";

contract OutcomeIndexToken is MintableERC20Token {

	string public name = "AugurSet";
	string public symbol = "AS";
	uint256 public decimals = 18;
	
	address minter;

	constructor() 
	public 
	{
		minter = msg.sender;
	}

	function mint(
		address _to, 
		uint256 _amount
	)
	public {
		require(msg.sender == minter);
		_mint(_to, _amount);
	}
}