pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";

/* 
	TODO: 
	- Make more readible by adding in comments and temp variables
*/

contract OutcomeIndexToken is MintableERC20Token {
	using SafeMathLib for uint256;

	string public name = "AugurSet";
	string public symbol = "AS";
	uint256 public decimals = 18;
	
	address minter;

	function mint(
		address _to, 
		uint256 _amount
	)
	public {
		require(msg.sender == minter);
		_mint(_to, _amount);
	}
}