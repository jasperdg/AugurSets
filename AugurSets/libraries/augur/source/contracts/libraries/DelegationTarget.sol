pragma solidity ^0.4.22;


import './../Controlled.sol';


contract DelegationTarget is Controlled {
    bytes32 public controllerLookupName;
}
