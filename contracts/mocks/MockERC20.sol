// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
  constructor(
    string memory name,
    string memory symbol,
    uint256 supply
  ) public ERC20(name, symbol) {
    _mint(msg.sender, supply);
  }

  function mintTo(address to, uint256 amount) public {
    _mint(to, amount);
  }
}
