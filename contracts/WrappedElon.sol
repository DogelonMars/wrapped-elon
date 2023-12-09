// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WrappedElon is ERC20, Ownable {
    ERC20 public elon = ERC20(0x761D38e5ddf6ccf6Cf7c55759d5210750B5D60F3);
    bool public wrapEnabled = true;
    bool public unwrapEnabled = true;

    event Wrap(address addr, uint256 elonAmount, uint256 wrappedAmount);
    event Unwrap(address addr, uint256 elonAmount, uint256 wrappedAmount);

    constructor() ERC20("ELON", "Dogelon Mars") {}

    function decimals() public view virtual override returns (uint8) {
        return 4;
    }

    function wrap(uint256 elonAmount) public {
        require(wrapEnabled, "Wrapping currently disabled");
        require(elonAmount >= 100_000_000_000_000, "Can only wrap 0.0001 ELON or greater");
        uint256 wrappedAmount = elonAmount / 100_000_000_000_000;
        uint256 wrappableElon = wrappedAmount * 100_000_000_000_000;
        elon.transferFrom(msg.sender, address(this), wrappableElon);
        _mint(msg.sender, wrappedAmount);
        emit Wrap(msg.sender, wrappableElon, wrappedAmount);
    }

    function unwrap(uint256 wrappedAmount) public {
        require(unwrapEnabled, "Unwrapping currently disabled");
        require(wrappedAmount > 0, "Cannot unwrap zero tokens");
        uint256 elonAmount = wrappedAmount * 100_000_000_000_000;
        _burn(msg.sender, wrappedAmount);
        elon.transfer(msg.sender, elonAmount);
        emit Unwrap(msg.sender, elonAmount, wrappedAmount);
    }

    function setEnabledState(bool _wrapEnabled, bool _unwrapEnabled) public onlyOwner {
        wrapEnabled = _wrapEnabled;
        unwrapEnabled = _unwrapEnabled;
    }
}
