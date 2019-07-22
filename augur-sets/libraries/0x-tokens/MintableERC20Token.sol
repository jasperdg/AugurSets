pragma solidity ^0.4.22;

import "./../openzeppelin-solidity/SafeMathLib.sol";
import "./UnlimitedAllowanceERC20Token.sol";


contract MintableERC20Token is 
    UnlimitedAllowanceERC20Token
{
    using SafeMathLib for uint256;

    function _mint(address _to, uint256 _value)
        internal
    {
        balances[_to] = balances[_to].add(_value);
        _totalSupply = _totalSupply.add(_value);

         emit Transfer(
            address(0),
            _to,
            _value
        );
    }

    function _burn(address _owner, uint256 _value)
    internal
    {
        balances[_owner] = balances[_owner].sub(_value);
        _totalSupply = _totalSupply.sub(_value);

         emit Transfer(
            _owner,
            address(0),
            _value
        );
    }
}
