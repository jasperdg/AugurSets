pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./MarketOutcomeToken.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";


contract OutcomeTokenIndex is MintableERC20Token {
	using SafeMathLib for uint256;

	string public name = "MultiMarketIndexToken";
	string public symbol = "MMIT";
	uint256 public decimals = 18;
	bool outcomeTokenIndexFinalized = false;

	address[] public index;
	mapping(address => uint256) indexToWeight;

	constructor(address[] _index, uint256[] _weights) public {
		require(_weights.length == _index.length);
		for (uint i = 0; i < _index.length; i++) {
			indexToWeight[_index[i]] = _weights[i];
		}
		index = _index;

		// Set unlimited allowance for the 0x contract

	}

	/// @dev purchases the index positions
	/// @param _amountOfShares is the amount of 
	function purchaseIndex(address _to, uint256 _amountOfShares) public payable {
		require(msg.value > 0);
		for (uint i = 0; i < index.length; i++) {
			uint256 weightedAmount = msg.value.mul(indexToWeight[index[i]]).div(100);
			
			// In a testnet version this would happen in ComleteSetOfOutcomeTokenIndexes by 
			// purchasing complete sets of shares and distributing these back to the OutcomeTokenIndexes.
			MarketOutcomeToken(index[i]).purchase.value(weightedAmount)();
		}
		
		_mint(_to, _amountOfShares);
	}

	function getIndexBalance(MarketOutcomeToken _token) public view returns(uint256 balances){
		return _token.balanceOf(address(this));
	}


	function withdraw() public {
		require(outcomeTokenIndexFinalized);
		msg.sender.transfer(balances[msg.sender].div(2));
		_burn(msg.sender, balances[msg.sender]);
	}

	function indexMarketsFinalized() public view returns (bool resolved) {
		for (uint i = 0; i < index.length; i++) {
			if (MarketOutcomeToken(index[i]).isFinalized() == false) {
				return false;
			}
		}

		return true;
	}

	function deposit() public payable {}

	function finalize() public {
		require(indexMarketsFinalized());
		require(!outcomeTokenIndexFinalized);

		for (uint x = 0; x < index.length; x++) {
			MarketOutcomeToken(index[x]).withdraw();
		}

		outcomeTokenIndexFinalized = true;
	}

}