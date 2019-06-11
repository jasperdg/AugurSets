pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./OutcomeTokenIndex.sol";
/* 
	For this implementation of MultiMarketIndexToken we're assuming that all markets are conmnected
	and that the user will choose to take one particulair position in these markets. 
*/

contract MarketOutcomeToken is MintableERC20Token {
	using SafeMathLib for uint256;
	
	bool public isFinalized = true;
	uint256 public numTicks = 10000;

	function purchase() public payable {
		require (msg.value > numTicks);
		_mint(msg.sender, msg.value.div(numTicks.div(2)));
	}

	function withdraw() public {
		require(isFinalized);
		require (balances[msg.sender] > 0);
		OutcomeTokenIndex(msg.sender).deposit.value(balances[msg.sender].div(2).mul(numTicks))();
		_burn(msg.sender, balances[msg.sender]);
	}

}