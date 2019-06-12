pragma solidity >= 0.4.22;

import "./../libraries/0x/contracts/erc20/contracts/src/MintableERC20Token.sol";
import "./MarketOutcomeToken.sol";
import "./../libraries/openzeppelin-solidity/SafeMathLib.sol";
import "./Market.sol";

contract OutcomeIndexToken is MintableERC20Token {
	using SafeMathLib for uint256;

	string public name = "MultiMarketIndexToken";
	string public symbol = "MMIT";
	address minter;
	uint256 public decimals = 18;
	bool OutcomeIndexTokenFinalized = false;
	uint256 outcome;

	address[] public index;
	Market[] public markets;
	mapping(address => uint256) indexToWeight;

	constructor(
		Market[] _markets,
		address[] _index,
		uint256[] _weights, 
		uint256 _outcome
	) 
	public 
	{
		require(_weights.length == _index.length);
		for (uint i = 0; i < _index.length; i++) {
			indexToWeight[_index[i]] = _weights[i];
		}
		minter = address(msg.sender);
		index = _index;
		markets = _markets;
		uint256 outcome = _outcome;
		// Set unlimited allowance for the 0x contract
	}

	function mint(
		address _to, 
		uint256 _amount
	)
	public {
		require(msg.sender == minter);
		_mint(_to, _amount);
	}


	function getIndexBalance(
		MarketOutcomeToken _token
	) 
	public 
	view 
	returns(uint256 balances)
	{
		return _token.balanceOf(address(this));
	}


	function claim() 
	public 
	{
		require(OutcomeIndexTokenFinalized);
		msg.sender.transfer(balances[msg.sender].div(2));
		_burn(msg.sender, balances[msg.sender]);
	}

	function indexMarketsFinalized() 
	public 
	view 
	returns (bool resolved) 
	{
		for (uint i = 0; i < index.length; i++) {
			if (markets[i].isFinalized() == false) {
				return false;
			}
		}

		return true;
	}

	function deposit() public payable {}

	function finalize() 
	public 
	{
		require(indexMarketsFinalized());
		require(!OutcomeIndexTokenFinalized);

		for (uint x = 0; x < markets.length; x++) {
			markets[x].claim(outcome);
		}

		OutcomeIndexTokenFinalized = true;
	}

}