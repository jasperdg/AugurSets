pragma solidity ^0.4.22;


contract IRepPriceOracle {
    function setRepPriceInAttoEth(uint256 _repPriceInAttoEth) external returns (bool);
    function getRepPriceInAttoEth() external view returns (uint256);
}
