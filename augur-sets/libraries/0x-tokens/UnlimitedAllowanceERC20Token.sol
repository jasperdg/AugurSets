
pragma solidity ^0.4.22;

import "./ERC20Token.sol";


contract UnlimitedAllowanceERC20Token is
    ERC20Token
{
    uint256 constant internal MAX_UINT = 2**256 - 1;

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        external
        returns (bool)
    {
        uint256 allowance = allowed[_from][msg.sender];
        require(
            balances[_from] >= _value,
            "ERC20_INSUFFICIENT_BALANCE"
        );
        require(
            allowance >= _value,
            "ERC20_INSUFFICIENT_ALLOWANCE"
        );
        require(
            balances[_to] + _value >= balances[_to],
            "UINT256_OVERFLOW"
        );

        balances[_to] += _value;
        balances[_from] -= _value;
        if (allowance < MAX_UINT) {
            allowed[_from][msg.sender] -= _value;
        }

         emit Transfer(
            _from,
            _to,
            _value
        );

        return true;
    }
}
